const rateLimit = require('express-rate-limit');

// Rate limiting middleware for chatbot queries
exports.chatbotRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests, please try again after some time.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Store to track request counts - defaults to memory, but can be replaced with Redis or other stores
  // store: ...
});

// Middleware to validate chat session ownership
exports.validateSessionOwnership = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // If no sessionId is provided, skip this middleware
    if (!sessionId) {
      return next();
    }
    
    // Check if the session belongs to the authenticated user
    const ChatbotSession = require('../models/chatbotSession.model');
    const session = await ChatbotSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    
    // Verify ownership
    if (session.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to access this chat session' });
    }
    
    // Attach the session to the request object for later use
    req.chatSession = session;
    next();
  } catch (error) {
    next(error);
  }
};