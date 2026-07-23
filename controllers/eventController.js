const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { broadcast, emitToUser } = require('../sockets');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Get all events (public) with search/filter/sort/pagination
// @route   GET /api/events
const getEvents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    status = 'published',
    tag,
    sortBy = '-createdAt',
    minPrice,
    maxPrice,
    startDate,
    endDate,
  } = req.query;

  const query = {};
  // Public visitors only ever see published events; organizers/admins can pass other statuses via dashboard routes
  query.status = status;
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (search) query.$text = { $search: search };
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }
  if (minPrice || maxPrice) {
    query['ticketTiers.price'] = {};
    if (minPrice) query['ticketTiers.price'].$gte = Number(minPrice);
    if (maxPrice) query['ticketTiers.price'].$lte = Number(maxPrice);
  }

  const events = await Event.find(query)
    .populate('category', 'name slug')
    .populate('organizer', 'name avatar')
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Event.countDocuments(query);

  sendSuccess(res, 200, 'Events fetched', events, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
});

// @desc    Get featured/upcoming events for landing page
// @route   GET /api/events/featured
const getFeaturedEvents = asyncHandler(async (req, res) => {
  const featured = await Event.find({ status: 'published' }).sort('-views').limit(6).populate('category', 'name');
  const upcoming = await Event.find({ status: 'published', startDate: { $gte: new Date() } })
    .sort('startDate')
    .limit(8)
    .populate('category', 'name');
  sendSuccess(res, 200, 'Featured events fetched', { featured, upcoming });
});

// @desc    Get single event by id or slug
// @route   GET /api/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  const event = await Event.findOne(query).populate('category', 'name slug').populate('organizer', 'name avatar email');
  if (!event) throw new ApiError(404, 'Event not found');

  event.views += 1;
  await event.save();

  const feedbacks = await Feedback.find({ event: event._id, isSpam: false })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .limit(20);

  sendSuccess(res, 200, 'Event fetched', { event, feedbacks });
});

// @desc    Create event (organizer)
// @route   POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  const payload = { ...req.body, organizer: req.user._id };
  payload.availableSeats = payload.capacity;
  if (req.files?.banner?.[0]) payload.banner = `/uploads/${req.files.banner[0].filename}`;
  if (req.files?.gallery) payload.gallery = req.files.gallery.map((f) => `/uploads/${f.filename}`);

  // Organizer-created events start pending approval unless the organizer is pre-approved and event is saved as draft
  payload.status = payload.status === 'published' ? 'pending_approval' : 'draft';

  const event = await Event.create(payload);
  sendSuccess(res, 201, 'Event created', event);
});

// @desc    Update event (organizer who owns it, or admin)
// @route   PUT /api/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'super_admin') throw new ApiError(403, 'Not authorized to update this event');

  Object.assign(event, req.body);
  if (req.files?.banner?.[0]) event.banner = `/uploads/${req.files.banner[0].filename}`;
  if (req.files?.gallery) event.gallery.push(...req.files.gallery.map((f) => `/uploads/${f.filename}`));

  await event.save();
  sendSuccess(res, 200, 'Event updated', event);
});

// @desc    Delete event
// @route   DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'super_admin') throw new ApiError(403, 'Not authorized to delete this event');

  await event.deleteOne();
  sendSuccess(res, 200, 'Event deleted');
});

// @desc    Publish / unpublish event
// @route   PATCH /api/events/:id/status
const setEventStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'published' | 'draft' | 'cancelled'
  const event = await Event.findById(req.params.id).populate('organizer', 'name');
  if (!event) throw new ApiError(404, 'Event not found');

  const isOwner = event.organizer._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'super_admin') throw new ApiError(403, 'Not authorized');

  event.status = status;
  await event.save();

  if (status === 'published') {
    broadcast('event:published', { eventId: event._id, title: event.title });
  }
  if (status === 'cancelled') {
    broadcast('event:cancelled', { eventId: event._id, title: event.title });
  }

  sendSuccess(res, 200, `Event status set to ${status}`, event);
});

// @desc    Admin approve event
// @route   PATCH /api/events/:id/approve
const approveEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { isApproved: true, status: 'published' },
    { new: true }
  );
  if (!event) throw new ApiError(404, 'Event not found');

  await Notification.create({
    user: event.organizer,
    type: 'event_approved',
    title: 'Event Approved',
    message: `Your event "${event.title}" has been approved and published.`,
    relatedEvent: event._id,
  });
  emitToUser(event.organizer.toString(), 'notification', { title: 'Event Approved', message: event.title });

  await AuditLog.create({ actor: req.user._id, action: 'APPROVE_EVENT', targetType: 'Event', targetId: event._id });

  sendSuccess(res, 200, 'Event approved and published', event);
});

// @desc    Get events for the logged-in organizer
// @route   GET /api/events/mine
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort('-createdAt');
  sendSuccess(res, 200, 'Your events fetched', events);
});

module.exports = {
  getEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventStatus,
  approveEvent,
  getMyEvents,
};
