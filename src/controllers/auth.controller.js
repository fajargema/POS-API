const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');

// Register a new user
const register = async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Please provide email, password, and name' });
        }
        
        // Public registration only allows CASHIER role
        // Owner/Accountant accounts must be created by the Owner via /api/users
        if (role && role !== 'CASHIER') {
             return res.status(403).json({ success: false, message: 'Cannot self-register with elevated roles. Contact the owner.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: passwordHash,
                role: role || 'CASHIER'
            }
        });

        // Normally we don't return the password
        newUser.password = undefined;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: newUser
        });
    } catch (error) {
        next(error);
    }
};

// Login user and generate token
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Block deactivated users from getting new tokens
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Contact the owner.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login
};
