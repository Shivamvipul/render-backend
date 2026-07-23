const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { createPaymentIntent, verifyPaymentIntent, createRefund } = require('../services/stripeService');
const { issueTicketsForBooking } = require('./bookingController');
const { emitToUser } = require('../sockets');
const Notification = require('../models/Notification');

// @desc    Create a Stripe PaymentIntent for a pending booking
// @route   POST /api/payment/create-order
const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId).populate('event', 'title');
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.user.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized');
  if (booking.status !== 'pending') throw new ApiError(400, 'This booking is not awaiting payment');

  const intent = await createPaymentIntent({
    amount: booking.totalAmount,
    currency: 'usd',
    metadata: { bookingId: booking._id.toString(), userId: req.user._id.toString() },
  });

  const payment = await Payment.create({
    booking: booking._id,
    user: req.user._id,
    event: booking.event._id,
    stripePaymentIntentId: intent.id,
    amount: booking.totalAmount,
    status: 'pending',
  });

  booking.payment = payment._id;
  await booking.save();

  sendSuccess(res, 201, 'Payment order created', {
    clientSecret: intent.client_secret,
    paymentId: payment._id,
  });
});

// @desc    Verify payment after client-side confirmation and finalize booking + issue tickets
// @route   POST /api/payment/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.body;
  const payment = await Payment.findById(paymentId).populate('booking');
  if (!payment) throw new ApiError(404, 'Payment record not found');

  const intent = await verifyPaymentIntent(payment.stripePaymentIntentId);

  if (intent.status === 'succeeded') {
    payment.status = 'success';
    await payment.save();

    const booking = await Booking.findById(payment.booking._id);
    booking.status = 'confirmed';
    await booking.save();

    const event = await Event.findById(payment.event);
    const tier = event.ticketTiers.find((t) => t.name === booking.tierName);
    await issueTicketsForBooking(booking, event, tier);

    await Notification.create({
      user: req.user._id,
      type: 'payment_successful',
      title: 'Payment Successful',
      message: `Your payment of $${payment.amount} was successful.`,
      relatedEvent: event._id,
    });
    emitToUser(req.user._id.toString(), 'notification', { title: 'Payment Successful', message: event.title });

    return sendSuccess(res, 200, 'Payment verified and tickets issued', { payment, booking });
  }

  payment.status = 'failed';
  await payment.save();
  throw new ApiError(400, `Payment not completed. Status: ${intent.status}`);
});

// @desc    Refund a payment
// @route   POST /api/payment/:id/refund
const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status !== 'success') throw new ApiError(400, 'Only successful payments can be refunded');

  await createRefund(payment.stripePaymentIntentId, req.body.reason);

  payment.status = 'refunded';
  payment.refundReason = req.body.reason || 'Not specified';
  await payment.save();

  await Booking.findByIdAndUpdate(payment.booking, { status: 'refunded' });

  sendSuccess(res, 200, 'Payment refunded', payment);
});

// @desc    Stripe webhook receiver (handles async payment confirmations)
// @route   POST /api/payment/webhook
const stripeWebhook = asyncHandler(async (req, res) => {
  // Note: this route must use express.raw() body parsing, wired in app.js before json()
  const { constructWebhookEvent } = require('../services/stripeService');
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers['stripe-signature']);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    await Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'success' });
  }
  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    await Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'failed' });
  }

  res.json({ received: true });
});

module.exports = { createOrder, verifyPayment, refundPayment, stripeWebhook };
