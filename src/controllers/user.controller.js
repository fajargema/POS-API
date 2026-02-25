const prisma = require('../config/db');
const bcrypt = require('bcrypt');

// ──────────────── Owner-only endpoints ────────────────

// GET /api/users — List all users (paginated, searchable)
const getUsers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            active
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) where.role = role;
        if (active !== undefined) where.isActive = active === 'true';

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { orders: true } }
                },
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/users/:id — Get single user
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { orders: true } }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// POST /api/users — Create a new user (Owner)
const createUser = async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'CASHIER'
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        res.status(201).json({ success: true, message: 'User created successfully', data: newUser });
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/:id — Update user (Owner)
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, isActive } = req.body;

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent Owner from deactivating themselves
        if (id === req.user.id && isActive === false) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
        }

        // Check email uniqueness if changing
        if (email && email !== existing.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email } });
            if (emailTaken) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
                ...(role !== undefined && { role }),
                ...(isActive !== undefined && { isActive })
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                updatedAt: true
            }
        });

        res.status(200).json({ success: true, message: 'User updated successfully', data: updatedUser });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/users/:id/deactivate — Soft deactivate user
const deactivateUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        res.status(200).json({ success: true, message: `User "${user.name}" has been deactivated` });
    } catch (error) {
        next(error);
    }
};

// ──────────────── Self-service endpoints ────────────────

// GET /api/users/me — Get own profile
const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { orders: true } }
            }
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/me — Update own profile
const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        // Check email uniqueness if changing
        if (email) {
            const emailTaken = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id: req.user.id }
                }
            });
            if (emailTaken) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email })
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true
            }
        });

        res.status(200).json({ success: true, message: 'Profile updated', data: updatedUser });
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/me/password — Change own password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deactivateUser,
    getProfile,
    updateProfile,
    changePassword
};
