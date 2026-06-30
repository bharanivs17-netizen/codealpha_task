// models/Order.js — Order with items, shipping, payment, and status tracking
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:      { type: String, required: true },
  image:     { type: String },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName:   String,
  phone:      String,
  street:     String,
  city:       String,
  state:      String,
  postalCode: String,
  country:    { type: String, default: 'US' },
});

const orderSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber:     { type: String, unique: true },
    items:           [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    // Pricing breakdown
    itemsPrice:      { type: Number, required: true },
    shippingPrice:   { type: Number, default: 0 },
    taxPrice:        { type: Number, default: 0 },
    totalPrice:      { type: Number, required: true },
    // Payment
    paymentMethod:   { type: String, default: 'stripe' },
    paymentIntentId: { type: String },
    isPaid:          { type: Boolean, default: false },
    paidAt:          { type: Date },
    // Fulfillment
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    isDelivered:   { type: Boolean, default: false },
    deliveredAt:   { type: Date },
    trackingNumber: { type: String, default: '' },
    notes:         { type: String, default: '' },
  },
  { timestamps: true }
);

// Generate order number before save
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `LX-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
