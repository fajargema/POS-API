const { z } = require('zod');

const createDiscountSchema = z.object({
    code: z.string().min(1, 'Discount code is required').transform(val => val.toUpperCase()),
    type: z.enum(['PERCENTAGE', 'FIXED']).optional().default('PERCENTAGE'),
    value: z.number({ coerce: true }).positive('Discount value must be positive'),
    minPurchase: z.number({ coerce: true }).nonnegative().optional().nullable(),
    maxUses: z.number({ coerce: true }).int().positive().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    expiresAt: z.string().datetime({ offset: true }).optional().nullable()
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable())
});

const updateDiscountSchema = z.object({
    code: z.string().min(1).transform(val => val.toUpperCase()).optional(),
    type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    value: z.number({ coerce: true }).positive('Discount value must be positive').optional(),
    minPurchase: z.number({ coerce: true }).nonnegative().optional().nullable(),
    maxUses: z.number({ coerce: true }).int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().datetime({ offset: true }).optional().nullable()
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable())
});

const validateDiscountSchema = z.object({
    code: z.string().min(1, 'Discount code is required').transform(val => val.toUpperCase()),
    orderTotal: z.number({ coerce: true }).nonnegative().optional()
});

module.exports = { createDiscountSchema, updateDiscountSchema, validateDiscountSchema };
