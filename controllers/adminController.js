const User = require('../models/User');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { emitToUser } = require('../sockets');

// @desc    System-wide analytics summary for the admin dashboard
// @route   GET /api/admin/analytics
const getSystemAnalytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrganizers, totalEvents, publishedEvents, totalBookings, revenueAgg] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'organizer' }),
    Event.countDocuments(),
    Event.countDocuments({ status: 'published' }),
    Booking.countDocuments({ status: { $ne: 'cancelled' } }),
    Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  sendSuccess(res, 200, 'System analytics fetched', {
    totalUsers,
    totalOrganizers,
    totalEvents,
    publishedEvents,
    totalBookings,
    totalRevenue: revenueAgg[0]?.total || 0,
  });
});

// @desc    List organizers pending approval
// @route   GET /api/admin/organizers/pending
const getPendingOrganizers = asyncHandler(async (req, res) => {
  const organizers = await User.find({ role: 'organizer', isOrganizerApproved: false });
  sendSuccess(res, 200, 'Pending organizers fetched', organizers);
});

// @desc    Approve or reject an organizer
// @route   PATCH /api/admin/organizers/:id/approve
const approveOrganizer = asyncHandler(async (req, res) => {
  const { approve } = req.body; // boolean
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'organizer') throw new ApiError(404, 'Organizer not found');

  user.isOrganizerApproved = !!approve;
  await user.save();

  await Notification.create({
    user: user._id,
    type: 'organizer_approved',
    title: approve ? 'Organizer Approved' : 'Organizer Application Rejected',
    message: approve
      ? 'Congratulations! You can now create and publish events.'
      : 'Your organizer application was not approved at this time.',
  });
  emitToUser(user._id.toString(), 'notification', { title: 'Organizer Status Updated' });

  await AuditLog.create({
    actor: req.user._id,
    action: approve ? 'APPROVE_ORGANIZER' : 'REJECT_ORGANIZER',
    targetType: 'User',
    targetId: user._id,
  });

  sendSuccess(res, 200, 'Organizer status updated', user);
});

// @desc    List events pending approval
// @route   GET /api/admin/events/pending
const getPendingEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ status: 'pending_approval' }).populate('organizer', 'name email').populate('category', 'name');
  sendSuccess(res, 200, 'Pending events fetched', events);
});

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({}).populate('actor', 'name email').sort('-createdAt').limit(200);
  sendSuccess(res, 200, 'Audit logs fetched', logs);
});

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
const getActivityLogs = asyncHandler(async (req, res) => {
  const logs = await ActivityLog.find({}).populate('user', 'name email').sort('-createdAt').limit(200);
  sendSuccess(res, 200, 'Activity logs fetched', logs);
});

module.exports = {
  getSystemAnalytics,
  getPendingOrganizers,
  approveOrganizer,
  getPendingEvents,
  getAuditLogs,
  getActivityLogs,
};
