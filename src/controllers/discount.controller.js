const prisma = require('../config/db');

// ──────────────────────────────────────────
// Helper: Validate and resolve a discount code
// ──────────────────────────────────────────
const resolveDiscount = async (code, orderTotal) => {
    if (!code) return null;

    const discount = await prisma.discount.findUnique({
        where: { code: code.toUpperCase() }
    });

    if (!discount) throw new Error('Discount code not found');
    if (!discount.isActive) throw new Error('Discount code is no longer active');
    if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
        throw new Error('Discount code has expired');
    }
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        throw new Error('Discount code has reached its usage limit');
    }
    if (discount.minPurchase && orderTotal < discount.minPurchase) {
        throw new Error(`Minimum purchase of ${discount.minPurchase} required for this discount`);
    }

    return discount;
};

// Calculate discount amount from a discount object
const calculateDiscountAmount = (discount, subtotal) => {
    if (!discount) return 0;

    if (discount.type === 'PERCENTAGE') {
        return Math.round((subtotal * (discount.value / 100)) * 100) / 100;
    } else {
        // FIXED: cannot exceed the subtotal
        return Math.min(discount.value, subtotal);
    }
};

// ──────────────────────────────────────────
// CRUD Endpoints
// ──────────────────────────────────────────

// Create a new discount (Owner only)
const createDiscount = async (req, res, next) => {
    try {
        const data = req.body;

        // If PERCENTAGE, value must be 0-100
        if (data.type === 'PERCENTAGE' && data.value > 100) {
            return res.status(400).json({ success: false, message: 'Percentage value cannot exceed 100' });
        }

        const discount = await prisma.discount.create({
            data: {
                code: data.code,
                type: data.type,
                value: data.value,
                minPurchase: data.minPurchase || null,
                maxUses: data.maxUses || null,
                isActive: data.isActive !== undefined ? data.isActive : true,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
            }
        });

        res.status(201).json({ success: true, message: 'Discount created', data: discount });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'A discount with this code already exists' });
        }
        next(error);
    }
};

// Get all discounts (Accountant/Owner)
const getDiscounts = async (req, res, next) => {
    try {
        const { active } = req.query;
        const where = {};
        if (active === 'true') where.isActive = true;
        if (active === 'false') where.isActive = false;

        const discounts = await prisma.discount.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: discounts });
    } catch (error) {
        next(error);
    }
};

// Update a discount (Owner only)
const updateDiscount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, type, value, minPurchase, maxUses, isActive, expiresAt } = req.body;

        // If updating to PERCENTAGE, value must be 0-100
        if (type === 'PERCENTAGE' && value && value > 100) {
            return res.status(400).json({ success: false, message: 'Percentage value cannot exceed 100' });
        }

        const updateData = {};
        if (code !== undefined) updateData.code = code;
        if (type !== undefined) updateData.type = type;
        if (value !== undefined) updateData.value = value;
        if (minPurchase !== undefined) updateData.minPurchase = minPurchase;
        if (maxUses !== undefined) updateData.maxUses = maxUses;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

        const discount = await prisma.discount.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({ success: true, message: 'Discount updated', data: discount });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'A discount with this code already exists' });
        }
        next(error);
    }
};

// Delete a discount (Owner only)
const deleteDiscount = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.discount.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Discount deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }
        next(error);
    }
};

// Validate a discount code (All authenticated)
const validateDiscountCode = async (req, res, next) => {
    try {
        const { code, orderTotal } = req.body;
        const discount = await resolveDiscount(code, orderTotal || 0);

        // Preview what the discount would give
        const previewAmount = orderTotal
            ? calculateDiscountAmount(discount, orderTotal)
            : null;

        res.status(200).json({
            success: true,
            message: 'Discount code is valid',
            data: {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                minPurchase: discount.minPurchase,
                previewDiscountAmount: previewAmount
            }
        });
    } catch (error) {
        if (error.message.includes('Discount') || error.message.includes('Minimum')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    createDiscount,
    getDiscounts,
    updateDiscount,
    deleteDiscount,
    validateDiscountCode,
    // Export helpers for use in order.controller
    resolveDiscount,
    calculateDiscountAmount
};
