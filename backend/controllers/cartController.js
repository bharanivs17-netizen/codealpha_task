// controllers/cartController.js — Cart CRUD (DB-backed per user)
const asyncHandler = require('express-async-handler');
const Cart    = require('../models/Cart');
const Product = require('../models/Product');

// @desc   Get user cart
// @route  GET /api/cart
// @access Private
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name slug thumbnail finalPrice stock isActive');
  res.json({ success: true, cart: cart || { items: [], totalPrice: 0 } });
});

// @desc   Add item to cart (or increment)
// @route  POST /api/cart/add
// @access Private
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingIdx = cart.items.findIndex(
    (i) => i.product.toString() === productId
  );

  if (existingIdx >= 0) {
    cart.items[existingIdx].quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity), price: product.finalPrice });
  }

  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail finalPrice stock');
  res.json({ success: true, cart });
});

// @desc   Update cart item quantity
// @route  PUT /api/cart/update
// @access Private
exports.updateCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) { res.status(404); throw new Error('Item not in cart'); }

  item.quantity = Number(quantity);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail finalPrice stock');
  res.json({ success: true, cart });
});

// @desc   Remove item from cart
// @route  DELETE /api/cart/remove/:productId
// @access Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true, cart });
});

// @desc   Clear entire cart
// @route  DELETE /api/cart/clear
// @access Private
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], totalPrice: 0 }
  );
  res.json({ success: true, message: 'Cart cleared' });
});
