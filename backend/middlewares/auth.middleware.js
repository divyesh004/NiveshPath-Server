const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware to authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'Authentication required. No token provided.' 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'Authentication required. Token missing.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId || decoded.id);
    if (!user) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'The user belonging to this token no longer exists. Please log in again.' 
      });
    }
    
    // Add user info to request object
    req.user = {
      userId: user._id,
      role: user.role,
      ...user._doc
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

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      status: 'fail',
      message: 'Access denied. Admin privileges required.' 
    });
  }
};