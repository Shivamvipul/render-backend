const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['revenue', 'attendance', 'booking', 'feedback', 'popular_events'],
      required: true,
    },
    format: { type: String, enum: ['pdf', 'excel', 'csv'], required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    fileUrl: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
