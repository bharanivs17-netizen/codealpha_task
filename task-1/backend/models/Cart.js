// models/Cart.js — Session cart stored in DB (per user)
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price:    { type: Number, required: true },   // captured price at add-to-cart
});

const cartSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items:      [cartItemSchema],
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Recalculate total before every save
cartSchema.pre('save', function (next) {
  this.totalPrice = +this.items
    .reduce((acc, item) => acc + item.price * item.quantity, 0)
    .toFixed(2);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
