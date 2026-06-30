// controllers/paymentController.js — Stripe Payment Intent creation
const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc   Create Stripe Payment Intent
// @route  POST /api/payments/create-intent
// @access Private
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'usd' } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount:   Math.round(amount * 100),  // cents
    currency,
    metadata: { userId: req.user._id.toString() },
  });

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

// @desc   Stripe Webhook — update order payment status
// @route  POST /api/payments/webhook
// @access Public (Stripe signed)
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400);
    throw new Error(`Webhook error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const { id } = event.data.object;
    const Order = require('../models/Order');
    await Order.findOneAndUpdate(
      { paymentIntentId: id },
      { isPaid: true, paidAt: Date.now(), status: 'confirmed' }
    );
  }

  res.json({ received: true });
});
