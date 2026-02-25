const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token is missing or invalid format'
            });
        }

        const token = authHeader.split(' ')[1];
        
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables");
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user is still active
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { isActive: true }
        });

        if (!user || !user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Contact the owner.'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
             return res.status(401).json({ success: false, message: 'Token has expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = { authenticate };
