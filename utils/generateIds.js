const { v4: uuidv4 } = require('uuid');

const generateBookingNumber = () => `BK-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;

const generateTicketId = () => `TKT-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 8).toUpperCase()}`;

module.exports = { generateBookingNumber, generateTicketId };
