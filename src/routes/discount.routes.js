const express = require('express');
const router = express.Router();
const {
    createDiscount,
    getDiscounts,
    updateDiscount,
    deleteDiscount,
    validateDiscountCode
} = require('../controllers/discount.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createDiscountSchema, updateDiscountSchema, validateDiscountSchema } = require('../validators/discount.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Discounts
 *   description: Discount/promo code management
 */

/**
 * @swagger
 * /api/discounts/validate:
 *   post:
 *     summary: Validate a discount code
 *     tags: [Discounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *               orderTotal: { type: number, description: Optional total for discount preview }
 *     responses:
 *       200: { description: Discount is valid }
 *       400: { description: Invalid, expired, or exhausted discount code }
 */
router.post('/validate', validate(validateDiscountSchema), validateDiscountCode);

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: Get all discounts (Accountant/Owner)
 *     tags: [Discounts]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema: { type: string, enum: ['true', 'false'] }
 *         description: Filter by active status
 *     responses:
 *       200: { description: List of discount codes }
 */
router.get('/', authorizeRoles('ACCOUNTANT', 'OWNER'), getDiscounts);

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Create a new discount (Owner only)
 *     tags: [Discounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, value]
 *             properties:
 *               code: { type: string }
 *               type: { type: string, enum: [PERCENTAGE, FIXED], default: PERCENTAGE }
 *               value: { type: number, description: Percentage (0-100) or fixed amount }
 *               minPurchase: { type: number }
 *               maxUses: { type: integer }
 *               isActive: { type: boolean, default: true }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       201: { description: Discount created }
 *       400: { description: Validation error or duplicate code }
 */
router.post('/', authorizeRoles('OWNER'), validate(createDiscountSchema), createDiscount);

/**
 * @swagger
 * /api/discounts/{id}:
 *   put:
 *     summary: Update a discount (Owner only)
 *     tags: [Discounts]
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
 *               code: { type: string }
 *               type: { type: string, enum: [PERCENTAGE, FIXED] }
 *               value: { type: number }
 *               minPurchase: { type: number }
 *               maxUses: { type: integer }
 *               isActive: { type: boolean }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       200: { description: Discount updated }
 *       404: { description: Discount not found }
 */
router.put('/:id', authorizeRoles('OWNER'), validate(updateDiscountSchema), updateDiscount);

/**
 * @swagger
 * /api/discounts/{id}:
 *   delete:
 *     summary: Delete a discount (Owner only)
 *     tags: [Discounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Discount deleted }
 *       404: { description: Discount not found }
 */
router.delete('/:id', authorizeRoles('OWNER'), deleteDiscount);

module.exports = router;
