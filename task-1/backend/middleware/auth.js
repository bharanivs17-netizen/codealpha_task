// middleware/auth.js — JWT authentication middleware
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * protect — Verify JWT from Authorization header or cookie.
 * Attaches req.user on success.
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header first, then cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized — invalid token');
  }
});

/**
 * adminOnly — Must come after protect.
 * Allows access only to users with role === 'admin'.
 */
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403);
  throw new Error('Forbidden — admin access required');
};
