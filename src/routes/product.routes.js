const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products (paginated, searchable)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search products by name
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, price, stock, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200: { description: List of products with pagination }
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (Accountant/Owner)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, categoryId]
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               stock: { type: integer, default: 0 }
 *               categoryId: { type: string, format: uuid }
 *               imageURL: { type: string, format: uri }
 *     responses:
 *       201: { description: Product created }
 *       400: { description: Validation error }
 *       404: { description: Category not found }
 */
const manageRoles = authorizeRoles('OWNER', 'ACCOUNTANT');
router.post('/', manageRoles, validate(createProductSchema), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product (Accountant/Owner)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               categoryId: { type: string, format: uuid }
 *               imageURL: { type: string, format: uri }
 *     responses:
 *       200: { description: Product updated }
 *       404: { description: Product not found }
 */
router.put('/:id', manageRoles, validate(updateProductSchema), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product (Accountant/Owner)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Product deleted }
 *       404: { description: Product not found }
 */
router.delete('/:id', manageRoles, deleteProduct);

module.exports = router;
