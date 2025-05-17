const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const nodemailer = require('nodemailer');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Use environment variable or default
    pass: process.env.EMAIL_PASSWORD || 'your-email-password' // Use environment variable or default
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Store OTPs and verification tokens temporarily (in production, use a database or Redis)
const otpStore = new Map();
const verificationTokens = new Map();

// Register a new user
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      passwordHash: password, // Will be hashed by pre-save hook
    });

    await user.save();

    // Create user profile
    const profile = new Profile({
      userId: user._id,
      name
    });

    await profile.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Store token with expiry time (24 hours)
    verificationTokens.set(user._id.toString(), {
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Email Verification - NiveshPath',
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering with NiveshPath. Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">Verify Email Address</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    };

    // In development, log the verification URL
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Verification URL for ${email} is ${verificationUrl}`);
    }

    // Send email (don't wait for it to complete)
    transporter.sendMail(mailOptions).catch(err => {
      console.error('Error sending verification email:', err);
    });

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      devVerificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined // Only in development mode
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please verify your email before logging in.',
        isEmailVerified: false,
        email: user.email
      });
    }

    // Get user profile
    const profile = await Profile.findOne({ userId: user._id });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        name: profile ? profile.name : ''
      }
    });
  
  } catch (error) {
    next(error);  
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user profile
    const profile = await Profile.findOne({ userId: user._id });

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        name: profile ? profile.name : ''
      }
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password - send OTP to email
exports.forgotPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiry time (15 minutes)
    otpStore.set(email, {
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    });

    // Send OTP to user's email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset OTP - NiveshPath',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password for your NiveshPath account.</p>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    // In development, log the OTP but also send email
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: OTP for ${email} is ${otp}`);
    }

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ 
        message: 'OTP sent to your email successfully',
        devOtp: process.env.NODE_ENV === 'development' ? otp : undefined // Only in development mode
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    // Response is already sent in the try-catch block above
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Check if OTP exists for this email
    const otpData = otpStore.get(email);
    if (!otpData) {
      return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpData.expiresAt)) {
      otpStore.delete(email); // Clean up expired OTP
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid - don't delete it yet as it will be needed for reset password
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    // Check if OTP exists and is valid for this email
    const otpData = otpStore.get(email);
    if (!otpData || otpData.otp !== otp || new Date() > new Date(otpData.expiresAt)) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    // Delete OTP after successful password reset
    otpStore.delete(email);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

// Send email verification link
exports.sendVerificationEmail = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Store token with expiry time (24 hours)
    verificationTokens.set(user._id.toString(), {
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Email Verification - NiveshPath',
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering with NiveshPath. Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">Verify Email Address</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    };

    // In development, log the verification URL
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Verification URL for ${email} is ${verificationUrl}`);
    }

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ 
        message: 'Verification email sent successfully',
        devVerificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined // Only in development mode
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
  } catch (error) {
    console.error('Send verification email error:', error);
    next(error);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const userId = decoded.userId;
    
    // Check if token exists for this user
    const tokenData = verificationTokens.get(userId);
    if (!tokenData || tokenData.token !== token) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    // Check if token is expired
    if (new Date() > new Date(tokenData.expiresAt)) {
      verificationTokens.delete(userId); // Clean up expired token
      return res.status(400).json({ message: 'Verification token expired. Please request a new one.' });
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's email verification status
    user.isEmailVerified = true;
    await user.save();

    // Delete token after successful verification
    verificationTokens.delete(userId);

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    next(error);
  }
};

// Change password for logged in user
exports.changePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
};