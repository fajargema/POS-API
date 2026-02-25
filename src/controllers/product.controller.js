const prisma = require('../config/db');

// Get all products (with pagination, search, filter, sort)
const getProducts = async (req, res, next) => {
    try {
        const {
            categoryId,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where = {};
        if (categoryId) where.categoryId = categoryId;
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        // Validate sortBy field
        const allowedSortFields = ['name', 'price', 'stock', 'createdAt'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortOrder = order === 'asc' ? 'asc' : 'desc';

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { category: true },
                skip,
                take: limitNum,
                orderBy: { [sortField]: sortOrder }
            }),
            prisma.product.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create new product
const createProduct = async (req, res, next) => {
    try {
        const { name, price, stock, categoryId, imageURL } = req.body;

        // Check if category exists
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const newProduct = await prisma.product.create({
            data: { name, price, stock: stock || 0, categoryId, imageURL }
        });

        res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'A product with this name already exists' });
        }
        next(error);
    }
};

// Update product stock and details
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, stock, categoryId, imageURL } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = price;
        if (stock !== undefined) updateData.stock = stock;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (imageURL !== undefined) updateData.imageURL = imageURL;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({ success: true, message: 'Product updated successfully', data: updatedProduct });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'A product with this name already exists' });
        }
        next(error);
    }
};

// Delete a product
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        next(error);
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
