const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'event_published',
        'ticket_booked',
        'payment_successful',
        'event_reminder',
        'event_cancelled',
        'feedback_received',
        'organizer_approved',
        'event_approved',
        'general',
      ],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
