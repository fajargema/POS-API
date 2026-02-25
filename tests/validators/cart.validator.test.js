const { addToCartSchema, updateCartItemSchema } = require('../../src/validators/cart.validator');

describe('Cart Validators', () => {
    describe('addToCartSchema', () => {
        it('should pass with productId and quantity', () => {
            const result = addToCartSchema.safeParse({
                productId: '550e8400-e29b-41d4-a716-446655440000',
                quantity: 2
            });
            expect(result.success).toBe(true);
        });

        it('should default quantity to 1 if not provided', () => {
            const result = addToCartSchema.safeParse({
                productId: '550e8400-e29b-41d4-a716-446655440000'
            });
            expect(result.success).toBe(true);
            expect(result.data.quantity).toBe(1);
        });

        it('should fail with missing productId', () => {
            const result = addToCartSchema.safeParse({ quantity: 2 });
            expect(result.success).toBe(false);
        });

        it('should fail with zero quantity', () => {
            const result = addToCartSchema.safeParse({
                productId: '550e8400-e29b-41d4-a716-446655440000',
                quantity: 0
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateCartItemSchema', () => {
        it('should pass with valid quantity', () => {
            const result = updateCartItemSchema.safeParse({ quantity: 5 });
            expect(result.success).toBe(true);
        });

        it('should fail with zero quantity', () => {
            const result = updateCartItemSchema.safeParse({ quantity: 0 });
            expect(result.success).toBe(false);
        });

        it('should fail with missing quantity', () => {
            const result = updateCartItemSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });
});
