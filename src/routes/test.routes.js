const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Apply authentication middleware to all test routes
router.use(authenticate);

// Cashier Route (Accessible by CASHIER and OWNER)
router.get('/cashier', authorizeRoles('CASHIER', 'OWNER'), (req, res) => {
    res.json({
        success: true,
        message: 'Welcome Cashier (or Owner)! You have access to this route.',
        user: req.user
    });
});

// Accountant Route (Accessible by ACCOUNTANT and OWNER)
router.get('/accountant', authorizeRoles('ACCOUNTANT', 'OWNER'), (req, res) => {
    res.json({
        success: true,
        message: 'Welcome Accountant (or Owner)! You have access to this route.',
        user: req.user
    });
});

// Owner Route (Accessible ONLY by OWNER)
router.get('/owner', authorizeRoles('OWNER'), (req, res) => {
    res.json({
        success: true,
        message: 'Welcome Owner! Top secret data is here.',
        user: req.user
    });
});

module.exports = router;
