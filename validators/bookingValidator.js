const { body } = require('express-validator');

const createBookingValidator = [
  body('eventId').isMongoId().withMessage('Valid event id is required'),
  body('tierName').notEmpty().withMessage('Ticket tier name is required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
];

module.exports = { createBookingValidator };
