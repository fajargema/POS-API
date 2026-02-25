const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createCategorySchema } = require('../validators/category.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search categories by name
 *     responses:
 *       200: { description: List of categories with product counts }
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (Accountant/Owner)
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Category created }
 *       400: { description: Validation error or duplicate name }
 */
router.post('/', authorizeRoles('OWNER', 'ACCOUNTANT'), validate(createCategorySchema), createCategory);

module.exports = router;
