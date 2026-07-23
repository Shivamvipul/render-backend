const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

const generateRandomToken = () => require('crypto').randomBytes(32).toString('hex');

module.exports = { generateAccessToken, generateRefreshToken, generateRandomToken };
