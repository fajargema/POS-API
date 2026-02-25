const express = require('express');
const router = express.Router();
const {
    getSalesSummary,
    getRevenueBreakdown,
    getRevenueByCategory,
    getSalesPerCashier,
    getLowStockAlerts
} = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Sales analytics and reporting (Accountant/Owner)
 */

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Overall sales summary with top sellers
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv] }
 *     responses:
 *       200: { description: Sales summary data }
 */
router.get('/sales', authorizeRoles('ACCOUNTANT', 'OWNER'), getSalesSummary);

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Revenue breakdown by period
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [daily, weekly, monthly], default: daily }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv] }
 *     responses:
 *       200: { description: Revenue data grouped by period }
 */
router.get('/revenue', authorizeRoles('ACCOUNTANT', 'OWNER'), getRevenueBreakdown);

/**
 * @swagger
 * /api/reports/revenue/category:
 *   get:
 *     summary: Revenue aggregated by product category
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv] }
 *     responses:
 *       200: { description: Revenue per category }
 */
router.get('/revenue/category', authorizeRoles('ACCOUNTANT', 'OWNER'), getRevenueByCategory);

/**
 * @swagger
 * /api/reports/cashiers:
 *   get:
 *     summary: Sales performance per cashier
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv] }
 *     responses:
 *       200: { description: Sales data per cashier }
 */
router.get('/cashiers', authorizeRoles('ACCOUNTANT', 'OWNER'), getSalesPerCashier);

/**
 * @swagger
 * /api/reports/low-stock:
 *   get:
 *     summary: Products with low stock levels
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema: { type: integer, default: 10 }
 *         description: Stock threshold (products at or below)
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv] }
 *     responses:
 *       200: { description: Low stock product list }
 */
router.get('/low-stock', authorizeRoles('ACCOUNTANT', 'OWNER'), getLowStockAlerts);

module.exports = router;
