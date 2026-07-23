const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Creates a PaymentIntent for a booking. amount is in the smallest currency unit (e.g. cents).
const createPaymentIntent = async ({ amount, currency = 'usd', metadata = {} }) => {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
};

const verifyPaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

const createRefund = async (paymentIntentId, reason) => {
  return stripe.refunds.create({ payment_intent: paymentIntentId, reason: 'requested_by_customer' });
};

const constructWebhookEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

module.exports = { stripe, createPaymentIntent, verifyPaymentIntent, createRefund, constructWebhookEvent };
