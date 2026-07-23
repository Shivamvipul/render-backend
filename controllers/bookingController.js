const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { generateBookingNumber, generateTicketId } = require('../utils/generateIds');
const { generateQRCode } = require('../services/qrService');
const { sendEmail, templates } = require('../services/emailService');
const { emitToUser, emitToEventRoom } = require('../sockets');
const { detectDuplicateRegistration } = require('../services/aiService');

// @desc    Create a booking (for free tickets this confirms immediately; paid tickets stay 'pending' until payment)
// @route   POST /api/bookings
const createBooking = asyncHandler(async (req, res) => {
  const { eventId, tierName, quantity = 1 } = req.body;

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.status !== 'published') throw new ApiError(400, 'This event is not open for booking');

  const tier = event.ticketTiers.find((t) => t.name === tierName);
  if (!tier) throw new ApiError(404, 'Ticket tier not found');
  if (tier.quantity - tier.sold < quantity) throw new ApiError(400, 'Not enough seats available for this tier');

  const isDuplicate = await detectDuplicateRegistration(Booking, { userId: req.user._id, eventId });
  if (isDuplicate) throw new ApiError(409, 'You already have an active booking for this event');

  const totalAmount = tier.price * quantity;

  const booking = await Booking.create({
    bookingNumber: generateBookingNumber(),
    event: eventId,
    user: req.user._id,
    tierName,
    quantity,
    totalAmount,
    status: totalAmount === 0 ? 'confirmed' : 'pending',
  });

  // Reserve seats optimistically; for paid bookings a payment webhook/verify call finalizes this
  tier.sold += quantity;
  event.availableSeats -= quantity;
  await event.save();

  if (totalAmount === 0) {
    await issueTicketsForBooking(booking, event, tier);
  }

  emitToEventRoom(event._id.toString(), 'event:seatsUpdated', { eventId: event._id, availableSeats: event.availableSeats });

  sendSuccess(res, 201, 'Booking created', booking);
});

// Helper: generates Ticket docs (one per quantity unit) with QR codes for a confirmed booking
const issueTicketsForBooking = async (booking, event, tier) => {
  const tickets = [];
  for (let i = 0; i < booking.quantity; i++) {
    const ticketId = generateTicketId();
    const qrPayload = { ticketId, bookingId: booking._id.toString(), eventId: event._id.toString() };
    const qrCodeImage = await generateQRCode(qrPayload);

    const ticket = await Ticket.create({
      ticketId,
      booking: booking._id,
      event: event._id,
      user: booking.user,
      tierName: tier.name,
      ticketType: tier.type,
      qrCodeData: JSON.stringify(qrPayload),
      qrCodeImage,
    });
    tickets.push(ticket);
  }

  await Notification.create({
    user: booking.user,
    type: 'ticket_booked',
    title: 'Booking Confirmed',
    message: `Your booking for "${event.title}" is confirmed.`,
    relatedEvent: event._id,
  });
  emitToUser(booking.user.toString(), 'notification', { title: 'Booking Confirmed', message: event.title });

  return tickets;
};

// @desc    Get bookings for logged-in user (or all, for admin/organizer views)
// @route   GET /api/bookings
const getBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = req.user.role === 'participant' ? { user: req.user._id } : {};

  if (req.user.role === 'organizer') {
    const myEvents = await Event.find({ organizer: req.user._id }).select('_id');
    query.event = { $in: myEvents.map((e) => e._id) };
  }

  const bookings = await Booking.find(query)
    .populate('event', 'title banner startDate venue')
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Booking.countDocuments(query);

  sendSuccess(res, 200, 'Bookings fetched', bookings, { page: Number(page), limit: Number(limit), total });
});

// @desc    Get a single booking (used by the checkout page)
// @route   GET /api/bookings/:id
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('event', 'title banner startDate venue')
    .populate('payment');
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.user.toString() !== req.user._id.toString() && req.user.role === 'participant') {
    throw new ApiError(403, 'Not authorized to view this booking');
  }
  sendSuccess(res, 200, 'Booking fetched', booking);
});

// @desc    Cancel a booking
// @route   DELETE /api/bookings/:id
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.user.toString() !== req.user._id.toString() && req.user.role === 'participant') {
    throw new ApiError(403, 'Not authorized to cancel this booking');
  }

  booking.status = 'cancelled';
  await booking.save();

  const event = await Event.findById(booking.event);
  if (event) {
    const tier = event.ticketTiers.find((t) => t.name === booking.tierName);
    if (tier) tier.sold = Math.max(0, tier.sold - booking.quantity);
    event.availableSeats += booking.quantity;
    await event.save();
    emitToEventRoom(event._id.toString(), 'event:seatsUpdated', { eventId: event._id, availableSeats: event.availableSeats });
  }

  sendSuccess(res, 200, 'Booking cancelled', booking);
});

module.exports = { createBooking, getBookings, getBookingById, cancelBooking, issueTicketsForBooking };
