const { createOrderSchema, checkoutSchema } = require('../../src/validators/order.validator');

describe('Order Validators', () => {
    describe('createOrderSchema', () => {
        it('should pass with valid items', () => {
            const result = createOrderSchema.safeParse({
                items: [
                    { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 }
                ]
            });
            expect(result.success).toBe(true);
        });

        it('should pass with discountCode', () => {
            const result = createOrderSchema.safeParse({
                items: [
                    { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }
                ],
                discountCode: 'WELCOME10'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with empty items array', () => {
            const result = createOrderSchema.safeParse({ items: [] });
            expect(result.success).toBe(false);
        });

        it('should fail with missing items', () => {
            const result = createOrderSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('should fail with zero quantity in item', () => {
            const result = createOrderSchema.safeParse({
                items: [
                    { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 0 }
                ]
            });
            expect(result.success).toBe(false);
        });
    });

    describe('checkoutSchema', () => {
        it('should pass with empty body', () => {
            const result = checkoutSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should pass with discountCode', () => {
            const result = checkoutSchema.safeParse({ discountCode: 'SAVE20' });
            expect(result.success).toBe(true);
        });
    });
});
