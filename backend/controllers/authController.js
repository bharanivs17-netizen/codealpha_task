// controllers/authController.js — Register, login, profile, logout
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password });
  sendTokenResponse(user, 201, res);
});

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc   Get logged-in user profile
// @route  GET /api/auth/me
// @access Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// @desc   Update profile
// @route  PUT /api/auth/update-profile
// @access Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'avatar'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  // Handle avatar upload
  if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user });
});

// @desc   Add or update address
// @route  POST /api/auth/addresses
// @access Private
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { isDefault, ...addressData } = req.body;

  if (isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  user.addresses.push({ ...addressData, isDefault: isDefault || false });
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// @desc   Delete address
// @route  DELETE /api/auth/addresses/:id
// @access Private
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// @desc   Change password
// @route  PUT /api/auth/change-password
// @access Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc   Logout (clear cookie)
// @route  POST /api/auth/logout
// @access Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});
