const { createDiscountSchema, updateDiscountSchema, validateDiscountSchema } = require('../../src/validators/discount.validator');

describe('Discount Validators', () => {
    describe('createDiscountSchema', () => {
        it('should pass with minimal data', () => {
            const result = createDiscountSchema.safeParse({
                code: 'WELCOME10',
                value: 10
            });
            expect(result.success).toBe(true);
        });

        it('should pass with all fields', () => {
            const result = createDiscountSchema.safeParse({
                code: 'SAVE20',
                type: 'FIXED',
                value: 5000,
                minPurchase: 50000,
                maxUses: 100,
                isActive: true,
                expiresAt: '2026-12-31T23:59:59Z'
            });
            expect(result.success).toBe(true);
        });

        it('should transform code to uppercase', () => {
            const result = createDiscountSchema.safeParse({
                code: 'welcome10',
                value: 10
            });
            expect(result.success).toBe(true);
            expect(result.data.code).toBe('WELCOME10');
        });

        it('should fail with missing code', () => {
            const result = createDiscountSchema.safeParse({ value: 10 });
            expect(result.success).toBe(false);
        });

        it('should fail with zero value', () => {
            const result = createDiscountSchema.safeParse({
                code: 'TEST',
                value: 0
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateDiscountSchema', () => {
        it('should pass with partial data', () => {
            const result = updateDiscountSchema.safeParse({ isActive: false });
            expect(result.success).toBe(true);
        });

        it('should pass with empty object', () => {
            const result = updateDiscountSchema.safeParse({});
            expect(result.success).toBe(true);
        });
    });

    describe('validateDiscountSchema', () => {
        it('should pass with code', () => {
            const result = validateDiscountSchema.safeParse({ code: 'TEST' });
            expect(result.success).toBe(true);
        });

        it('should pass with code and orderTotal', () => {
            const result = validateDiscountSchema.safeParse({
                code: 'TEST',
                orderTotal: 100000
            });
            expect(result.success).toBe(true);
        });

        it('should fail with missing code', () => {
            const result = validateDiscountSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });
});
