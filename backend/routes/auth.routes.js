const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Register a new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required')
  ],
  authController.register
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Forgot password - send OTP
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email')
  ],
  authController.forgotPassword
);

// Verify OTP
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  authController.verifyOTP
);

// Reset password
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  authController.resetPassword
);

// Send email verification link
router.post(
  '/send-verification-email',
  [
    body('email').isEmail().withMessage('Please provide a valid email')
  ],
  authController.sendVerificationEmail
);

// Verify email
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required')
  ],
  authController.verifyEmail
);

// Change password (requires authentication)
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  authController.changePassword
);

module.exports = router;