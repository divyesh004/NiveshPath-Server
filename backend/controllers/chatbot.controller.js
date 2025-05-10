const axios = require('axios');
const { validationResult } = require('express-validator');
const ChatbotSession = require('../models/chatbotSession.model');
const Profile = require('../models/profile.model');
const mongoose = require('mongoose');

// Helper function to check profile completeness
const checkProfileCompleteness = (profile) => {
  if (!profile) return { complete: false, missingFields: ['profile'] };
  
  const missingFields = [];
  
  // Check essential fields
  if (!profile.name) missingFields.push('name');
  if (!profile.age) missingFields.push('age');
  if (!profile.income) missingFields.push('income');
  if (!profile.goals || profile.goals.length === 0) missingFields.push('financialGoals');
  
  // Check onboarding data
  if (!profile.onboardingData || !profile.onboardingData.demographic) {
    missingFields.push('demographicInfo');
  } else {
    const { demographic } = profile.onboardingData;
    if (!demographic.location) missingFields.push('location');
    if (!demographic.occupation) missingFields.push('occupation');
  }
  
  if (!profile.onboardingData || !profile.onboardingData.psychological) {
    missingFields.push('psychologicalProfile');
  }
  
  return {
    complete: missingFields.length === 0,
    missingFields,
    completionPercentage: profile ? Math.round(100 - (missingFields.length / 8) * 100) : 0
  };
};

// Submit a query to the AI chatbot
exports.submitQuery = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { query, conversationId } = req.body;
    
    // Get user profile for context
    const userProfile = await Profile.findOne({ userId: req.user.userId });
    
    // Check profile completeness
    const profileStatus = checkProfileCompleteness(userProfile);
    
    // If profile is incomplete and query is not about completing profile, suggest completing profile
    if (!profileStatus.complete && !query.toLowerCase().includes('profile')) {
      // Prepare a response encouraging user to complete their profile
      const incompleteProfileResponse = {
        text: `आपकी प्रोफाइल अभी अधूरी है (${profileStatus.completionPercentage}% पूर्ण)। बेहतर वित्तीय सलाह के लिए, कृपया अपनी प्रोफाइल में निम्नलिखित जानकारी जोड़ें: ${profileStatus.missingFields.join(', ')}। क्या आप अभी अपनी प्रोफाइल अपडेट करना चाहेंगे?`,
        profileStatus
      };
      
      // Save the chat session
      const chatSession = new ChatbotSession({
        userId: req.user.userId,
        query,
        response: incompleteProfileResponse.text,
        context: { profileStatus },
        conversationId: conversationId || new mongoose.Types.ObjectId()
      });
      
      await chatSession.save();
      
      return res.status(200).json({
        response: incompleteProfileResponse.text,
        sessionId: chatSession._id,
        conversationId: chatSession.conversationId,
        profileStatus
      });
    }
    
    // Prepare context for the AI with personalized information
    const context = {
      userId: req.user.userId,
      userProfile: userProfile || {},
      timestamp: new Date().toISOString(),
      profileStatus,
      // Add personalized context based on user profile
      personalization: {
        riskProfile: userProfile?.riskAppetite || 'medium',
        financialGoals: userProfile?.goals || [],
        demographicInfo: userProfile?.onboardingData?.demographic || {},
        psychologicalProfile: userProfile?.onboardingData?.psychological || {}
      }
    };
    
    // Get conversation history if conversationId is provided
    let previousMessages = [];
    if (conversationId) {
      const previousSessions = await ChatbotSession.find({
        userId: req.user.userId,
        conversationId
      }).sort({ timestamp: 1 }).limit(5);
      
      if (previousSessions.length > 0) {
        previousMessages = previousSessions.map(session => ([
          { role: 'user', content: session.query },
          { role: 'assistant', content: session.response }
        ])).flat();
      }
    }
    
    // Call Mistral AI API with conversation history
    const response = await callMistralAPI(query, context, previousMessages);
    
    // Save the chat session
    const chatSession = new ChatbotSession({
      userId: req.user.userId,
      query,
      response: response.text,
      context,
      conversationId: conversationId || new mongoose.Types.ObjectId() // Create new conversation ID if not provided
    });
    
    await chatSession.save();
    
    res.status(200).json({
      response: response.text,
      sessionId: chatSession._id,
      conversationId: chatSession.conversationId
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    next(error);
  }
};

// Get user's chat history
exports.getChatHistory = async (req, res, next) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    
    const chatHistory = await ChatbotSession.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await ChatbotSession.countDocuments({ userId: req.user.userId });
    
    res.status(200).json({
      chatHistory,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Submit feedback for a chat session
exports.submitFeedback = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { helpful, comments, rating } = req.body;
    
    // We can use the session from middleware if available
    const chatSession = req.chatSession || await ChatbotSession.findOne({
      _id: sessionId,
      userId: req.user.userId
    });
    
    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    
    // Update feedback with more detailed information
    chatSession.feedback = {
      helpful,
      comments,
      rating: rating || undefined,  // Only add if provided
      submittedAt: new Date()
    };
    
    await chatSession.save();
    
    // Log feedback for analysis (could be expanded to a dedicated analytics service)
    console.log(`Feedback received for session ${sessionId}: helpful=${helpful}, rating=${rating || 'N/A'}`);
    
    res.status(200).json({
      message: 'Feedback submitted successfully',
      sessionId,
      feedback: chatSession.feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    next(error);
  }
};

// Get a specific chat session
exports.getChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }
    
    const chatSession = await ChatbotSession.findOne({
      _id: sessionId,
      userId: req.user.userId
    });
    
    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    
    res.status(200).json({ chatSession });
  } catch (error) {
    next(error);
  }
};

// Delete a chat session
exports.deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }
    
    const chatSession = await ChatbotSession.findOne({
      _id: sessionId,
      userId: req.user.userId
    });
    
    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    
    await chatSession.deleteOne();
    
    res.status(200).json({
      message: 'Chat session deleted successfully',
      sessionId
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to call Mistral AI API
async function callMistralAPI(query, context, previousMessages = []) {
  try {
    // Create a personalized system prompt based on user profile
    let systemPrompt = 'You are a financial advisor assistant for NiveshPath, a personal finance education platform for Indian users. ';
    
    // Add profile completeness information to the prompt
    if (context.profileStatus && !context.profileStatus.complete) {
      systemPrompt += `The user's profile is incomplete (${context.profileStatus.completionPercentage}% complete). They are missing: ${context.profileStatus.missingFields.join(', ')}. Encourage them to complete their profile for better personalized advice. `;
    }
    
    // Add personalization based on user profile if available
    if (context.personalization) {
      const { riskProfile, financialGoals } = context.personalization;
      
      // Add risk profile context
      if (riskProfile) {
        systemPrompt += `The user has a ${riskProfile} risk appetite. `;
      }
      
      // Add financial goals context
      if (financialGoals && financialGoals.length > 0) {
        systemPrompt += `Their financial goals include: ${financialGoals.join(', ')}. `;
      }
      
      // Add demographic information if available
      const { demographicInfo } = context.personalization;
      if (demographicInfo && demographicInfo.location) {
        systemPrompt += `The user is from ${demographicInfo.location}. `;
      }
    }
    
    // Complete the system prompt
    systemPrompt += 'Provide helpful, accurate information about personal finance topics, especially in the Indian context.';
    
    // Prepare messages array with system prompt
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];
    
    // Add previous conversation messages if available
    if (previousMessages.length > 0) {
      messages.push(...previousMessages);
    }
    
    // Add the current query with profile completion context if needed
    let userQuery = query;
    
    // If query is about profile completion, add specific instructions to the AI
    if (query.toLowerCase().includes('profile') && context.profileStatus && !context.profileStatus.complete) {
      userQuery = `${query} (Note: User is asking about profile completion. Their profile is ${context.profileStatus.completionPercentage}% complete, missing: ${context.profileStatus.missingFields.join(', ')}. Please guide them on how to complete these specific fields.)`;
    }
    
    messages.push({
      role: 'user',
      content: userQuery
    });
    
    // Make API request
    const response = await axios.post(
      `${process.env.MISTRAL_API_URL}/chat/completions`,
      {
        model: 'mistral-medium',  // or whichever model is appropriate
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,  // Increased token limit for more comprehensive responses
        // Removed context as it's not a standard parameter for Mistral API
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Add error handling for API response
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      console.error('Invalid response from Mistral API:', response.data);
      throw new Error('Received invalid response from AI service');
    }
    
    return {
      text: response.data.choices[0].message.content,
      raw: response.data
    };
  } catch (error) {
    // Enhanced error logging with more details
    console.error('Mistral API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // Throw a more descriptive error
    if (error.response?.status) {
      throw new Error(`Failed to get response from AI service: ${error.response.status} ${error.response.statusText}`);
    } else {
      throw new Error(`Failed to get response from AI service: ${error.message}`);
    }
  }
}