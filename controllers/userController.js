const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

// @desc    Update own profile
// @route   PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'notificationPrefs'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  if (req.file) req.user.avatar = `/uploads/${req.file.filename}`;
  await req.user.save();
  sendSuccess(res, 200, 'Profile updated', req.user);
});

// @desc    Get own profile
// @route   GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile fetched', req.user);
});

// @desc    Toggle wishlist item
// @route   POST /api/users/wishlist/:eventId
const toggleWishlist = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const idx = req.user.wishlist.findIndex((id) => id.toString() === eventId);
  if (idx > -1) {
    req.user.wishlist.splice(idx, 1);
  } else {
    req.user.wishlist.push(eventId);
  }
  await req.user.save();
  sendSuccess(res, 200, 'Wishlist updated', req.user.wishlist);
});

// @desc    Get all users (admin)
// @route   GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const users = await User.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(query);

  sendSuccess(res, 200, 'Users fetched', users, { page: Number(page), limit: Number(limit), total });
});

// @desc    Update user active status / role (admin)
// @route   PUT /api/users/:id
const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const { isActive, role } = req.body;
  if (isActive !== undefined) user.isActive = isActive;
  if (role) user.role = role;
  await user.save();

  sendSuccess(res, 200, 'User updated', user);
});

module.exports = { updateProfile, getProfile, toggleWishlist, getAllUsers, adminUpdateUser };
