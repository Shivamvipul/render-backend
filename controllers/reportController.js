const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { generateReport } = require('../services/reportService');

// @desc    Generate a report (revenue | attendance | booking | feedback | popular_events)
// @route   GET /api/reports?type=revenue&format=pdf
const getReport = asyncHandler(async (req, res) => {
  const { type, format = 'pdf', eventId } = req.query;
  let columns = [];
  let rows = [];
  let title = '';

  const eventFilter = eventId ? { event: eventId } : {};

  switch (type) {
    case 'revenue': {
      title = 'Revenue Report';
      columns = ['Event', 'Amount', 'Status', 'Date'];
      const payments = await Payment.find({ ...eventFilter, status: 'success' }).populate('event', 'title');
      rows = payments.map((p) => [p.event?.title || 'N/A', p.amount, p.status, p.createdAt.toISOString().slice(0, 10)]);
      break;
    }
    case 'attendance': {
      title = 'Attendance Report';
      columns = ['Event', 'Attendee', 'Check-in Time'];
      const logs = await Attendance.find(eventFilter).populate('user', 'name').populate('event', 'title');
      rows = logs.map((l) => [l.event?.title || 'N/A', l.user?.name || 'N/A', l.checkInTime.toISOString()]);
      break;
    }
    case 'booking': {
      title = 'Booking Report';
      columns = ['Booking #', 'Event', 'Quantity', 'Amount', 'Status'];
      const bookings = await Booking.find(eventFilter).populate('event', 'title');
      rows = bookings.map((b) => [b.bookingNumber, b.event?.title || 'N/A', b.quantity, b.totalAmount, b.status]);
      break;
    }
    case 'feedback': {
      title = 'Feedback Report';
      columns = ['Event', 'User', 'Rating', 'Sentiment', 'Comment'];
      const feedbacks = await Feedback.find(eventFilter).populate('user', 'name').populate('event', 'title');
      rows = feedbacks.map((f) => [f.event?.title || 'N/A', f.user?.name || 'N/A', f.rating, f.sentiment || 'n/a', (f.comment || '').slice(0, 60)]);
      break;
    }
    case 'popular_events': {
      title = 'Popular Events Report';
      columns = ['Event', 'Views', 'Avg Rating', 'Seats Sold'];
      const events = await Event.find({}).sort('-views').limit(50);
      rows = events.map((e) => [e.title, e.views, e.avgRating, e.capacity - e.availableSeats]);
      break;
    }
    default:
      throw new ApiError(400, 'Unknown report type');
  }

  const fileUrl = await generateReport({ type, format, columns, rows, title });

  await Report.create({ type, format, generatedBy: req.user._id, filters: req.query, fileUrl });

  sendSuccess(res, 200, 'Report generated', { fileUrl, rowCount: rows.length });
});

module.exports = { getReport };
