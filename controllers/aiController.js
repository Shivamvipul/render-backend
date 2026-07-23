const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const aiService = require('../services/aiService');

// @desc    Get personalized event recommendations for the logged-in user
// @route   GET /api/ai/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const allEvents = await Event.find({ status: 'published' }).populate('category', 'name');
  const recommended = await aiService.recommendEvents(req.user, allEvents);
  sendSuccess(res, 200, 'Recommendations generated', recommended);
});

// @desc    Generate an AI event description draft from a title/category/tags
// @route   POST /api/ai/generate-description
const generateDescription = asyncHandler(async (req, res) => {
  const description = await aiService.generateEventDescription(req.body);
  sendSuccess(res, 200, 'Description generated', { description });
});

// @desc    Chatbot endpoint
// @route   POST /api/ai/chat
const chat = asyncHandler(async (req, res) => {
  const reply = await aiService.chatbotReply(req.body.message || '');
  sendSuccess(res, 200, 'Chat reply generated', { reply });
});

// @desc    Predict attendance for an event
// @route   GET /api/ai/predict-attendance/:eventId
const predictAttendance = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  const prediction = await aiService.predictAttendance(event);
  sendSuccess(res, 200, 'Attendance prediction generated', prediction);
});

// @desc    Predict ticket demand for an event
// @route   GET /api/ai/predict-demand/:eventId
const predictDemand = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  const prediction = await aiService.predictTicketDemand(event);
  sendSuccess(res, 200, 'Ticket demand prediction generated', prediction);
});

module.exports = { getRecommendations, generateDescription, chat, predictAttendance, predictDemand };
