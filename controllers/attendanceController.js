const Ticket = require('../models/Ticket');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { emitToEventRoom } = require('../sockets');

// @desc    Organizer scans a QR code to check in an attendee
// @route   POST /api/attendance/scan
const scanTicket = asyncHandler(async (req, res) => {
  const { qrCodeData } = req.body; // raw string encoded in the QR
  let parsed;
  try {
    parsed = JSON.parse(qrCodeData);
  } catch {
    throw new ApiError(400, 'Invalid QR code payload');
  }

  const ticket = await Ticket.findOne({ ticketId: parsed.ticketId }).populate('event', 'title organizer');
  if (!ticket) throw new ApiError(404, 'Ticket not found. This QR code may be invalid.');

  const isOwner = ticket.event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'super_admin') throw new ApiError(403, 'Not authorized to scan tickets for this event');

  if (ticket.isUsed) {
    throw new ApiError(409, `Ticket already used at ${ticket.usedAt?.toLocaleString() || 'a previous time'}. Duplicate entry blocked.`);
  }

  ticket.isUsed = true;
  ticket.usedAt = new Date();
  await ticket.save();

  const attendance = await Attendance.create({
    event: ticket.event._id,
    ticket: ticket._id,
    user: ticket.user,
    scannedBy: req.user._id,
    checkInTime: new Date(),
  });

  emitToEventRoom(ticket.event._id.toString(), 'attendance:checkedIn', {
    eventId: ticket.event._id,
    ticketId: ticket.ticketId,
  });

  sendSuccess(res, 200, 'Attendance marked successfully', { ticket, attendance });
});

// @desc    Get attendance logs for an event
// @route   GET /api/attendance
const getAttendance = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const query = eventId ? { event: eventId } : {};

  const logs = await Attendance.find(query)
    .populate('user', 'name email')
    .populate('ticket', 'ticketId tierName')
    .populate('event', 'title')
    .sort('-checkInTime');

  sendSuccess(res, 200, 'Attendance logs fetched', logs);
});

module.exports = { scanTicket, getAttendance };
