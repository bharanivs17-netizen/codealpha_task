// controllers/wishlistController.js — Toggle-based wishlist
const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');

// @desc   Get user wishlist
// @route  GET /api/wishlist
// @access Private
exports.getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate('products', 'name slug thumbnail finalPrice averageRating numReviews stock');
  res.json({ success: true, wishlist: wishlist || { products: [] } });
});

// @desc   Toggle product in wishlist (add if absent, remove if present)
// @route  POST /api/wishlist/toggle
// @access Private
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
    return res.json({ success: true, added: true, wishlist });
  }

  const idx = wishlist.products.indexOf(productId);
  let added;

  if (idx === -1) {
    wishlist.products.push(productId);
    added = true;
  } else {
    wishlist.products.splice(idx, 1);
    added = false;
  }

  await wishlist.save();
  res.json({ success: true, added, wishlist });
});
