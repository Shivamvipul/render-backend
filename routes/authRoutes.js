const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');

router.post('/register', authLimiter, registerValidator, validate, ctrl.register);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/login', authLimiter, loginValidator, validate, ctrl.login);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', protect, ctrl.logout);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, ctrl.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, ctrl.resetPassword);
router.get('/me', protect, ctrl.getMe);

module.exports = router;
