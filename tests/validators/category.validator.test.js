const { createCategorySchema } = require('../../src/validators/category.validator');

describe('Category Validators', () => {
    describe('createCategorySchema', () => {
        it('should pass with valid data', () => {
            const result = createCategorySchema.safeParse({ name: 'Food' });
            expect(result.success).toBe(true);
        });

        it('should pass with optional description', () => {
            const result = createCategorySchema.safeParse({
                name: 'Food',
                description: 'All food items'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with missing name', () => {
            const result = createCategorySchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('should fail with empty name', () => {
            const result = createCategorySchema.safeParse({ name: '' });
            expect(result.success).toBe(false);
        });
    });
});
