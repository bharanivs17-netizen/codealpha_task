// server.js — LuxeStore Express App Entry Point
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const mongoose     = require('mongoose');

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
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5000',
  credentials: true,
}));

app.use(cookieParser());

// ── Rate Limiter on auth routes ─────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── Body Parsers ────────────────────────────────────────────────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Static Files ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Offline demo data (returned when MongoDB is not connected) ───────
const DEMO_CATEGORIES = [
  { _id: 'cat1', name: 'Electronics', slug: 'electronics', icon: '🖥️', description: 'Laptops, phones & gadgets' },
  { _id: 'cat2', name: 'Fashion',     slug: 'fashion',     icon: '👗', description: 'Clothing & apparel' },
  { _id: 'cat3', name: 'Footwear',    slug: 'footwear',    icon: '👟', description: 'Shoes & sneakers' },
  { _id: 'cat4', name: 'Audio',       slug: 'audio',       icon: '🎧', description: 'Headphones & speakers' },
  { _id: 'cat5', name: 'Wearables',   slug: 'wearables',   icon: '⌚', description: 'Smartwatches & fitness' },
  { _id: 'cat6', name: 'Accessories', slug: 'accessories', icon: '💼', description: 'Bags, wallets & more' },
];

const DEMO_PRODUCTS = [
  { _id:'p1', name:'MacBook Pro 16"', slug:'macbook-pro-16', price:2499, discount:10, finalPrice:2249, stock:15, brand:'Apple', category:{_id:'cat1',name:'Electronics'}, thumbnail:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', images:['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'], averageRating:4.9, numReviews:128, isFeatured:true, tags:['apple','laptop'], features:['M3 Pro chip','36GB RAM','1TB SSD','16" Retina'], description:'The most powerful MacBook Pro ever.' },
  { _id:'p2', name:'iPhone 15 Pro Max', slug:'iphone-15-pro-max', price:1199, discount:0, finalPrice:1199, stock:30, brand:'Apple', category:{_id:'cat1',name:'Electronics'}, thumbnail:'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80', images:['https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80'], averageRating:4.8, numReviews:256, isFeatured:true, tags:['apple','iphone'], features:['A17 Pro chip','48MP camera','Titanium','USB-C'], description:'The most advanced iPhone ever.' },
  { _id:'p3', name:'Sony WH-1000XM5', slug:'sony-wh-1000xm5', price:399, discount:15, finalPrice:339, stock:45, brand:'Sony', category:{_id:'cat4',name:'Audio'}, thumbnail:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', images:['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'], averageRating:4.7, numReviews:89, isFeatured:true, tags:['sony','headphones'], features:['30hr battery','ANC','Multipoint'], description:'Best noise cancelling headphones.' },
  { _id:'p4', name:'Nike Air Jordan 1 Retro', slug:'nike-air-jordan-1-retro', price:180, discount:0, finalPrice:180, stock:60, brand:'Nike', category:{_id:'cat3',name:'Footwear'}, thumbnail:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', images:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'], averageRating:4.9, numReviews:340, isFeatured:false, tags:['nike','jordan'], features:['Leather upper','Air-Sole unit'], description:'The shoe that started it all.' },
  { _id:'p5', name:'Apple Watch Ultra 2', slug:'apple-watch-ultra-2', price:799, discount:0, finalPrice:799, stock:20, brand:'Apple', category:{_id:'cat5',name:'Wearables'}, thumbnail:'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80', images:['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80'], averageRating:4.8, numReviews:67, isFeatured:true, tags:['apple','watch'], features:['Titanium case','60hr battery'], description:'Most rugged Apple Watch ever.' },
  { _id:'p6', name:'Samsung Galaxy S24 Ultra', slug:'samsung-galaxy-s24-ultra', price:1299, discount:8, finalPrice:1195, stock:25, brand:'Samsung', category:{_id:'cat1',name:'Electronics'}, thumbnail:'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80', images:['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80'], averageRating:4.6, numReviews:112, isFeatured:false, tags:['samsung','galaxy'], features:['200MP camera','S Pen','Galaxy AI'], description:'Ultimate Android experience.' },
  { _id:'p7', name:'Adidas Ultraboost 23', slug:'adidas-ultraboost-23', price:190, discount:20, finalPrice:152, stock:80, brand:'Adidas', category:{_id:'cat3',name:'Footwear'}, thumbnail:'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80', images:['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80'], averageRating:4.5, numReviews:198, isFeatured:false, tags:['adidas','running'], features:['BOOST midsole','Primeknit upper'], description:'Incredible energy return with every stride.' },
  { _id:'p8', name:'LV Neverfull MM', slug:'lv-neverfull-mm', price:1700, discount:0, finalPrice:1700, stock:8, brand:'Louis Vuitton', category:{_id:'cat6',name:'Accessories'}, thumbnail:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', images:['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'], averageRating:4.9, numReviews:44, isFeatured:true, tags:['lv','luxury','bag'], features:['Monogram canvas','Leather trim'], description:'Iconic spacious tote bag.' },
];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// ── Offline fallback middleware for public read-only routes ──────────
app.use('/api/products', (req, res, next) => {
  if (req.method !== 'GET' || isDbConnected()) return next();

  // Serve demo data immediately without hitting MongoDB
  let products = [...DEMO_PRODUCTS];
  const { keyword, category, featured, sort, page = 1, limit = 12 } = req.query;

  if (req.path !== '/' && req.path !== '') return next(); // Let /:slug pass through to 404

  if (featured === 'true') products = products.filter(p => p.isFeatured);
  if (category)            products = products.filter(p => p.category._id === category);
  if (keyword)             products = products.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
  if (sort === 'price-asc')  products.sort((a,b) => a.finalPrice - b.finalPrice);
  if (sort === 'price-desc') products.sort((a,b) => b.finalPrice - a.finalPrice);
  if (sort === 'rating')     products.sort((a,b) => b.averageRating - a.averageRating);
  if (sort === 'popular')    products.sort((a,b) => b.numReviews - a.numReviews);

  const total = products.length;
  const limitN = Number(limit);
  const skip   = (Number(page) - 1) * limitN;
  const sliced = products.slice(skip, skip + limitN);

  return res.json({ success: true, products: sliced, total, page: Number(page), pages: Math.ceil(total / limitN) });
});

app.use('/api/categories', (req, res, next) => {
  if (req.method !== 'GET' || isDbConnected()) return next();
  return res.json({ success: true, categories: DEMO_CATEGORIES });
});

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
  res.json({
    success: true,
    message: 'LuxeStore API is running 🚀',
    db: isDbConnected() ? 'connected' : 'offline (demo mode)',
    env: process.env.NODE_ENV,
  });
});

// ── Catch-all: serve frontend SPA ────────────────────────────────────
app.get(/^\/(.*)/, (req, res) => {
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
