const { registerSchema, loginSchema } = require('../../src/validators/auth.validator');

describe('Auth Validators', () => {
    describe('registerSchema', () => {
        it('should pass with valid data', () => {
            const result = registerSchema.safeParse({
                email: 'test@test.com',
                password: '123456',
                name: 'Test User'
            });
            expect(result.success).toBe(true);
        });

        it('should pass with optional role', () => {
            const result = registerSchema.safeParse({
                email: 'test@test.com',
                password: '123456',
                name: 'Test User',
                role: 'OWNER'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with invalid email', () => {
            const result = registerSchema.safeParse({
                email: 'not-an-email',
                password: '123456',
                name: 'Test'
            });
            expect(result.success).toBe(false);
        });

        it('should fail with short password', () => {
            const result = registerSchema.safeParse({
                email: 'test@test.com',
                password: '123',
                name: 'Test'
            });
            expect(result.success).toBe(false);
        });

        it('should fail with missing name', () => {
            const result = registerSchema.safeParse({
                email: 'test@test.com',
                password: '123456'
            });
            expect(result.success).toBe(false);
        });

        it('should fail with invalid role', () => {
            const result = registerSchema.safeParse({
                email: 'test@test.com',
                password: '123456',
                name: 'Test',
                role: 'ADMIN'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        it('should pass with valid data', () => {
            const result = loginSchema.safeParse({
                email: 'test@test.com',
                password: '123456'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with missing password', () => {
            const result = loginSchema.safeParse({
                email: 'test@test.com'
            });
            expect(result.success).toBe(false);
        });

        it('should fail with invalid email', () => {
            const result = loginSchema.safeParse({
                email: '',
                password: '123456'
            });
            expect(result.success).toBe(false);
        });
    });
});
