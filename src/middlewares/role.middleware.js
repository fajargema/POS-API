/**
 * Factory middleware to authorize users based on roles.
 * @param  {...string} allowedRoles - List of allowed roles (e.g., 'CASHIER', 'OWNER')
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is set by the authenticate middleware
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'User role not found. Access forbidden.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} is not authorized to access this resource`
            });
        }

        next();
    };
};

module.exports = { authorizeRoles };
