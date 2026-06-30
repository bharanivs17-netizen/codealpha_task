// controllers/productController.js — Full CRUD + search/filter/sort/paginate
const asyncHandler = require('express-async-handler');
const Product  = require('../models/Product');
const Review   = require('../models/Review');
const Category = require('../models/Category');

// @desc   Get all products (search, filter, sort, paginate)
// @route  GET /api/products
// @access Public
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    keyword, category, minPrice, maxPrice,
    minRating, sort, page = 1, limit = 12,
    featured, brand,
  } = req.query;

  const query = { isActive: true };

  // Full-text search
  if (keyword) query.$text = { $search: keyword };

  // Category filter
  if (category) query.category = category;

  // Price range
  if (minPrice || maxPrice) {
    query.finalPrice = {};
    if (minPrice) query.finalPrice.$gte = Number(minPrice);
    if (maxPrice) query.finalPrice.$lte = Number(maxPrice);
  }

  // Rating filter
  if (minRating) query.averageRating = { $gte: Number(minRating) };

  // Featured / brand
  if (featured === 'true') query.isFeatured = true;
  if (brand) query.brand = new RegExp(brand, 'i');

  // Sort options
  const sortOptions = {
    newest:      { createdAt: -1 },
    'price-asc': { finalPrice: 1 },
    'price-desc':{ finalPrice: -1 },
    rating:      { averageRating: -1 },
    popular:     { sold: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
    products,
  });
});

// @desc   Get single product by slug
// @route  GET /api/products/:slug
// @access Public
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Fetch reviews separately
  const reviews = await Review.find({ product: product._id })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, product, reviews });
});

// @desc   Create product (Admin)
// @route  POST /api/products
// @access Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  // Handle image uploads
  const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

  const productData = {
    ...req.body,
    images,
    thumbnail: images[0] || '',
    features:  req.body.features ? JSON.parse(req.body.features) : [],
    tags:      req.body.tags     ? JSON.parse(req.body.tags)     : [],
  };

  const product = await Product.create(productData);
  res.status(201).json({ success: true, product });
});

// @desc   Update product (Admin)
// @route  PUT /api/products/:id
// @access Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const newImages = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
  const updates = { ...req.body };

  if (newImages.length > 0) {
    updates.images    = [...(product.images || []), ...newImages];
    updates.thumbnail = updates.images[0];
  }
  if (req.body.features) updates.features = JSON.parse(req.body.features);
  if (req.body.tags)     updates.tags     = JSON.parse(req.body.tags);

  product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  });
  res.json({ success: true, product });
});

// @desc   Delete product (Admin)
// @route  DELETE /api/products/:id
// @access Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc   Add review to product
// @route  POST /api/products/:id/reviews
// @access Private
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if already reviewed
  const existing = await Review.findOne({ user: req.user._id, product: product._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({
    user:    req.user._id,
    product: product._id,
    rating:  Number(rating),
    title,
    comment,
    images: req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [],
  });

  res.status(201).json({ success: true, review });
});

// @desc   Get related products by category
// @route  GET /api/products/:id/related
// @access Public
exports.getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const related = await Product.find({
    category: product.category,
    _id:      { $ne: product._id },
    isActive: true,
  }).limit(8).select('name slug finalPrice thumbnail averageRating numReviews');

  res.json({ success: true, products: related });
});
