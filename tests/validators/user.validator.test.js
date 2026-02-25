const {
    createUserSchema, updateUserSchema,
    updateProfileSchema, changePasswordSchema
} = require('../../src/validators/user.validator');

describe('User Validators', () => {
    describe('createUserSchema', () => {
        it('should pass with valid data', () => {
            const result = createUserSchema.safeParse({
                email: 'user@test.com',
                password: '123456',
                name: 'New User'
            });
            expect(result.success).toBe(true);
        });

        it('should pass with optional role', () => {
            const result = createUserSchema.safeParse({
                email: 'user@test.com',
                password: '123456',
                name: 'New User',
                role: 'ACCOUNTANT'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with short password', () => {
            const result = createUserSchema.safeParse({
                email: 'user@test.com',
                password: '12',
                name: 'User'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateUserSchema', () => {
        it('should pass with partial fields', () => {
            const result = updateUserSchema.safeParse({ role: 'CASHIER' });
            expect(result.success).toBe(true);
        });

        it('should pass with isActive boolean', () => {
            const result = updateUserSchema.safeParse({ isActive: false });
            expect(result.success).toBe(true);
        });

        it('should fail with invalid role', () => {
            const result = updateUserSchema.safeParse({ role: 'SUPERADMIN' });
            expect(result.success).toBe(false);
        });
    });

    describe('updateProfileSchema', () => {
        it('should pass with name only', () => {
            const result = updateProfileSchema.safeParse({ name: 'New Name' });
            expect(result.success).toBe(true);
        });

        it('should fail with invalid email', () => {
            const result = updateProfileSchema.safeParse({ email: 'bad' });
            expect(result.success).toBe(false);
        });
    });

    describe('changePasswordSchema', () => {
        it('should pass with valid passwords', () => {
            const result = changePasswordSchema.safeParse({
                currentPassword: 'oldpass',
                newPassword: 'newpass123'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with short new password', () => {
            const result = changePasswordSchema.safeParse({
                currentPassword: 'oldpass',
                newPassword: '12'
            });
            expect(result.success).toBe(false);
        });

        it('should fail with missing currentPassword', () => {
            const result = changePasswordSchema.safeParse({
                newPassword: 'newpass123'
            });
            expect(result.success).toBe(false);
        });
    });
});
