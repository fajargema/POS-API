require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const prisma = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ── Security Headers (Helmet) ──
app.use(helmet());

// ── Gzip Compression ──
app.use(compression());

// ── Rate Limiting ──
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: isProduction ? 100 : 1000,  // stricter in production
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 20 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// ── CORS Configuration ──
const corsOptions = {
    origin: process.env.CORS_ORIGIN === '*'
        ? '*'
        : (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// ── Health Check ──
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            message: 'Database connection failed'
        });
    }
});

// ── Swagger API Documentation ──
if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./config/swagger');
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'POS API Docs'
    }));
    app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
}

// ── Routes ──
const authRoutes = require('./routes/auth.routes');
const testRoutes = require('./routes/test.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const reportRoutes = require('./routes/report.routes');
const cartRoutes = require('./routes/cart.routes');
const discountRoutes = require('./routes/discount.routes');
const receiptRoutes = require('./routes/receipt.routes');
const settingsRoutes = require('./routes/settings.routes');
const userRoutes = require('./routes/user.routes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

// ── Error Handler ──
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// ── Start Server ──
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
    if (!isProduction) {
        console.log(`API Docs available at http://localhost:${PORT}/api/docs`);
    }
});
