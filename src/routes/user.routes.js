const express = require('express');
const router = express.Router();
const {
    getUsers, getUserById, createUser, updateUser, deactivateUser,
    getProfile, updateProfile, changePassword
} = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
    createUserSchema, updateUserSchema,
    updateProfileSchema, changePasswordSchema
} = require('../validators/user.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile
 */

// ── Self-service routes (must be before :id routes) ──

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get own profile
 *     tags: [Users]
 *     responses:
 *       200: { description: User profile data }
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update own profile (name, email)
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Profile updated }
 *       400: { description: Email already in use }
 */
router.put('/me', validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change own password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password changed }
 *       400: { description: Current password incorrect }
 */
router.put('/me/password', validate(changePasswordSchema), changePassword);

// ── Owner-only routes ──

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (Owner, paginated)
 *     tags: [Users]
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
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [CASHIER, ACCOUNTANT, OWNER] }
 *       - in: query
 *         name: active
 *         schema: { type: string, enum: ['true', 'false'] }
 *     responses:
 *       200: { description: List of users with pagination }
 */
router.get('/', authorizeRoles('OWNER'), getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Owner)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               name: { type: string }
 *               role: { type: string, enum: [CASHIER, ACCOUNTANT, OWNER] }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Email already registered }
 */
router.post('/', authorizeRoles('OWNER'), validate(createUserSchema), createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Owner)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User details }
 *       404: { description: User not found }
 */
router.get('/:id', authorizeRoles('OWNER'), getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Owner)
 *     tags: [Users]
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
 *               email: { type: string, format: email }
 *               role: { type: string, enum: [CASHIER, ACCOUNTANT, OWNER] }
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: User updated }
 *       404: { description: User not found }
 */
router.put('/:id', authorizeRoles('OWNER'), validate(updateUserSchema), updateUser);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (Owner)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User deactivated }
 *       400: { description: Cannot deactivate own account }
 *       404: { description: User not found }
 */
router.patch('/:id/deactivate', authorizeRoles('OWNER'), deactivateUser);

module.exports = router;
