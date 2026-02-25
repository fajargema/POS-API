const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../validators/cart.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart operations (per cashier)
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get current user's cart
 *     tags: [Cart]
 *     responses:
 *       200: { description: Cart with items and total }
 */
router.get('/', getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               quantity: { type: integer, default: 1 }
 *     responses:
 *       200: { description: Item added to cart }
 *       400: { description: Stock insufficient or validation error }
 *       404: { description: Product not found }
 */
router.post('/', validate(addToCartSchema), addToCart);

/**
 * @swagger
 * /api/cart/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: CartItem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Cart updated }
 *       400: { description: Stock insufficient }
 *       404: { description: Cart item not found }
 */
router.put('/:id', validate(updateCartItemSchema), updateCartItem);

/**
 * @swagger
 * /api/cart/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Item removed }
 *       404: { description: Cart item not found }
 */
router.delete('/:id', removeFromCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     responses:
 *       200: { description: Cart cleared }
 */
router.delete('/', clearCart);

module.exports = router;
