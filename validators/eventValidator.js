const { body } = require('express-validator');

const createEventValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isMongoId().withMessage('Valid category id is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('ticketTiers').isArray({ min: 1 }).withMessage('At least one ticket tier is required'),
];

module.exports = { createEventValidator };
