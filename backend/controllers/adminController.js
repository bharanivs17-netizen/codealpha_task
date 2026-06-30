// controllers/adminController.js — Analytics & user management
const asyncHandler = require('express-async-handler');
const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Category = require('../models/Category');

// @desc   Get dashboard analytics
// @route  GET /api/admin/analytics
// @access Private/Admin
exports.getAnalytics = asyncHandler(async (req, res) => {
  // Summary counts
  const [totalUsers, totalProducts, totalOrders, totalCategories] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Category.countDocuments(),
  ]);

  // Revenue
  const revenueResult = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Monthly revenue — last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders:  { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Top products by sold
  const topProducts = await Product.find()
    .sort({ sold: -1 })
    .limit(5)
    .select('name sold finalPrice thumbnail');

  // Recent orders
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    summary: { totalUsers, totalProducts, totalOrders, totalCategories, totalRevenue },
    ordersByStatus,
    monthlyRevenue,
    topProducts,
    recentOrders,
  });
});

// @desc   Get all users (Admin)
// @route  GET /api/admin/users
// @access Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = search ? { name: new RegExp(search, 'i') } : {};

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, total, users });
});

// @desc   Update user role (Admin)
// @route  PUT /api/admin/users/:id
// @access Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, isActive },
    { new: true, runValidators: true }
  );
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, user });
});

// @desc   Delete user (Admin)
// @route  DELETE /api/admin/users/:id
// @access Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete admin users');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});
