const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { generateTicketPDF } = require('../services/pdfService');

// @desc    Get tickets for logged-in user
// @route   GET /api/tickets/mine
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id })
    .populate('event', 'title banner venue startDate endDate')
    .sort('-createdAt');
  sendSuccess(res, 200, 'Tickets fetched', tickets);
});

// @desc    Get single ticket
// @route   GET /api/tickets/:id
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('event', 'title venue startDate').populate('user', 'name email');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (ticket.user._id.toString() !== req.user._id.toString() && req.user.role === 'participant') {
    throw new ApiError(403, 'Not authorized to view this ticket');
  }
  sendSuccess(res, 200, 'Ticket fetched', ticket);
});

// @desc    Download ticket as PDF (generates on first request, then reuses the file)
// @route   GET /api/tickets/:id/pdf
const downloadTicketPDF = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('event', 'title venue startDate').populate('user', 'name');
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  if (!ticket.pdfUrl) {
    const pdfUrl = await generateTicketPDF({
      ticketId: ticket.ticketId,
      eventTitle: ticket.event.title,
      userName: ticket.user.name,
      tierName: ticket.tierName,
      venue: ticket.event.venue,
      startDate: ticket.event.startDate,
      qrCodeDataUrl: ticket.qrCodeImage,
    });
    ticket.pdfUrl = pdfUrl;
    await ticket.save();
  }

  sendSuccess(res, 200, 'Ticket PDF ready', { pdfUrl: ticket.pdfUrl });
});

module.exports = { getMyTickets, getTicketById, downloadTicketPDF };
