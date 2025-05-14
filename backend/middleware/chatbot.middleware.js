// Middleware to enhance chatbot queries with context
exports.enhanceQueryWithContext = async (req, res, next) => {
  try {
    // Get the query from request body
    const { query, conversationId } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'प्रश्न आवश्यक है' });
    }
    
    // Analyze query intent
    const queryIntent = analyzeQueryIntent(query);
    
    // Attach query metadata to request
    req.queryMetadata = {
      intent: queryIntent,
      timestamp: new Date(),
      isFollowUp: conversationId ? true : false
    };
    
    // If this is a follow-up question, get previous conversation context
    if (conversationId) {
      const ChatbotSession = require('../models/chatbotSession.model');
      const previousSessions = await ChatbotSession.find({ 
        conversationId, 
        userId: req.user.userId 
      }).sort({ timestamp: -1 }).limit(5);
      
      if (previousSessions && previousSessions.length > 0) {
        // Add previous conversation context
        req.queryMetadata.previousContext = previousSessions.map(session => ({
          query: session.query,
          response: session.response,
          timestamp: session.timestamp
        }));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Helper function to analyze query intent
function analyzeQueryIntent(query) {
  const lowerQuery = query.toLowerCase();
  
  // Define intent categories
  const intents = {
    investment: ['invest', 'stock', 'share', 'mutual fund', 'sip', 'portfolio', 'returns', 'dividend', 'निवेश', 'शेयर', 'म्यूचुअल फंड'],
    tax: ['tax', 'taxation', 'income tax', 'tax saving', 'टैक्स', 'कर', 'आयकर'],
    insurance: ['insurance', 'policy', 'premium', 'cover', 'बीमा', 'पॉलिसी', 'प्रीमियम'],
    retirement: ['retirement', 'pension', 'senior citizen', 'retire', 'रिटायरमेंट', 'पेंशन'],
    loan: ['loan', 'emi', 'interest', 'borrow', 'कर्ज', 'ऋण', 'ब्याज', 'ईएमआई'],
    profile: ['profile', 'my details', 'my information', 'प्रोफाइल', 'मेरी जानकारी']
  };
  
  // Check which intent matches the query
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return intent;
    }
  }
  
  // Default intent if no match found
  return 'general';
};

// Rate limiting middleware removed
exports.chatbotRateLimit = (req, res, next) => {
  // Simple pass-through middleware (rate limiting removed)
  next();
};

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