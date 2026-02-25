const { z } = require('zod');

const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional().nullable()
});

module.exports = { createCategorySchema };
