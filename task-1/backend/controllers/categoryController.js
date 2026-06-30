// controllers/categoryController.js — Category CRUD
const asyncHandler  = require('express-async-handler');
const Category = require('../models/Category');
const Product  = require('../models/Product');

// @desc   Get all categories
// @route  GET /api/categories
// @access Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .sort({ sortOrder: 1, name: 1 });

  res.json({ success: true, categories });
});

// @desc   Get single category + its products
// @route  GET /api/categories/:slug
// @access Public
exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) { res.status(404); throw new Error('Category not found'); }

  const products = await Product.find({ category: category._id, isActive: true })
    .select('name slug finalPrice thumbnail averageRating numReviews')
    .sort({ createdAt: -1 });

  res.json({ success: true, category, products });
});

// @desc   Create category (Admin)
// @route  POST /api/categories
// @access Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, icon, parent, sortOrder } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const category = await Category.create({ name, slug, description, icon, image, parent, sortOrder });
  res.status(201).json({ success: true, category });
});

// @desc   Update category (Admin)
// @route  PUT /api/categories/:id
// @access Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) updates.image = `/uploads/${req.file.filename}`;

  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  });
  if (!category) { res.status(404); throw new Error('Category not found'); }
  res.json({ success: true, category });
});

// @desc   Delete category (Admin)
// @route  DELETE /api/categories/:id
// @access Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) { res.status(404); throw new Error('Category not found'); }

  // Check if products exist in this category
  const count = await Product.countDocuments({ category: category._id });
  if (count > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${count} product(s) exist in this category`);
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});
