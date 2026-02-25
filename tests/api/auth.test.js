const request = require('supertest');
const express = require('express');

// Mock Prisma before requiring any controllers
const mockPrisma = require('../mocks/prisma.mock');
jest.mock('../../src/config/db', () => mockPrisma);

// Mock bcrypt — auth controller uses genSalt + hash
jest.mock('bcrypt', () => ({
    genSalt: jest.fn().mockResolvedValue('$2b$10$salt'),
    hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: jest.fn().mockResolvedValue(true)
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ id: 'user-1', email: 'test@test.com', role: 'OWNER' })
}));

// Build a minimal app for testing
const app = express();
app.use(express.json());

const authRoutes = require('../../src/routes/auth.routes');
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

describe('Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should return 400 for invalid input', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'bad' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 if email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'exists@test.com',
                    password: '123456',
                    name: 'Test'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('already');
        });

        it('should return 201 for valid registration', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-1',
                email: 'new@test.com',
                name: 'New User',
                role: 'CASHIER',
                password: '$2b$10$hashedpassword'
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'new@test.com',
                    password: '123456',
                    name: 'New User'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 for validation errors', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: '' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 for non-existent user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nobody@test.com', password: '123456' });

            expect(res.status).toBe(401);
        });

        it('should return token for valid credentials', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'test@test.com',
                password: '$2b$10$hash',
                name: 'Test User',
                role: 'OWNER',
                isActive: true
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.com', password: '123456' });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
        });
    });
});
