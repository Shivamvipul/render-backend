const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    provider: { type: String, enum: ['stripe'], default: 'stripe' },
    stripePaymentIntentId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    invoiceUrl: { type: String },
    refundReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
