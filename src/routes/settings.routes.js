const express = require('express');
const router = express.Router();
const { getStoreSettings, updateStoreSettings } = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Store settings management
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get store settings
 *     tags: [Settings]
 *     responses:
 *       200: { description: Store settings data }
 */
router.get('/', getStoreSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update store settings (Owner only)
 *     tags: [Settings]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: Store name }
 *               address: { type: string, description: Store address }
 *               phone: { type: string, description: Store phone }
 *               footer: { type: string, description: Receipt footer text }
 *     responses:
 *       200: { description: Settings updated }
 */
router.put('/', authorizeRoles('OWNER'), updateStoreSettings);

module.exports = router;
