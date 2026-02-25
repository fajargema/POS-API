const prisma = require('../config/db');

// Get all categories (with optional search)
const getCategories = async (req, res, next) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const categories = await prisma.category.findMany({
            where,
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

// Create new category
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const newCategory = await prisma.category.create({
            data: { name, description }
        });
        res.status(201).json({ success: true, message: 'Category created', data: newCategory });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'A category with this name already exists' });
        }
        next(error);
    }
};

module.exports = {
    getCategories,
    createCategory
};
