const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Builds the base event filter: super_admin sees everything, organizer only sees their own events
const scopedEventIds = async (req) => {
  if (req.user.role === 'super_admin') return null; // null = no restriction
  const events = await Event.find({ organizer: req.user._id }).select('_id');
  return events.map((e) => e._id);
};

// @desc    Registration trends — bookings created over time (daily/weekly/monthly buckets)
// @route   GET /api/analytics/registration-trends?granularity=day|week|month&eventId=&from=&to=
const getRegistrationTrends = asyncHandler(async (req, res) => {
  const { granularity = 'day', eventId, from, to } = req.query;
  const eventIds = await scopedEventIds(req);

  const match = { status: { $ne: 'cancelled' } };
  if (eventId) match.event = new mongoose.Types.ObjectId(eventId);
  else if (eventIds) match.event = { $in: eventIds };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const dateFormat = { day: '%Y-%m-%d', week: '%G-W%V', month: '%Y-%m' }[granularity] || '%Y-%m-%d';

  const trends = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        registrations: { $sum: '$quantity' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, period: '$_id', registrations: 1, bookings: 1 } },
  ]);

  sendSuccess(res, 200, 'Registration trends fetched', { granularity, trends });
});

// @desc    Attendance ratio — checked-in attendees vs confirmed registrations, per event and overall
// @route   GET /api/analytics/attendance-ratio?eventId=
const getAttendanceRatio = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const eventIds = await scopedEventIds(req);

  const bookingMatch = { status: 'confirmed' };
  if (eventId) bookingMatch.event = new mongoose.Types.ObjectId(eventId);
  else if (eventIds) bookingMatch.event = { $in: eventIds };

  const registeredAgg = await Booking.aggregate([
    { $match: bookingMatch },
    { $group: { _id: '$event', registered: { $sum: '$quantity' } } },
  ]);

  const attendanceMatch = {};
  if (eventId) attendanceMatch.event = new mongoose.Types.ObjectId(eventId);
  else if (eventIds) attendanceMatch.event = { $in: eventIds };

  const attendedAgg = await Attendance.aggregate([
    { $match: attendanceMatch },
    { $group: { _id: '$event', attended: { $sum: 1 } } },
  ]);
  const attendedMap = new Map(attendedAgg.map((a) => [a._id.toString(), a.attended]));

  const eventDocs = await Event.find({ _id: { $in: registeredAgg.map((r) => r._id) } }).select('title');
  const titleMap = new Map(eventDocs.map((e) => [e._id.toString(), e.title]));

  let totalRegistered = 0;
  let totalAttended = 0;
  const perEvent = registeredAgg.map((r) => {
    const attended = attendedMap.get(r._id.toString()) || 0;
    totalRegistered += r.registered;
    totalAttended += attended;
    return {
      eventId: r._id,
      eventTitle: titleMap.get(r._id.toString()) || 'N/A',
      registered: r.registered,
      attended,
      attendanceRatio: r.registered > 0 ? +((attended / r.registered) * 100).toFixed(1) : 0,
    };
  });

  sendSuccess(res, 200, 'Attendance ratio fetched', {
    overall: {
      registered: totalRegistered,
      attended: totalAttended,
      attendanceRatio: totalRegistered > 0 ? +((totalAttended / totalRegistered) * 100).toFixed(1) : 0,
    },
    perEvent: perEvent.sort((a, b) => b.attendanceRatio - a.attendanceRatio),
  });
});

// @desc    Popular event categories — ranked by number of registrations (and event count)
// @route   GET /api/analytics/popular-categories
const getPopularCategories = asyncHandler(async (req, res) => {
  const eventIds = await scopedEventIds(req);
  const eventMatch = eventIds ? { _id: { $in: eventIds } } : {};

  const results = await Event.aggregate([
    { $match: eventMatch },
    {
      $lookup: {
        from: 'bookings',
        let: { eventId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$event', '$$eventId'] }, { $ne: ['$status', 'cancelled'] }] } } },
        ],
        as: 'bookings',
      },
    },
    {
      $project: {
        category: 1,
        registrations: { $sum: '$bookings.quantity' },
      },
    },
    {
      $group: {
        _id: '$category',
        totalEvents: { $sum: 1 },
        totalRegistrations: { $sum: '$registrations' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
        totalEvents: 1,
        totalRegistrations: 1,
      },
    },
    { $sort: { totalRegistrations: -1 } },
  ]);

  sendSuccess(res, 200, 'Popular event categories fetched', results);
});

// @desc    Peak registration timings — busiest hour-of-day and day-of-week for bookings
// @route   GET /api/analytics/peak-registration-timings?eventId=
const getPeakRegistrationTimings = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const eventIds = await scopedEventIds(req);

  const match = { status: { $ne: 'cancelled' } };
  if (eventId) match.event = new mongoose.Types.ObjectId(eventId);
  else if (eventIds) match.event = { $in: eventIds };

  const [byHour, byDayOfWeek] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      { $group: { _id: { $hour: '$createdAt' }, registrations: { $sum: '$quantity' }, bookings: { $sum: 1 } } },
      { $project: { _id: 0, hour: '$_id', registrations: 1, bookings: 1 } },
      { $sort: { hour: 1 } },
    ]),
    Booking.aggregate([
      { $match: match },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, registrations: { $sum: '$quantity' }, bookings: { $sum: 1 } } },
      { $project: { _id: 0, dayOfWeek: '$_id', registrations: 1, bookings: 1 } },
      { $sort: { dayOfWeek: 1 } },
    ]),
  ]);

  const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const byDayOfWeekNamed = byDayOfWeek.map((d) => ({ ...d, dayName: dayNames[d.dayOfWeek] }));

  const peakHour = byHour.reduce((max, cur) => (cur.registrations > (max?.registrations || 0) ? cur : max), null);
  const peakDay = byDayOfWeekNamed.reduce((max, cur) => (cur.registrations > (max?.registrations || 0) ? cur : max), null);

  sendSuccess(res, 200, 'Peak registration timings fetched', {
    byHour,
    byDayOfWeek: byDayOfWeekNamed,
    peakHour,
    peakDay,
  });
});

module.exports = {
  getRegistrationTrends,
  getAttendanceRatio,
  getPopularCategories,
  getPeakRegistrationTimings,
};
