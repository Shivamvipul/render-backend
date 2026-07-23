const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "General", "VIP", "Early Bird"
    type: { type: String, enum: ['free', 'paid', 'vip', 'early_bird'], default: 'free' },
    price: { type: Number, default: 0 },
    quantity: { type: Number, required: true },
    sold: { type: Number, default: 0 },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    banner: { type: String, default: '' },
    gallery: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: String }],
    venue: { type: String, required: true },
    mapLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    time: { type: String },
    capacity: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    ticketTiers: [ticketTierSchema],
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'pending_approval'],
      default: 'draft',
    },
    isApproved: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

eventSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now().toString(36);
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
