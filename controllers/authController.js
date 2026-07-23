const crypto = require('crypto');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, generateRandomToken } = require('../utils/generateToken');
const { sendEmail, templates } = require('../services/emailService');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// @desc    Register new user
// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const emailVerificationToken = generateRandomToken();
  const user = await User.create({
    name,
    email,
    password,
    role: role === 'organizer' ? 'organizer' : 'participant',
    emailVerificationToken,
    emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
    isOrganizerApproved: role === 'organizer' ? false : true,
  });

  const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;
  await sendEmail({ to: user.email, subject: 'Verify your email', html: templates.verifyEmail(user.name, verifyLink) });

  await ActivityLog.create({ user: user._id, activity: 'REGISTER', metadata: { role: user.role } });

  sendSuccess(res, 201, 'Registration successful. Please check your email to verify your account.', {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpire: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpire');

  if (!user) throw new ApiError(400, 'Verification link is invalid or has expired');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  sendSuccess(res, 200, 'Email verified successfully');
});

// @desc    Login
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  await ActivityLog.create({ user: user._id, activity: 'LOGIN' });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, 200, 'Login successful', {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isOrganizerApproved: user.isOrganizerApproved,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token missing');

  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Refresh token invalid or expired');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) throw new ApiError(401, 'Refresh token invalid');

  const accessToken = generateAccessToken(user._id, user.role);
  sendSuccess(res, 200, 'Token refreshed', { accessToken });
});

// @desc    Logout
// @route   POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshToken = undefined;
    await req.user.save();
  }
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, 200, 'Logged out successfully');
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always respond the same way to avoid leaking which emails are registered
  if (!user) return sendSuccess(res, 200, 'If that email exists, a reset link has been sent');

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpire = Date.now() + 30 * 60 * 1000;
  await user.save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendEmail({ to: user.email, subject: 'Password Reset Request', html: templates.resetPassword(user.name, resetLink) });

  sendSuccess(res, 200, 'If that email exists, a reset link has been sent');
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpire: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpire');

  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  sendSuccess(res, 200, 'Password reset successful. Please log in with your new password.');
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Current user fetched', req.user);
});

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
