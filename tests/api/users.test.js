const request = require('supertest');
const express = require('express');

// Mock Prisma
const mockPrisma = require('../mocks/prisma.mock');
jest.mock('../../src/config/db', () => mockPrisma);

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: jest.fn()
}));

// Mock JWT to simulate an OWNER user
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn().mockReturnValue({ id: 'owner-1', email: 'owner@test.com', role: 'OWNER' })
}));

const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const userRoutes = require('../../src/routes/user.routes');
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

describe('Users API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: user is active
        mockPrisma.user.findUnique.mockResolvedValue({ isActive: true });
    });

    describe('GET /api/users/me', () => {
        it('should return own profile', async () => {
            // First call = isActive check, second call = getProfile
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({ isActive: true })
                .mockResolvedValueOnce({
                    id: 'owner-1',
                    email: 'owner@test.com',
                    name: 'Owner',
                    role: 'OWNER',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { orders: 5 }
                });

            const res = await request(app)
                .get('/api/users/me')
                .set('Authorization', 'Bearer mock-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe('owner@test.com');
        });
    });

    describe('PUT /api/users/me/password', () => {
        it('should return 400 for validation errors', async () => {
            const res = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', 'Bearer mock-token')
                .send({ newPassword: '12' });

            expect(res.status).toBe(400);
        });

        it('should return 400 if current password is wrong', async () => {
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({ isActive: true })
                .mockResolvedValueOnce({ id: 'owner-1', password: '$2b$10$hash' });
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', 'Bearer mock-token')
                .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('incorrect');
        });

        it('should change password with correct current password', async () => {
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({ isActive: true })
                .mockResolvedValueOnce({ id: 'owner-1', password: '$2b$10$hash' });
            bcrypt.compare.mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue({});

            const res = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', 'Bearer mock-token')
                .send({ currentPassword: 'oldpass', newPassword: 'newpass123' });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('changed');
        });
    });

    describe('GET /api/users', () => {
        it('should list users (Owner only)', async () => {
            mockPrisma.user.findMany.mockResolvedValue([
                { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'CASHIER' }
            ]);
            mockPrisma.user.count.mockResolvedValue(1);

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', 'Bearer mock-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.pagination).toBeDefined();
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user', async () => {
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({ isActive: true }) // auth check
                .mockResolvedValueOnce(null);               // email check
            mockPrisma.user.create.mockResolvedValue({
                id: 'u-new',
                email: 'new@test.com',
                name: 'New User',
                role: 'CASHIER',
                isActive: true
            });

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    email: 'new@test.com',
                    password: '123456',
                    name: 'New User'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should return 400 for duplicate email', async () => {
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({ isActive: true })
                .mockResolvedValueOnce({ id: 'existing' });

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    email: 'existing@test.com',
                    password: '123456',
                    name: 'Dup'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('already');
        });
    });

    describe('PATCH /api/users/:id/deactivate', () => {
        it('should prevent self-deactivation', async () => {
            const res = await request(app)
                .patch('/api/users/owner-1/deactivate')
                .set('Authorization', 'Bearer mock-token');

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('own account');
        });

        it('should deactivate another user', async () => {
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({ isActive: true })
                .mockResolvedValueOnce({ id: 'u2', name: 'Cashier' });
            mockPrisma.user.update.mockResolvedValue({});

            const res = await request(app)
                .patch('/api/users/u2/deactivate')
                .set('Authorization', 'Bearer mock-token');

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('deactivated');
        });
    });
});
