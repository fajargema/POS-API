const { z } = require('zod');

const addToCartSchema = z.object({
    productId: z.string().uuid('Invalid product ID format'),
    quantity: z.number({ coerce: true }).int().positive('Quantity must be at least 1').optional().default(1)
});

const updateCartItemSchema = z.object({
    quantity: z.number({ coerce: true }).int().positive('Quantity must be at least 1')
});

module.exports = { addToCartSchema, updateCartItemSchema };
