const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiResponse');
const User = require('../models/User');

// Verifies the JWT access token and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User no longer exists or is inactive');
    }
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Not authorized, token invalid or expired');
  }
});

module.exports = { protect };
