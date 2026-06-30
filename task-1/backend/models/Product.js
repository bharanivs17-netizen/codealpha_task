// models/Product.js — Full product schema with ratings, reviews, variants
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, 'Product name is required'], trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDesc:   { type: String, default: '' },
    price:       { type: Number, required: true, min: 0 },
    discount:    { type: Number, default: 0, min: 0, max: 100 },   // percentage
    finalPrice: {
      type: Number,
      default: function () {
        return this.price - (this.price * this.discount) / 100;
      },
    },
    images:      [{ type: String }],                                // array of image URLs
    thumbnail:   { type: String, default: '' },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand:       { type: String, default: '' },
    stock:       { type: Number, default: 0, min: 0 },
    sku:         { type: String, unique: true },
    tags:        [{ type: String }],
    features:    [{ type: String }],                                // bullet-point features
    specifications: { type: Map, of: String },                     // key-value specs
    isFeatured:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    // Aggregated rating stats (updated on review save)
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews:    { type: Number, default: 0 },
    sold:          { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-save: recalculate finalPrice
productSchema.pre('save', function (next) {
  this.finalPrice = +(this.price - (this.price * this.discount) / 100).toFixed(2);
  next();
});

// Indexes for search & filter
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1, averageRating: -1 });

module.exports = mongoose.model('Product', productSchema);
