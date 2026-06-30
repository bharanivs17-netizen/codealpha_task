// controllers/orderController.js — Order placement, history, admin management
const asyncHandler = require('express-async-handler');
const Order   = require('../models/Order');
const Cart    = require('../models/Cart');
const Product = require('../models/Product');

// @desc   Place a new order
// @route  POST /api/orders
// @access Private
exports.placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'stripe', paymentIntentId, notes } = req.body;

  // Get cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name thumbnail finalPrice stock');

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  // Validate stock
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for "${item.product.name}"`);
    }
  }

  const itemsPrice    = cart.totalPrice;
  const shippingPrice = itemsPrice >= 100 ? 0 : 9.99;
  const taxPrice      = +(itemsPrice * 0.08).toFixed(2);   // 8% tax
  const totalPrice    = +(itemsPrice + shippingPrice + taxPrice).toFixed(2);

  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map((i) => ({
      product:  i.product._id,
      name:     i.product.name,
      image:    i.product.thumbnail,
      price:    i.price,
      quantity: i.quantity,
    })),
    shippingAddress,
    paymentMethod,
    paymentIntentId,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    isPaid: !!paymentIntentId,
    paidAt: paymentIntentId ? Date.now() : undefined,
    notes,
  });

  // Decrement stock & increment sold for each product
  await Promise.all(
    cart.items.map((i) =>
      Product.findByIdAndUpdate(i.product._id, {
        $inc: { stock: -i.quantity, sold: i.quantity },
      })
    )
  );

  // Clear cart
  await Cart.findByIdAndUpdate(cart._id, { items: [], totalPrice: 0 });

  res.status(201).json({ success: true, order });
});

// @desc   Get logged-in user's orders
// @route  GET /api/orders/my-orders
// @access Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @desc   Get single order
// @route  GET /api/orders/:id
// @access Private
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  // Ensure ownership unless admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

// ──── Admin Routes ────────────────────────────────────────────────

// @desc   Get all orders (Admin)
// @route  GET /api/orders
// @access Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};

  const total  = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, total, orders });
});

// @desc   Update order status (Admin)
// @route  PUT /api/orders/:id/status
// @access Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt  = Date.now();
  }
  await order.save();
  res.json({ success: true, order });
});
