const Event = require('../models/Event');
const User = require('../models/User');
const Category = require('../models/Category');
const Ticket = require('../models/Ticket');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Global search across events, users, organizers, categories, tickets
// @route   GET /api/search?q=
const globalSearch = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  if (!q.trim()) return sendSuccess(res, 200, 'Empty query', { events: [], organizers: [], categories: [], tickets: [] });

  const regex = new RegExp(q, 'i');

  const [events, organizers, categories, tickets] = await Promise.all([
    Event.find({ $or: [{ title: regex }, { tags: regex }] }).limit(10).select('title slug banner status'),
    User.find({ role: 'organizer', name: regex }).limit(10).select('name avatar'),
    Category.find({ name: regex }).limit(10),
    req.user && req.user.role !== 'participant' ? Ticket.find({ ticketId: regex }).limit(10) : Promise.resolve([]),
  ]);

  sendSuccess(res, 200, 'Search results fetched', { events, organizers, categories, tickets });
});

module.exports = { globalSearch };
