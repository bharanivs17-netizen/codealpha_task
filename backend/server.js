// server.js — LuxeStore Express App Entry Point
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const morgan      = require('morgan');
const helmet      = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const connectDB    = require('./config/db');
const errorHandler = require('./middleware/error');

// Route imports
const authRoutes       = require('./routes/auth');
const productRoutes    = require('./routes/products');
const categoryRoutes   = require('./routes/categories');
const cartRoutes       = require('./routes/cart');
const wishlistRoutes   = require('./routes/wishlist');
const orderRoutes      = require('./routes/orders');
const paymentRoutes    = require('./routes/payments');
const adminRoutes      = require('./routes/admin');

// ── Connect to MongoDB ──────────────────────────────────────────────
connectDB();

const app = express();

// ── Security & Utilities ────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // allow CDN scripts in frontend
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5000',
  credentials: true,
}));

app.use(cookieParser());

// ── Rate Limiter on auth routes ─────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── Body Parsers ────────────────────────────────────────────────────
// NOTE: Stripe webhook needs raw body — handled inside payments route
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Static Files ────────────────────────────────────────────────────
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ───────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/admin',      adminRoutes);

// ── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LuxeStore API is running 🚀', env: process.env.NODE_ENV });
});

// ── Catch-all: serve frontend SPA ────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Centralized Error Handler (must be last) ──────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 LuxeStore server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base:    http://localhost:${PORT}/api`);
});
