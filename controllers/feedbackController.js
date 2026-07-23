const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { analyzeSentiment, detectSpam } = require('../services/aiService');
const { emitToUser } = require('../sockets');

// @desc    Submit feedback for an event
// @route   POST /api/feedback
const createFeedback = asyncHandler(async (req, res) => {
  const { eventId, rating, comment, suggestion } = req.body;

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found');

  const sentiment = comment ? await analyzeSentiment(comment) : null;
  const isSpam = comment ? await detectSpam(comment) : false;

  const feedback = await Feedback.create({
    event: eventId,
    user: req.user._id,
    rating,
    comment,
    suggestion,
    sentiment,
    isSpam,
  });

  // Recompute average rating
  const agg = await Feedback.aggregate([
    { $match: { event: event._id, isSpam: false } },
    { $group: { _id: '$event', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg.length) {
    event.avgRating = Math.round(agg[0].avg * 10) / 10;
    event.ratingCount = agg[0].count;
    await event.save();
  }

  await Notification.create({
    user: event.organizer,
    type: 'feedback_received',
    title: 'New Feedback',
    message: `New ${rating}-star feedback on "${event.title}"`,
    relatedEvent: event._id,
  });
  emitToUser(event.organizer.toString(), 'notification', { title: 'New Feedback', message: event.title });

  sendSuccess(res, 201, 'Feedback submitted', feedback);
});

// @desc    Get feedback for an event
// @route   GET /api/feedback
const getFeedback = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const query = { isSpam: false };
  if (eventId) query.event = eventId;

  const feedback = await Feedback.find(query).populate('user', 'name avatar').sort('-createdAt');
  sendSuccess(res, 200, 'Feedback fetched', feedback);
});

// @desc    Organizer replies to feedback
// @route   PUT /api/feedback/:id/reply
const replyToFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new ApiError(404, 'Feedback not found');

  feedback.organizerReply = req.body.reply;
  await feedback.save();

  sendSuccess(res, 200, 'Reply added', feedback);
});

module.exports = { createFeedback, getFeedback, replyToFeedback };
