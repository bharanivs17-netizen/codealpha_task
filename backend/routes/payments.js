// routes/payments.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { createPaymentIntent, stripeWebhook } = require('../controllers/paymentController');

// Webhook must use raw body — mounted before express.json() in server.js
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/create-intent', protect, createPaymentIntent);

module.exports = router;
