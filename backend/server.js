require('dotenv').config();
// Force Google DNS to resolve MongoDB Atlas SRV records
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize()); // prevent NoSQL injection

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true, // needed for httpOnly cookies
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});
// FIX #8: Dedicated stricter limiters for sensitive endpoints
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many order requests. Please slow down.' },
});
const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many coupon attempts. Try again later.' },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many messages sent. Please wait before sending again.' },
});
app.use('/api', limiter);
app.use('/api/auth', authLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/coupons/check', couponLimiter);
app.use('/api/settings/contact', contactLimiter);

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Static files — serve assets from backend/public/assets ───────────────────
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
// Also serve the entire public folder (for production React build)
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/accessories', require('./routes/accessories'));
app.use('/api/cart',        require('./routes/cart'));
app.use('/api/wishlist',    require('./routes/wishlist'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/coupons',     require('./routes/coupons'));
app.use('/api/blog',        require('./routes/blog'));
app.use('/api/reviews',     require('./routes/reviews'));
app.use('/api/settings',    require('./routes/settings'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Isa & Dagi API is running ✓', env: process.env.NODE_ENV });
});

// ── Serve React build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, 'public/client');
  app.use(express.static(frontendDist));
  // FIX #5: Exclude /api/* so unmatched API routes return JSON 404, not HTML
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(422).json({ success: false, message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate value. Please use a unique value.' });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── MongoDB + Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅  MongoDB connected');
  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`📦  API: http://localhost:${PORT}/api/health`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})
.catch(err => {
  console.error('❌  MongoDB connection failed:', err.message);
  process.exit(1);
});
