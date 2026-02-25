const express = require('express');
const router = express.Router();
const { createOrder, checkoutCart, getOrders, getOrderById } = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createOrderSchema, checkoutSchema } = require('../validators/order.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and checkout
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (Cashier/Owner)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string, format: uuid }
 *                     quantity: { type: integer, minimum: 1 }
 *               discountCode: { type: string, description: Optional promo code }
 *     responses:
 *       201: { description: Order created }
 *       400: { description: Validation error, stock insufficient, or invalid discount }
 */
router.post('/', authorizeRoles('CASHIER', 'OWNER'), validate(createOrderSchema), createOrder);

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     summary: Checkout cart as an order (Cashier/Owner)
 *     tags: [Orders]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discountCode: { type: string, description: Optional promo code }
 *     responses:
 *       201: { description: Checkout successful }
 *       400: { description: Cart empty, stock insufficient, or invalid discount }
 */
router.post('/checkout', authorizeRoles('CASHIER', 'OWNER'), validate(checkoutSchema), checkoutCart);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get order history (paginated)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PAID, CANCELLED] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: List of orders with pagination }
 */
router.get('/', getOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Order details }
 *       403: { description: Forbidden (cashier viewing another's order) }
 *       404: { description: Order not found }
 */
router.get('/:id', getOrderById);

module.exports = router;
