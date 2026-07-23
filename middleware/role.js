const { ApiError } = require('../utils/apiResponse');

// Usage: authorize('super_admin', 'organizer')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, `Role '${req.user ? req.user.role : 'guest'}' is not permitted to access this resource`);
  }
  next();
};

module.exports = { authorize };
