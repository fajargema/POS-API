const prisma = require('../config/db');
const { generateReceiptPDF } = require('../utils/receipt.util');
const { getSettings } = require('./settings.controller');

// Helper: fetch a full order with all relations
const fetchOrderWithDetails = async (orderId) => {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: {
            cashier: { select: { id: true, name: true, email: true } },
            items: {
                include: {
                    product: { select: { name: true } }
                }
            }
        }
    });
};

// GET /api/receipts/:orderId — JSON receipt data
const getReceipt = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const order = await fetchOrderWithDetails(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Security: cashiers can only view their own receipts
        if (req.user.role === 'CASHIER' && order.cashierId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const storeSettings = await getSettings();
        const receiptNo = `RCP-${String(order.receiptNumber).padStart(5, '0')}`;

        // Calculate subtotal from items
        const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const receipt = {
            receiptNumber: receiptNo,
            store: {
                name: storeSettings.name,
                address: storeSettings.address,
                phone: storeSettings.phone
            },
            order: {
                id: order.id,
                status: order.status,
                date: order.createdAt,
                cashier: order.cashier.name
            },
            items: order.items.map(item => ({
                product: item.product.name,
                quantity: item.quantity,
                unitPrice: item.price,
                lineTotal: item.price * item.quantity
            })),
            subtotal,
            discountCode: order.discountCode,
            discountAmount: order.discountAmount,
            total: order.totalAmount,
            footer: storeSettings.footer
        };

        res.status(200).json({ success: true, data: receipt });
    } catch (error) {
        next(error);
    }
};

// GET /api/receipts/:orderId/pdf — Download receipt as PDF
const downloadReceiptPDF = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const order = await fetchOrderWithDetails(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Security: cashiers can only download their own receipts
        if (req.user.role === 'CASHIER' && order.cashierId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const storeSettings = await getSettings();
        const receiptNo = `RCP-${String(order.receiptNumber).padStart(5, '0')}`;

        const pdfBuffer = await generateReceiptPDF(order, storeSettings);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${receiptNo}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(200).send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getReceipt,
    downloadReceiptPDF
};
