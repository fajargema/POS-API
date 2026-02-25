const prisma = require('../config/db');
const { resolveDiscount, calculateDiscountAmount } = require('./discount.controller');

// Create a new order (Cashier)
const createOrder = async (req, res, next) => {
    try {
        const { items, discountCode } = req.body;
        const cashierId = req.user.id;

        // We use an interactive transaction to ensure atomicity (all or nothing)
        const orderResult = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const orderItemsData = [];

            for (const item of items) {
                const { productId, quantity } = item;

                const product = await tx.product.findUnique({ where: { id: productId } });
                
                if (!product) {
                    throw new Error(`Product with ID ${productId} not found`);
                }

                if (product.stock < quantity) {
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                }

                // Deduct stock
                await tx.product.update({
                    where: { id: productId },
                    data: { stock: product.stock - quantity }
                });

                // Calculate price
                subtotal += product.price * quantity;

                orderItemsData.push({
                    productId,
                    quantity,
                    price: product.price
                });
            }

            // Apply discount if provided
            let discountAmount = 0;
            let appliedCode = null;
            if (discountCode) {
                const discount = await resolveDiscount(discountCode, subtotal);
                discountAmount = calculateDiscountAmount(discount, subtotal);
                appliedCode = discount.code;

                // Increment usage count
                await tx.discount.update({
                    where: { id: discount.id },
                    data: { usedCount: { increment: 1 } }
                });
            }

            const totalAmount = Math.max(0, subtotal - discountAmount);

            // Create Order
            const newOrder = await tx.order.create({
                data: {
                    cashierId,
                    totalAmount,
                    discountCode: appliedCode,
                    discountAmount,
                    status: 'PAID',
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: {
                        include: {
                            product: { select: { name: true } }
                        }
                    }
                }
            });

            return newOrder;
        });

        res.status(201).json({ success: true, message: 'Order created successfully', data: orderResult });
    } catch (error) {
        if (error.message.includes('Insufficient stock') || error.message.includes('not found') || error.message.includes('Invalid item') || error.message.includes('Discount') || error.message.includes('Minimum')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

// Checkout direct from Cart (Cashier)
const checkoutCart = async (req, res, next) => {
    try {
        const cashierId = req.user.id;
        const { discountCode } = req.body || {};

        const cart = await prisma.cart.findUnique({
            where: { cashierId },
            include: {
                items: { include: { product: true } }
            }
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty. Cannot checkout.' });
        }

        const orderResult = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const orderItemsData = [];

            for (const item of cart.items) {
                const { product, quantity } = item;

                if (product.stock < quantity) {
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                }

                // Deduct stock
                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: product.stock - quantity }
                });

                subtotal += product.price * quantity;

                orderItemsData.push({
                    productId: product.id,
                    quantity,
                    price: product.price
                });
            }

            // Apply discount if provided
            let discountAmount = 0;
            let appliedCode = null;
            if (discountCode) {
                const discount = await resolveDiscount(discountCode, subtotal);
                discountAmount = calculateDiscountAmount(discount, subtotal);
                appliedCode = discount.code;

                // Increment usage count
                await tx.discount.update({
                    where: { id: discount.id },
                    data: { usedCount: { increment: 1 } }
                });
            }

            const totalAmount = Math.max(0, subtotal - discountAmount);

            // Create Order
            const newOrder = await tx.order.create({
                data: {
                    cashierId,
                    totalAmount,
                    discountCode: appliedCode,
                    discountAmount,
                    status: 'PAID',
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: {
                        include: {
                            product: { select: { name: true } }
                        }
                    }
                }
            });

            // Wipe out the cart
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

            return newOrder;
        });

        res.status(201).json({ success: true, message: 'Checkout successful', data: orderResult });
    } catch (error) {
        if (error.message.includes('Insufficient stock') || error.message.includes('Discount') || error.message.includes('Minimum')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

// Get all orders (History) — with pagination & filters
const getOrders = async (req, res, next) => {
    try {
        const role = req.user.role;
        const userId = req.user.id;
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where = {};
        if (role === 'CASHIER') where.cashierId = userId;
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    cashier: { select: { id: true, name: true, email: true } },
                    items: {
                        include: { product: { select: { name: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.order.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: orders,
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

// Get single order
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = req.user.role;
        const userId = req.user.id;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                cashier: { select: { name: true, email: true } },
                items: {
                    include: { product: { select: { name: true } } }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Cashier security check
        if (role === 'CASHIER' && order.cashierId !== userId) {
            return res.status(403).json({ success: false, message: 'Forbidden to view another cashier\'s order' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    checkoutCart,
    getOrders,
    getOrderById
};
