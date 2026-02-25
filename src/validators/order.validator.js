const { z } = require('zod');

const createOrderSchema = z.object({
    items: z.array(
        z.object({
            productId: z.string().uuid('Invalid product ID format'),
            quantity: z.number({ coerce: true }).int().positive('Quantity must be at least 1')
        })
    ).min(1, 'Order must contain at least one item'),
    discountCode: z.string().optional()
});

const checkoutSchema = z.object({
    discountCode: z.string().optional()
}).optional().default({});

module.exports = { createOrderSchema, checkoutSchema };
