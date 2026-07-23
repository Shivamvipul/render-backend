const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  sendSuccess(res, 200, 'Notifications fetched', notifications, { unreadCount });
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  sendSuccess(res, 200, 'Notification marked as read', notification);
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  sendSuccess(res, 200, 'All notifications marked as read');
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
