const { createProductSchema, updateProductSchema } = require('../../src/validators/product.validator');

describe('Product Validators', () => {
    describe('createProductSchema', () => {
        it('should pass with valid data', () => {
            const result = createProductSchema.safeParse({
                name: 'Nasi Goreng',
                price: 25000,
                categoryId: '550e8400-e29b-41d4-a716-446655440000'
            });
            expect(result.success).toBe(true);
        });

        it('should pass with optional stock and imageURL', () => {
            const result = createProductSchema.safeParse({
                name: 'Nasi Goreng',
                price: 25000,
                stock: 50,
                categoryId: '550e8400-e29b-41d4-a716-446655440000',
                imageURL: 'https://example.com/img.jpg'
            });
            expect(result.success).toBe(true);
        });

        it('should coerce string price to number', () => {
            const result = createProductSchema.safeParse({
                name: 'Nasi Goreng',
                price: '25000',
                categoryId: '550e8400-e29b-41d4-a716-446655440000'
            });
            expect(result.success).toBe(true);
            expect(result.data.price).toBe(25000);
        });

        it('should fail with missing name', () => {
            const result = createProductSchema.safeParse({
                price: 25000,
                categoryId: '550e8400-e29b-41d4-a716-446655440000'
            });
            expect(result.success).toBe(false);
        });

        it('should fail with negative price', () => {
            const result = createProductSchema.safeParse({
                name: 'Nasi Goreng',
                price: -100,
                categoryId: '550e8400-e29b-41d4-a716-446655440000'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateProductSchema', () => {
        it('should pass with partial data', () => {
            const result = updateProductSchema.safeParse({
                price: 30000
            });
            expect(result.success).toBe(true);
        });

        it('should pass with empty object', () => {
            const result = updateProductSchema.safeParse({});
            expect(result.success).toBe(true);
        });
    });
});
