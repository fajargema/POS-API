const express = require('express');
const router = express.Router();
const { getReceipt, downloadReceiptPDF } = require('../controllers/receipt.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Receipts
 *   description: Receipt / invoice generation
 */

/**
 * @swagger
 * /api/receipts/{orderId}:
 *   get:
 *     summary: Get receipt data as JSON
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Receipt data }
 *       403: { description: Forbidden (cashier viewing another's receipt) }
 *       404: { description: Order not found }
 */
router.get('/:orderId', getReceipt);

/**
 * @swagger
 * /api/receipts/{orderId}/pdf:
 *   get:
 *     summary: Download receipt as PDF
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     produces:
 *       - application/pdf
 *     responses:
 *       200: { description: PDF file download }
 *       403: { description: Forbidden }
 *       404: { description: Order not found }
 */
router.get('/:orderId/pdf', downloadReceiptPDF);

module.exports = router;
