const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'organizer', 'participant'],
      default: 'participant',
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpire: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpire: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    isOrganizerApproved: { type: Boolean, default: false }, // relevant only for organizer role
    isActive: { type: Boolean, default: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    notificationPrefs: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
