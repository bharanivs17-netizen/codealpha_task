// models/Review.js — Product review with rating, comment, and images
const mongoose = require('mongoose');
const Product = require('./Product');

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    title:   { type: String, default: '' },
    comment: { type: String, required: true },
    images:  [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static: recalculate product averageRating & numReviews
reviewSchema.statics.calcAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: +stats[0].avgRating.toFixed(1),
      numReviews:    stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { averageRating: 0, numReviews: 0 });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.product);
});

reviewSchema.post('remove', function () {
  this.constructor.calcAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
