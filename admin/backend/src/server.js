require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth.routes');
const productRoutes       = require('./routes/product.routes');
const categoryRoutes      = require('./routes/category.routes');
const orderRoutes         = require('./routes/order.routes');
const userRoutes          = require('./routes/user.routes');
const pincodeRoutes       = require('./routes/pincode.routes');
const bannerRoutes        = require('./routes/banner.routes');
const specialOfferRoutes  = require('./routes/specialOffer.routes');
const couponRoutes        = require('./routes/coupon.routes');
const notificationRoutes  = require('./routes/notification.routes');
const uploadRoutes        = require('./routes/upload.routes');
const dashboardRoutes     = require('./routes/dashboard.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:8080,http://localhost:8081')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true);
    // In development, allow any localhost port
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    // In production, check against the allowed list
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'UshaMart Admin API', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/products',       productRoutes);
app.use('/api/categories',     categoryRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/pincodes',       pincodeRoutes);
app.use('/api/banners',        bannerRoutes);
app.use('/api/special-offers', specialOfferRoutes);
app.use('/api/coupons',        couponRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/upload',         uploadRoutes);
app.use('/api/dashboard',      dashboardRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[UshaMart API Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  UshaMart Admin API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
