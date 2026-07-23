const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true }, // human readable unique id
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tierName: { type: String, required: true },
    ticketType: { type: String, enum: ['free', 'paid', 'vip', 'early_bird'], default: 'free' },
    qrCodeData: { type: String, required: true }, // encoded payload string
    qrCodeImage: { type: String }, // data URL or file path
    pdfUrl: { type: String },
    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
