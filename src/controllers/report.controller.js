const prisma = require('../config/db');
const { convertToCSV, sendCSVResponse } = require('../utils/csv.util');

// ──────────────────────────────────────────
// Helper: Build a date filter for createdAt
// ──────────────────────────────────────────
const buildDateFilter = (startDate, endDate) => {
    const filter = {};
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.gte = new Date(startDate);
        if (endDate) {
            // Include the entire end day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt.lte = end;
        }
    }
    return filter;
};

// ──────────────────────────────────────────
// 1. GET /api/reports/sales  (existing)
//    Overall sales summary with top sellers
// ──────────────────────────────────────────
const getSalesSummary = async (req, res, next) => {
    try {
        const { startDate, endDate, format } = req.query;
        const dateFilter = buildDateFilter(startDate, endDate);

        // Total revenue & order count
        const orders = await prisma.order.findMany({
            where: { ...dateFilter, status: 'PAID' }
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const orderCount = orders.length;

        // Best selling items
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: { ...dateFilter, status: 'PAID' }
            },
            include: { product: { select: { name: true } } }
        });

        const productSales = {};
        orderItems.forEach(item => {
            const prodName = item.product.name;
            if (!productSales[prodName]) {
                productSales[prodName] = { quantity: 0, revenue: 0 };
            }
            productSales[prodName].quantity += item.quantity;
            productSales[prodName].revenue += (item.quantity * item.price);
        });

        const bestSellingProducts = Object.entries(productSales)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const data = { totalRevenue, orderCount, bestSellingProducts };

        // CSV export
        if (format === 'csv') {
            const csvData = bestSellingProducts.map(p => ({
                ...p,
                totalRevenue: totalRevenue.toFixed(2),
                totalOrders: String(orderCount)
            }));
            const csv = convertToCSV(csvData, [
                { header: 'Product', key: 'name' },
                { header: 'Quantity Sold', key: 'quantity' },
                { header: 'Revenue', key: 'revenue' },
                { header: 'Total Revenue (All)', key: 'totalRevenue' },
                { header: 'Total Orders (All)', key: 'totalOrders' }
            ]);
            return sendCSVResponse(res, 'sales-summary.csv', csv);
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ──────────────────────────────────────────
// 2. GET /api/reports/revenue
//    Revenue breakdown by daily/weekly/monthly
// ──────────────────────────────────────────
const getRevenueBreakdown = async (req, res, next) => {
    try {
        const { period = 'daily', startDate, endDate, format } = req.query;

        // Default to last 30 days if no range given
        const now = new Date();
        const defaultStart = new Date(now);
        defaultStart.setDate(defaultStart.getDate() - 30);

        const effectiveStart = startDate ? new Date(startDate) : defaultStart;
        const effectiveEnd = endDate ? (() => { const d = new Date(endDate); d.setHours(23, 59, 59, 999); return d; })() : now;

        const orders = await prisma.order.findMany({
            where: {
                status: 'PAID',
                createdAt: {
                    gte: effectiveStart,
                    lte: effectiveEnd
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group orders by the requested period
        const groups = {};
        orders.forEach(order => {
            const key = getPeriodKey(order.createdAt, period);
            if (!groups[key]) {
                groups[key] = { period: key, orderCount: 0, revenue: 0 };
            }
            groups[key].orderCount += 1;
            groups[key].revenue += order.totalAmount;
        });

        const data = Object.values(groups);

        // CSV export
        if (format === 'csv') {
            const csv = convertToCSV(data.map(d => ({
                ...d,
                revenue: d.revenue.toFixed(2),
                orderCount: String(d.orderCount)
            })), [
                { header: 'Period', key: 'period' },
                { header: 'Orders', key: 'orderCount' },
                { header: 'Revenue', key: 'revenue' }
            ]);
            return sendCSVResponse(res, `revenue-${period}.csv`, csv);
        }

        res.status(200).json({ success: true, period, data });
    } catch (error) {
        next(error);
    }
};

/**
 * Returns a group key string based on the period type.
 */
const getPeriodKey = (date, period) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    switch (period) {
        case 'weekly': {
            // ISO week: use the Monday of the week as the key
            const dayOfWeek = d.getDay(); // 0=Sun ... 6=Sat
            const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(d);
            monday.setDate(diff);
            const mYear = monday.getFullYear();
            const mMonth = String(monday.getMonth() + 1).padStart(2, '0');
            const mDay = String(monday.getDate()).padStart(2, '0');
            return `${mYear}-${mMonth}-${mDay}`;
        }
        case 'monthly':
            return `${year}-${month}`;
        case 'daily':
        default:
            return `${year}-${month}-${day}`;
    }
};

// ──────────────────────────────────────────
// 3. GET /api/reports/revenue/category
//    Revenue aggregated by product category
// ──────────────────────────────────────────
const getRevenueByCategory = async (req, res, next) => {
    try {
        const { startDate, endDate, format } = req.query;
        const dateFilter = buildDateFilter(startDate, endDate);

        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: { ...dateFilter, status: 'PAID' }
            },
            include: {
                product: {
                    select: {
                        category: { select: { id: true, name: true } }
                    }
                }
            }
        });

        // Aggregate by category
        const categories = {};
        orderItems.forEach(item => {
            const catId = item.product.category.id;
            const catName = item.product.category.name;
            if (!categories[catId]) {
                categories[catId] = { categoryId: catId, categoryName: catName, totalQuantity: 0, totalRevenue: 0 };
            }
            categories[catId].totalQuantity += item.quantity;
            categories[catId].totalRevenue += (item.quantity * item.price);
        });

        const data = Object.values(categories).sort((a, b) => b.totalRevenue - a.totalRevenue);

        // CSV export
        if (format === 'csv') {
            const csv = convertToCSV(data.map(d => ({
                ...d,
                totalRevenue: d.totalRevenue.toFixed(2),
                totalQuantity: String(d.totalQuantity)
            })), [
                { header: 'Category', key: 'categoryName' },
                { header: 'Items Sold', key: 'totalQuantity' },
                { header: 'Revenue', key: 'totalRevenue' }
            ]);
            return sendCSVResponse(res, 'revenue-by-category.csv', csv);
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ──────────────────────────────────────────
// 4. GET /api/reports/cashiers
//    Sales performance per cashier
// ──────────────────────────────────────────
const getSalesPerCashier = async (req, res, next) => {
    try {
        const { startDate, endDate, format } = req.query;
        const dateFilter = buildDateFilter(startDate, endDate);

        const orders = await prisma.order.findMany({
            where: { ...dateFilter, status: 'PAID' },
            include: {
                cashier: { select: { id: true, name: true, email: true } }
            }
        });

        // Aggregate by cashier
        const cashiers = {};
        orders.forEach(order => {
            const cId = order.cashier.id;
            if (!cashiers[cId]) {
                cashiers[cId] = {
                    cashierId: cId,
                    cashierName: order.cashier.name,
                    cashierEmail: order.cashier.email,
                    orderCount: 0,
                    totalRevenue: 0
                };
            }
            cashiers[cId].orderCount += 1;
            cashiers[cId].totalRevenue += order.totalAmount;
        });

        const data = Object.values(cashiers).sort((a, b) => b.totalRevenue - a.totalRevenue);

        // CSV export
        if (format === 'csv') {
            const csv = convertToCSV(data.map(d => ({
                ...d,
                totalRevenue: d.totalRevenue.toFixed(2),
                orderCount: String(d.orderCount)
            })), [
                { header: 'Cashier', key: 'cashierName' },
                { header: 'Email', key: 'cashierEmail' },
                { header: 'Orders', key: 'orderCount' },
                { header: 'Revenue', key: 'totalRevenue' }
            ]);
            return sendCSVResponse(res, 'sales-per-cashier.csv', csv);
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ──────────────────────────────────────────
// 5. GET /api/reports/low-stock
//    Products at or below a stock threshold
// ──────────────────────────────────────────
const getLowStockAlerts = async (req, res, next) => {
    try {
        const threshold = parseInt(req.query.threshold) || 10;
        const { format } = req.query;

        const products = await prisma.product.findMany({
            where: { stock: { lte: threshold } },
            include: {
                category: { select: { name: true } }
            },
            orderBy: { stock: 'asc' }
        });

        const data = products.map(p => ({
            productId: p.id,
            productName: p.name,
            categoryName: p.category.name,
            currentStock: p.stock,
            price: p.price
        }));

        // CSV export
        if (format === 'csv') {
            const csv = convertToCSV(data.map(d => ({
                ...d,
                currentStock: String(d.currentStock),
                price: d.price.toFixed(2)
            })), [
                { header: 'Product', key: 'productName' },
                { header: 'Category', key: 'categoryName' },
                { header: 'Current Stock', key: 'currentStock' },
                { header: 'Price', key: 'price' }
            ]);
            return sendCSVResponse(res, 'low-stock-alerts.csv', csv);
        }

        res.status(200).json({ success: true, threshold, count: data.length, data });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSalesSummary,
    getRevenueBreakdown,
    getRevenueByCategory,
    getSalesPerCashier,
    getLowStockAlerts
};
