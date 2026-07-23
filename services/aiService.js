/**
 * AI Service
 * ----------
 * This module centralizes all AI-backed features. In this scaffold, each function
 * returns a structured, deterministic mock response so the rest of the app (routes,
 * controllers, frontend) has a real contract to build against.
 *
 * To go live: plug your provider's SDK/API call in the marked TODO spots
 * (e.g. Anthropic Claude API via fetch to https://api.anthropic.com/v1/messages,
 * or OpenAI, etc.) using AI_API_KEY from .env.
 */

const recommendEvents = async (user, allEvents) => {
  // TODO: replace with real embedding/collaborative-filtering or LLM-based ranking call
  // Naive mock: recommend published events matching user's wishlist categories, or most viewed
  const scored = allEvents
    .filter((e) => e.status === 'published')
    .map((e) => ({ event: e, score: e.views || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => s.event);
  return scored;
};

const generateEventDescription = async ({ title, category, tags = [] }) => {
  // TODO: replace with a real LLM completion call
  return (
    `Join us for ${title}, a can't-miss ${category} experience. ` +
    `Featuring ${tags.length ? tags.join(', ') : 'engaging sessions'}, this event brings together ` +
    `a community of enthusiasts for networking, learning, and fun. Reserve your spot today!`
  );
};

const chatbotReply = async (message) => {
  // TODO: replace with a real LLM call using conversation context
  const lower = message.toLowerCase();
  if (lower.includes('refund')) return 'Refunds can be requested from My Tickets > Booking Details within 48 hours of purchase.';
  if (lower.includes('ticket')) return 'You can browse and book tickets from the Events page. Your tickets appear under My Tickets with a QR code.';
  return "I'm the event assistant. Ask me about bookings, tickets, refunds, or event details!";
};

const predictAttendance = async (event) => {
  // TODO: replace with a trained model. Mock heuristic based on historical booking ratio.
  const bookedRatio = event.capacity ? (event.capacity - event.availableSeats) / event.capacity : 0;
  const predictedAttendanceRate = Math.min(0.95, 0.6 + bookedRatio * 0.3);
  return {
    predictedAttendees: Math.round((event.capacity - event.availableSeats) * predictedAttendanceRate),
    confidence: 0.62,
  };
};

const predictTicketDemand = async (event) => {
  // TODO: replace with real time-series forecasting
  const daysToEvent = Math.max(1, Math.ceil((new Date(event.startDate) - new Date()) / 86400000));
  const remaining = event.availableSeats;
  const projectedSellThroughDays = Math.round(remaining / Math.max(1, remaining / daysToEvent));
  return { projectedSellThroughDays, riskOfSellingOut: remaining < event.capacity * 0.15 };
};

const analyzeSentiment = async (text) => {
  // TODO: replace with real NLP sentiment model
  const positiveWords = ['great', 'amazing', 'love', 'excellent', 'good', 'awesome'];
  const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'hate', 'disappointing'];
  const lower = text.toLowerCase();
  const posHits = positiveWords.filter((w) => lower.includes(w)).length;
  const negHits = negativeWords.filter((w) => lower.includes(w)).length;
  if (posHits > negHits) return 'positive';
  if (negHits > posHits) return 'negative';
  return 'neutral';
};

const detectSpam = async (text) => {
  // TODO: replace with a real spam classifier
  const spamSignals = ['http://', 'https://', 'buy now', 'click here', 'free money'];
  return spamSignals.some((s) => text.toLowerCase().includes(s));
};

const detectDuplicateRegistration = async (Booking, { userId, eventId }) => {
  const existing = await Booking.findOne({ user: userId, event: eventId, status: { $ne: 'cancelled' } });
  return !!existing;
};

module.exports = {
  recommendEvents,
  generateEventDescription,
  chatbotReply,
  predictAttendance,
  predictTicketDemand,
  analyzeSentiment,
  detectSpam,
  detectDuplicateRegistration,
};
