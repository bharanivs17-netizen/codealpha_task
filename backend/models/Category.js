// models/Category.js — Product category with parent/child hierarchy
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, unique: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon:        { type: String, default: '' },      // emoji or icon class
    image:       { type: String, default: '' },      // banner image
    parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
