// config/db.js — MongoDB connection via Mongoose
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,  // fail fast — 3s instead of 30s
      connectTimeoutMS:         3000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️  Running in OFFLINE mode — connect MongoDB to enable auth, cart, and orders.');
    // Do NOT exit — serve static frontend & demo API responses
  }
};

module.exports = connectDB;
