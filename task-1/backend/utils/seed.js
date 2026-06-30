// utils/seed.js — Populate MongoDB with demo data
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User     = require('../models/User');
const Category = require('../models/Category');
const Product  = require('../models/Product');
const Review   = require('../models/Review');

const connectDB = require('../config/db');

const CATEGORIES = [
  { name: 'Electronics',   slug: 'electronics',   icon: '🖥️',  description: 'Latest gadgets & tech',         sortOrder: 1 },
  { name: 'Fashion',       slug: 'fashion',        icon: '👗',  description: 'Trendy clothes & accessories',  sortOrder: 2 },
  { name: 'Footwear',      slug: 'footwear',       icon: '👟',  description: 'Sneakers & premium shoes',      sortOrder: 3 },
  { name: 'Audio',         slug: 'audio',          icon: '🎧',  description: 'Headphones & speakers',         sortOrder: 4 },
  { name: 'Wearables',     slug: 'wearables',      icon: '⌚',  description: 'Smartwatches & fitness bands',  sortOrder: 5 },
  { name: 'Accessories',   slug: 'accessories',    icon: '💼',  description: 'Bags, cases & more',            sortOrder: 6 },
];

const seed = async () => {
  await connectDB();

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // ── Users ──────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const adminUser = await User.create({
    name:     'Admin User',
    email:    'admin@luxestore.com',
    password: 'admin123456',
    role:     'admin',
  });

  const demoUser = await User.create({
    name:     'Alex Johnson',
    email:    'user@luxestore.com',
    password: 'user123456',
    role:     'user',
  });

  // ── Categories ─────────────────────────────────────────────────────
  console.log('📂 Creating categories...');
  const cats = await Category.insertMany(CATEGORIES);
  const catMap = {};
  cats.forEach((c) => { catMap[c.slug] = c._id; });

  // ── Products ───────────────────────────────────────────────────────
  console.log('📦 Creating products...');
  const PRODUCTS = [
    {
      name: 'ProMax Laptop Ultra',
      slug: 'promax-laptop-ultra',
      description: 'The most powerful laptop ever built. Features M3 Ultra chip, 32GB unified memory, and an XDR Retina display. Perfect for creators and professionals.',
      shortDesc: 'M3 Ultra chip, 32GB RAM, 1TB SSD, Retina XDR display',
      price: 2499, discount: 10,
      category: catMap['electronics'], brand: 'ApexTech',
      stock: 50, sku: 'PLU-001',
      isFeatured: true,
      tags: ['laptop', 'premium', 'apple', 'ultrabook'],
      features: ['M3 Ultra Chip', '32GB Unified Memory', '1TB SSD Storage', 'Liquid Retina XDR Display', '22-hour battery life', 'MagSafe charging'],
      thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
      averageRating: 4.8, numReviews: 124, sold: 89,
    },
    {
      name: 'AirBuds Pro X',
      slug: 'airbuds-pro-x',
      description: 'True wireless earbuds with industry-leading active noise cancellation, spatial audio, and 30-hour total battery life. Crystal-clear transparency mode.',
      shortDesc: 'ANC, Spatial Audio, 30hr battery, IPX4 water resistant',
      price: 249, discount: 20,
      category: catMap['audio'], brand: 'SoundMax',
      stock: 200, sku: 'ABP-001',
      isFeatured: true,
      tags: ['earbuds', 'wireless', 'anc', 'audio'],
      features: ['Active Noise Cancellation', 'Spatial Audio with Head Tracking', '30 hours total battery', 'IPX4 sweat & water resistant', 'Custom EQ via app'],
      thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
      averageRating: 4.7, numReviews: 89, sold: 312,
    },
    {
      name: 'NovaSport Runner 3.0',
      slug: 'novasport-runner-30',
      description: 'Engineered for peak performance. ReactFoam midsole delivers responsive cushioning with every stride. Breathable Flyknit upper keeps you cool.',
      shortDesc: 'ReactFoam cushioning, Flyknit upper, lightweight racing design',
      price: 180, discount: 15,
      category: catMap['footwear'], brand: 'NovaSport',
      stock: 150, sku: 'NSR-001',
      isFeatured: true,
      tags: ['running', 'shoes', 'sport', 'performance'],
      features: ['ReactFoam midsole technology', 'Flyknit breathable upper', 'Carbon fiber plate', 'Reflective details', 'Lace-up closure'],
      thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
      averageRating: 4.6, numReviews: 203, sold: 567,
    },
    {
      name: 'StudioPro Headphones',
      slug: 'studiopro-headphones',
      description: 'Over-ear wireless headphones with 40mm custom drivers, 60-hour playtime, and lossless Hi-Res audio. Built for audiophiles who demand perfection.',
      shortDesc: '40mm drivers, 60hr battery, Hi-Res audio, 5-minute quick charge',
      price: 349, discount: 0,
      category: catMap['audio'], brand: 'SoundMax',
      stock: 75, sku: 'SPH-001',
      isFeatured: true,
      tags: ['headphones', 'wireless', 'hifi', 'studio'],
      features: ['40mm custom acoustic drivers', '60-hour battery life', 'Hi-Res Audio certified', 'Adaptive noise cancelling', '5-min charge = 3hrs playback'],
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
      averageRating: 4.9, numReviews: 56, sold: 134,
    },
    {
      name: 'VisionWatch S7',
      slug: 'visionwatch-s7',
      description: 'The ultimate smartwatch for health tracking. ECG, blood oxygen, sleep tracking, and GPS. A stunning OLED display with always-on mode.',
      shortDesc: 'ECG, SpO2, GPS, 18hr battery, AMOLED display, IP68 waterproof',
      price: 399, discount: 5,
      category: catMap['wearables'], brand: 'VisionTech',
      stock: 120, sku: 'VWS-001',
      isFeatured: true,
      tags: ['smartwatch', 'health', 'fitness', 'wearable'],
      features: ['Advanced ECG sensor', 'Blood oxygen monitoring', 'Built-in GPS + GLONASS', 'Sleep & stress tracking', 'IP68 waterproof rating', '50m+ watch faces'],
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
      averageRating: 4.5, numReviews: 178, sold: 245,
    },
    {
      name: 'Urban Backpack Pro',
      slug: 'urban-backpack-pro',
      description: 'Designed for the modern professional. Fits 16" laptop, TSA-approved, water-resistant 840D nylon. USB-A charging port keeps your devices alive all day.',
      shortDesc: 'Fits 16" laptop, USB charging, TSA-approved, water-resistant',
      price: 129, discount: 25,
      category: catMap['accessories'], brand: 'UrbanGear',
      stock: 300, sku: 'UBP-001',
      isFeatured: false,
      tags: ['backpack', 'bag', 'travel', 'laptop'],
      features: ['Fits up to 16" laptop', 'Integrated USB-A charging port', 'TSA-approved hidden zipper', 'Water-resistant 840D nylon', 'Anti-theft hidden pockets'],
      thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],
      averageRating: 4.4, numReviews: 321, sold: 892,
    },
    {
      name: 'FlexFit Hoodie',
      slug: 'flexfit-hoodie',
      description: 'Premium performance hoodie with 4-way stretch fabric. Perfect for workouts or casual wear. Moisture-wicking, anti-odor, and machine washable.',
      shortDesc: '4-way stretch, moisture-wicking, anti-odor, 95% recycled fabric',
      price: 89, discount: 10,
      category: catMap['fashion'], brand: 'FlexWear',
      stock: 500, sku: 'FFH-001',
      isFeatured: false,
      tags: ['hoodie', 'fashion', 'sport', 'activewear'],
      features: ['4-way stretch fabric', 'Moisture-wicking technology', 'Anti-odor treatment', '95% recycled polyester', 'Kangaroo pocket', 'Machine washable'],
      thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f15232d3?w=600',
      images: ['https://images.unsplash.com/photo-1556821840-3a63f15232d3?w=600'],
      averageRating: 4.3, numReviews: 145, sold: 423,
    },
    {
      name: 'ProTab X12 Tablet',
      slug: 'protab-x12-tablet',
      description: '12-inch OLED tablet with stylus support, 120Hz display, and all-day battery. Transform your creativity with the powerful A15 chip.',
      shortDesc: '12" OLED, 120Hz, Stylus support, A15 chip, 10hr battery',
      price: 799, discount: 8,
      category: catMap['electronics'], brand: 'ApexTech',
      stock: 80, sku: 'PTX-001',
      isFeatured: true,
      tags: ['tablet', 'ipad', 'drawing', 'creative'],
      features: ['12-inch ProMotion OLED', '120Hz adaptive refresh rate', 'Stylus 2.0 support', 'A15 Bionic chip', '10-hour battery', '5G ready'],
      thumbnail: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600',
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
      averageRating: 4.7, numReviews: 67, sold: 189,
    },
    {
      name: 'AirMax Sneakers 2025',
      slug: 'airmax-sneakers-2025',
      description: 'Iconic street-style meets modern comfort. Full-length air cushioning, premium leather uppers, and a bold colorway that turns heads.',
      shortDesc: 'Full-length air unit, premium leather, street-ready design',
      price: 150, discount: 0,
      category: catMap['footwear'], brand: 'NovaSport',
      stock: 200, sku: 'AMS-001',
      isFeatured: false,
      tags: ['sneakers', 'shoes', 'casual', 'streetwear'],
      features: ['Full-length Air cushioning', 'Premium leather upper', 'Rubber outsole', 'Lace-up closure', 'Available in 8 colorways'],
      thumbnail: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600',
      images: ['https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600'],
      averageRating: 4.6, numReviews: 412, sold: 1023,
    },
    {
      name: 'SmartRing Bio',
      slug: 'smartring-bio',
      description: 'A ring that knows your body. 24/7 heart rate, HRV, sleep stages, and activity tracking in a sleek titanium form factor. 7-day battery life.',
      shortDesc: 'Titanium ring, 7-day battery, HRV, sleep tracking, app-connected',
      price: 299, discount: 0,
      category: catMap['wearables'], brand: 'BioTech',
      stock: 60, sku: 'SRB-001',
      isFeatured: false,
      tags: ['ring', 'wearable', 'health', 'fitness'],
      features: ['24/7 heart rate & HRV', 'Sleep stage analysis', '7-day battery life', 'Aircraft-grade titanium', 'IPX8 waterproof', 'No subscription required'],
      thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
      images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'],
      averageRating: 4.8, numReviews: 43, sold: 78,
    },
    {
      name: 'BoomBar Portable Speaker',
      slug: 'boombar-portable-speaker',
      description: '360° sound in a rugged, waterproof design. 24-hour battery, dual passive radiators, and Bluetooth 5.3 for rock-solid connectivity anywhere.',
      shortDesc: '360° sound, IP67 waterproof, 24hr battery, Bluetooth 5.3',
      price: 129, discount: 15,
      category: catMap['audio'], brand: 'SoundMax',
      stock: 180, sku: 'BBS-001',
      isFeatured: false,
      tags: ['speaker', 'bluetooth', 'outdoor', 'waterproof'],
      features: ['360° omnidirectional sound', 'IP67 waterproof & dustproof', '24-hour playtime', 'Dual passive radiators', 'Bluetooth 5.3', 'Built-in speakerphone'],
      thumbnail: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
      averageRating: 4.5, numReviews: 234, sold: 567,
    },
    {
      name: 'TechCase MagSafe Pro',
      slug: 'techcase-magsafe-pro',
      description: 'Military-grade drop protection meets MagSafe compatibility. Slim profile, raised camera bezel, and a matte finish that never slips.',
      shortDesc: 'MagSafe compatible, MIL-STD-810G drop protection, slim & grippy',
      price: 49, discount: 0,
      category: catMap['accessories'], brand: 'UrbanGear',
      stock: 1000, sku: 'TCM-001',
      isFeatured: false,
      tags: ['case', 'iphone', 'magsafe', 'protection'],
      features: ['MagSafe & Qi2 compatible', 'MIL-STD-810G tested', 'Slim 1.2mm profile', 'Raised camera lip', 'Anti-fingerprint matte finish'],
      thumbnail: 'https://images.unsplash.com/photo-1601972599748-39404f360eb4?w=600',
      images: ['https://images.unsplash.com/photo-1601972599748-39404f360eb4?w=600'],
      averageRating: 4.2, numReviews: 567, sold: 2341,
    },
  ];

  const products = await Product.insertMany(PRODUCTS);
  console.log(`✅ ${products.length} products created`);

  // ── Reviews ────────────────────────────────────────────────────────
  console.log('⭐ Creating reviews...');
  const sampleReviews = [
    {
      user: demoUser._id, product: products[0]._id,
      rating: 5, title: 'Best laptop I have ever owned',
      comment: 'Blazing fast performance. The display is absolutely gorgeous. Battery lasts all day. Worth every penny.',
      isVerifiedPurchase: true,
    },
    {
      user: demoUser._id, product: products[1]._id,
      rating: 5, title: 'ANC is insane',
      comment: 'These earbuds block out everything. Great sound quality and the fit is perfect. Highly recommended!',
      isVerifiedPurchase: true,
    },
    {
      user: demoUser._id, product: products[2]._id,
      rating: 4, title: 'Excellent running shoe',
      comment: 'Super lightweight and responsive. My marathon times have improved since switching to these. Only wish they came in more colors.',
      isVerifiedPurchase: true,
    },
  ];
  await Review.insertMany(sampleReviews);

  console.log('\n✅ ── Seed Complete ─────────────────────────────────');
  console.log('📧 Admin:   admin@luxestore.com  / admin123456');
  console.log('📧 User:    user@luxestore.com   / user123456');
  console.log('────────────────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
