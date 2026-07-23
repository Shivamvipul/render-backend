const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    suggestion: { type: String, default: '' },
    organizerReply: { type: String, default: '' },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', null],
      default: null,
    }, // populated by AI sentiment analysis service
    isSpam: { type: Boolean, default: false },
  },
  { timestamps: true }
);

feedbackSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
