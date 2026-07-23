const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/apiResponse');

// Runs after express-validator chains; throws ApiError with collected messages
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      400,
      'Validation failed',
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

module.exports = validate;
