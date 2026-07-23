const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tierName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
