const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model');

/**
 * Authentication middleware to protect routes
 * Verifies the JWT token from the request headers
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. No token provided.'
      });
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id || decoded.userId);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists. Please log in again.'
      });
    }

    // Note: The current user model doesn't track password changes
    // If password change tracking is needed, add a passwordChangedAt field to the user model

    // Grant access to protected route
    req.user = {
      userId: currentUser._id,
      role: currentUser.role,
      ...currentUser._doc
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token expired. Please log in again.'
      });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token not active. Please try again later.'
      });
    }
    return res.status(401).json({
      status: 'fail',
      message: 'Authentication failed. Please log in again.'
    });
  }
};

/**
 * Middleware to restrict access to certain roles
 * @param  {...String} roles - Roles allowed to access the route
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
