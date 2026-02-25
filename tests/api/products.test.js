const request = require('supertest');
const express = require('express');

// Mock Prisma
const mockPrisma = require('../mocks/prisma.mock');
jest.mock('../../src/config/db', () => mockPrisma);

// Mock JWT to simulate an OWNER user
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn().mockReturnValue({ id: 'owner-1', email: 'owner@test.com', role: 'OWNER' })
}));

const app = express();
app.use(express.json());

const productRoutes = require('../../src/routes/product.routes');
app.use('/api/products', productRoutes);

// Error handler
app.use((err, req, res, next) => {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

describe('Products API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Auth middleware isActive check — always return active user
        mockPrisma.user.findUnique.mockResolvedValue({ isActive: true });
    });

    describe('GET /api/products', () => {
        it('should return paginated products', async () => {
            const mockProducts = [
                { id: 'p1', name: 'Nasi Goreng', price: 25000, stock: 50 }
            ];
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            mockPrisma.product.count.mockResolvedValue(1);

            const res = await request(app)
                .get('/api/products')
                .set('Authorization', 'Bearer mock-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.total).toBe(1);
        });

        it('should pass search param to Prisma', async () => {
            mockPrisma.product.findMany.mockResolvedValue([]);
            mockPrisma.product.count.mockResolvedValue(0);

            await request(app)
                .get('/api/products?search=nasi')
                .set('Authorization', 'Bearer mock-token');

            expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        name: { contains: 'nasi', mode: 'insensitive' }
                    })
                })
            );
        });
    });

    describe('POST /api/products', () => {
        it('should return 400 for validation errors', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', 'Bearer mock-token')
                .send({ name: '' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should create product with valid data', async () => {
            // category.findUnique for the category check in controller
            mockPrisma.category.findUnique.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Food' });
            mockPrisma.product.create.mockResolvedValue({
                id: 'p-new',
                name: 'Nasi Goreng',
                price: 25000,
                stock: 50,
                categoryId: '550e8400-e29b-41d4-a716-446655440000'
            });

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    name: 'Nasi Goreng',
                    price: 25000,
                    stock: 50,
                    categoryId: '550e8400-e29b-41d4-a716-446655440000'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Nasi Goreng');
        });

        it('should return 404 if category not found', async () => {
            mockPrisma.category.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    name: 'Test',
                    price: 10000,
                    categoryId: '550e8400-e29b-41d4-a716-446655440001'
                });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete a product', async () => {
            mockPrisma.product.delete.mockResolvedValue({});

            const res = await request(app)
                .delete('/api/products/p-1')
                .set('Authorization', 'Bearer mock-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 404 for non-existent product', async () => {
            const err = new Error('Not found');
            err.code = 'P2025';
            mockPrisma.product.delete.mockRejectedValue(err);

            const res = await request(app)
                .delete('/api/products/bad-id')
                .set('Authorization', 'Bearer mock-token');

            expect(res.status).toBe(404);
        });
    });
});
