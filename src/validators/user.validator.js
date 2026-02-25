const { z } = require('zod');

const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['CASHIER', 'ACCOUNTANT', 'OWNER']).optional()
});

const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['CASHIER', 'ACCOUNTANT', 'OWNER']).optional(),
    isActive: z.boolean().optional()
});

const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email('Invalid email format').optional()
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

module.exports = {
    createUserSchema,
    updateUserSchema,
    updateProfileSchema,
    changePasswordSchema
};
