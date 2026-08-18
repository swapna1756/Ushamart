require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const { isConfigured: supabaseConfigured } = require('./database/supabase');
const ensureAdminExists = require('./database/ensure-admin');

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
const wishlistRoutes      = require('./routes/wishlist.routes');
const cartRoutes          = require('./routes/cart.routes');
const addressRoutes       = require('./routes/address.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
// Default allowed origins covers localhost dev ports + known production domains.
// Add CORS_ORIGINS env var on Render to include additional origins.
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8081',
  // Production domains — always allowed regardless of env var
  'https://ushamart.onrender.com',
  'https://ushamart-wholesale.in',
  'https://www.ushamart-wholesale.in',
];

const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server / tool requests with no origin header
    if (!origin) return cb(null, true);
    // Allow any localhost port in development
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    // Allow any Netlify preview + production deployment (*.netlify.app)
    if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) {
      return cb(null, true);
    }
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS policy: origin "${origin}" is not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
// Both /health and /api/health are supported so monitoring tools and the
// frontend can use the same /api prefix pattern.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'UshaMart Admin API',
    database: supabaseConfigured ? 'ready' : 'misconfigured',
    timestamp: new Date().toISOString(),
  });
});
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'UshaMart Admin API',
    database: supabaseConfigured ? 'ready' : 'misconfigured',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/products',       productRoutes);
app.use('/api/categories',     categoryRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/addresses',      addressRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/pincodes',       pincodeRoutes);
app.use('/api/banners',        bannerRoutes);
app.use('/api/special-offers', specialOfferRoutes);
app.use('/api/coupons',        couponRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/upload',         uploadRoutes);
app.use('/api/dashboard',      dashboardRoutes);
app.use('/api/wishlist',       wishlistRoutes);
app.use('/api/cart',           cartRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[UshaMart API Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so Render (and other cloud hosts) can route traffic to the process.
// process.env.PORT is set by Render automatically; fallback to 5000 for local dev.
app.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`\n✅  UshaMart Admin API running`);
  console.log(`   Port    : ${PORT}`);
  console.log(`   Env     : ${env}`);
  console.log(`   Health  : http://localhost:${PORT}/health\n`);

  // ── Bootstrap admin user ──────────────────────────────────────────────────
  // Runs in the background every startup.
  // Ensures ADMIN_EMAIL / ADMIN_PASSWORD always exist in the database,
  // regardless of redeployment or database migrations.
  ensureAdminExists().catch(err =>
    console.error('⚠   ensure-admin startup error:', err.message)
  );
});

module.exports = app;
