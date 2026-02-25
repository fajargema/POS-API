const { z } = require('zod');

const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    price: z.number({ coerce: true }).positive('Price must be a positive number'),
    stock: z.number({ coerce: true }).int().nonnegative('Stock cannot be negative').optional().default(0),
    categoryId: z.string().uuid('Invalid category ID format'),
    imageURL: z.string().url('Invalid image URL').optional().nullable()
});

const updateProductSchema = z.object({
    name: z.string().min(1, 'Product name cannot be empty').optional(),
    price: z.number({ coerce: true }).positive('Price must be a positive number').optional(),
    stock: z.number({ coerce: true }).int().nonnegative('Stock cannot be negative').optional(),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
    imageURL: z.string().url('Invalid image URL').optional().nullable()
});

module.exports = { createProductSchema, updateProductSchema };
