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
    
    // Check if query is about future planning or investment recommendations
    const isFuturePlanQuery = query.toLowerCase().includes('future') || 
                             query.toLowerCase().includes('plan') || 
                             query.toLowerCase().includes('advice') || 
                             query.toLowerCase().includes('suggest') || 
                             query.toLowerCase().includes('recommendation') ||
                             query.toLowerCase().includes('भविष्य') ||
                             query.toLowerCase().includes('योजना') ||
                             query.toLowerCase().includes('सलाह') ||
                             query.toLowerCase().includes('सुझाव');
    
    // Check if query is specifically about investment options
    const isInvestmentQuery = query.toLowerCase().includes('invest') ||
                             query.toLowerCase().includes('stock') ||
                             query.toLowerCase().includes('sip') ||
                             query.toLowerCase().includes('mutual fund') ||
                             query.toLowerCase().includes('equity') ||
                             query.toLowerCase().includes('bond') ||
                             query.toLowerCase().includes('निवेश') ||
                             query.toLowerCase().includes('स्टॉक') ||
                             query.toLowerCase().includes('शेयर') ||
                             query.toLowerCase().includes('म्यूचुअल फंड') ||
                             query.toLowerCase().includes('इक्विटी');
    
    // Check if query is specifically about SIP vs lump sum
    const isSipVsLumpSumQuery = query.toLowerCase().includes('sip vs') ||
                               query.toLowerCase().includes('sip or lump') ||
                               query.toLowerCase().includes('lump sum') ||
                               query.toLowerCase().includes('monthly invest') ||
                               query.toLowerCase().includes('एसआईपी') ||
                               query.toLowerCase().includes('मासिक निवेश') ||
                               query.toLowerCase().includes('एकमुश्त निवेश');
    
    // Check if query is specifically about stocks vs mutual funds
    const isStockVsMutualFundQuery = query.toLowerCase().includes('stock vs') ||
                                    query.toLowerCase().includes('stock or mutual') ||
                                    query.toLowerCase().includes('direct equity') ||
                                    query.toLowerCase().includes('स्टॉक या म्यूचुअल फंड') ||
                                    query.toLowerCase().includes('शेयर या फंड') ||
                                    query.toLowerCase().includes('डायरेक्ट इक्विटी');
    
    // If it's a future planning query but profile is incomplete, provide specific guidance
    if (isFuturePlanQuery && !profileStatus.complete) {
      const missingFieldsText = profileStatus.missingFields.join(', ');
      const incompleteProfileResponse = {
        text: `आपने भविष्य की वित्तीय योजना के बारे में पूछा है, लेकिन आपकी प्रोफाइल अभी अधूरी है (${profileStatus.completionPercentage}% पूर्ण)। व्यक्तिगत वित्तीय सलाह प्रदान करने के लिए, हमें आपकी प्रोफाइल में निम्नलिखित जानकारी की आवश्यकता है: ${missingFieldsText}। क्या आप अभी अपनी प्रोफाइल अपडेट करना चाहेंगे?`,
        profileStatus
      };
      
      // Save the chat session
      const chatSession = new ChatbotSession({
        userId: req.user.userId,
        query,
        response: incompleteProfileResponse.text,
        context: { profileStatus, isFuturePlanQuery: true },
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
      isFuturePlanQuery,
      isInvestmentQuery,
      isSipVsLumpSumQuery,
      isStockVsMutualFundQuery,
      // Add personalized context based on user profile
      personalization: {
        riskProfile: userProfile?.riskAppetite || 'medium',
        financialGoals: userProfile?.goals || [],
        demographicInfo: userProfile?.onboardingData?.demographic || {},
        psychologicalProfile: userProfile?.onboardingData?.psychological || {},
        age: userProfile?.age,
        income: userProfile?.income,
        name: userProfile?.name
      }
    };
    
    // If it's an investment query but profile is incomplete, provide specific guidance
    if (isInvestmentQuery && !profileStatus.complete) {
      const missingFieldsText = profileStatus.missingFields.join(', ');
      const incompleteProfileResponse = {
        text: `आपने निवेश विकल्पों के बारे में पूछा है, लेकिन आपकी प्रोफाइल अभी अधूरी है (${profileStatus.completionPercentage}% पूर्ण)। व्यक्तिगत निवेश सलाह प्रदान करने के लिए, हमें आपकी प्रोफाइल में निम्नलिखित जानकारी की आवश्यकता है: ${missingFieldsText}। क्या आप अभी अपनी प्रोफाइल अपडेट करना चाहेंगे?`,
        profileStatus
      };
      
      // Save the chat session
      const chatSession = new ChatbotSession({
        userId: req.user.userId,
        query,
        response: incompleteProfileResponse.text,
        context: { profileStatus, isInvestmentQuery: true },
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
    let systemPrompt = 'You are a financial advisor assistant for NiveshPath, a personal finance education platform for Indian users. FORMAT YOUR RESPONSES APPROPRIATELY: Present tabular data in markdown tables, use bullet points for lists, and use paragraphs for explanations. Always structure your response for maximum readability and clarity. ';
    
    // Add profile completeness information to the prompt
    if (context.profileStatus && !context.profileStatus.complete) {
      systemPrompt += `The user's profile is incomplete (${context.profileStatus.completionPercentage}% complete). They are missing: ${context.profileStatus.missingFields.join(', ')}. Encourage them to complete their profile for better personalized advice. `;
    }
    
    // Check if query is about future plans or financial advice
    const isFuturePlanQuery = query.toLowerCase().includes('future') || 
                             query.toLowerCase().includes('plan') || 
                             query.toLowerCase().includes('advice') || 
                             query.toLowerCase().includes('suggest') || 
                             query.toLowerCase().includes('recommendation') ||
                             query.toLowerCase().includes('भविष्य') ||
                             query.toLowerCase().includes('योजना') ||
                             query.toLowerCase().includes('सलाह') ||
                             query.toLowerCase().includes('सुझाव');
    
    // Check if query is specifically about investment options
    const isInvestmentQuery = query.toLowerCase().includes('invest') ||
                             query.toLowerCase().includes('stock') ||
                             query.toLowerCase().includes('sip') ||
                             query.toLowerCase().includes('mutual fund') ||
                             query.toLowerCase().includes('equity') ||
                             query.toLowerCase().includes('bond') ||
                             query.toLowerCase().includes('निवेश') ||
                             query.toLowerCase().includes('स्टॉक') ||
                             query.toLowerCase().includes('शेयर') ||
                             query.toLowerCase().includes('म्यूचुअल फंड') ||
                             query.toLowerCase().includes('इक्विटी');
    
    // Check if query is specifically about SIP vs lump sum
    const isSipVsLumpSumQuery = query.toLowerCase().includes('sip vs') ||
                               query.toLowerCase().includes('sip or lump') ||
                               query.toLowerCase().includes('lump sum') ||
                               query.toLowerCase().includes('monthly invest') ||
                               query.toLowerCase().includes('एसआईपी') ||
                               query.toLowerCase().includes('मासिक निवेश') ||
                               query.toLowerCase().includes('एकमुश्त निवेश');
    
    // Check if query is specifically about stocks vs mutual funds
    const isStockVsMutualFundQuery = query.toLowerCase().includes('stock vs') ||
                                    query.toLowerCase().includes('stock or mutual') ||
                                    query.toLowerCase().includes('direct equity') ||
                                    query.toLowerCase().includes('स्टॉक या म्यूचुअल फंड') ||
                                    query.toLowerCase().includes('शेयर या फंड') ||
                                    query.toLowerCase().includes('डायरेक्ट इक्विटी');
    
    // Add personalization based on user profile if available
    if (context.personalization) {
      const { riskProfile, financialGoals, demographicInfo, psychologicalProfile, age, income, name } = context.personalization;
      
      // Add user name for personalized greeting if available
      if (name) {
        systemPrompt += `The user's name is ${name}. Address them by name occasionally for a personalized experience. `;
      }
      
      // Add detailed age-based analysis
      if (age) {
        systemPrompt += `The user's age is ${age}. `;
        if (age < 30) {
          systemPrompt += 'For this young user: Focus on long-term growth investments, higher equity allocation (70-80%), building emergency fund (3-6 months expenses), term insurance, and starting retirement planning early. Emphasize the power of compounding with their long investment horizon. ';
        } else if (age >= 30 && age < 45) {
          systemPrompt += 'For this middle-aged user: Focus on balanced investment approach (50-60% equity), increasing retirement contributions, adequate life and health insurance, children\'s education planning if applicable, and possibly home loan management. ';
        } else if (age >= 45 && age < 60) {
          systemPrompt += 'For this mature user: Focus on conservative investment approach (40-50% equity), accelerating retirement savings, reviewing insurance coverage, debt reduction, and beginning retirement transition planning. ';
        } else {
          systemPrompt += 'For this senior user: Focus on income generation, capital preservation (20-30% equity maximum), healthcare planning, estate planning, and systematic withdrawal strategies. ';
        }
      }
      
      // Add detailed income-based analysis
      if (income) {
        systemPrompt += `The user's annual income is ₹${income}. `;
        if (income < 500000) {
          systemPrompt += 'For this income level: Focus on essential expenses management, building emergency fund first, small SIPs starting at ₹500-1000 monthly, tax-saving through Section 80C basic options, and affordable term insurance. Suggest specific budget allocation percentages (50-30-20 rule). ';
        } else if (income >= 500000 && income < 1000000) {
          systemPrompt += 'For this income level: Focus on increasing savings rate (aim for 20-30%), diversified mutual funds, maximizing tax benefits through ELSS, NPS, and health insurance, and building a balanced emergency fund. Suggest specific monthly SIP amounts based on their income. ';
        } else if (income >= 1000000 && income < 2000000) {
          systemPrompt += 'For this income level: Focus on comprehensive tax planning, diversified investment portfolio with some direct equity exposure, maximizing 80C, 80D, and NPS benefits, and possibly exploring alternative investments. Recommend specific SIP amounts and lump sum allocations. ';
        } else {
          systemPrompt += 'For this income level: Focus on sophisticated tax planning, diversified asset allocation across equity, debt, gold, and alternative investments, wealth management services consideration, and estate planning. Provide specific investment vehicle recommendations with minimum investment amounts. ';
        }
      }
      
      // Add location-specific recommendations if available
      if (demographicInfo && demographicInfo.location) {
        systemPrompt += `The user is from ${demographicInfo.location}. `;
        
        // Add location-specific investment advice
        if (demographicInfo.location.toLowerCase().includes('mumbai') || 
            demographicInfo.location.toLowerCase().includes('delhi') || 
            demographicInfo.location.toLowerCase().includes('bangalore') || 
            demographicInfo.location.toLowerCase().includes('pune') || 
            demographicInfo.location.toLowerCase().includes('hyderabad')) {
          systemPrompt += 'For metropolitan residents: Consider higher emergency fund (6-9 months) due to higher cost of living, real estate investment trusts (REITs) for property exposure without high capital, and special emphasis on health insurance with higher coverage due to expensive healthcare. ';
        } else if (demographicInfo.location.toLowerCase().includes('tier 2') || 
                  demographicInfo.location.toLowerCase().includes('tier ii')) {
          systemPrompt += 'For tier 2 city residents: Consider balanced emergency fund (4-6 months), potential real estate investments due to growth prospects, and mutual funds with exposure to infrastructure and development sectors. ';
        } else {
          systemPrompt += 'For their location: Provide advice considering local cost of living, investment opportunities, and financial services accessibility. ';
        }
      }
      
      // Add risk profile context with specific recommendations
      if (riskProfile) {
        systemPrompt += `The user has a ${riskProfile} risk appetite. `;
        if (riskProfile === 'low') {
          systemPrompt += 'For low risk appetite: Recommend predominantly debt instruments (70-80%) like government bonds, corporate FDs, debt mutual funds, PPF, and only 20-30% in large-cap equity funds or bluechip stocks. Emphasize capital preservation over growth. ';
        } else if (riskProfile === 'medium') {
          systemPrompt += 'For medium risk appetite: Recommend balanced allocation with 40-60% in equity (predominantly large and mid-cap funds), 30-40% in debt instruments, and 10-20% in hybrid funds or gold. Focus on steady growth with moderate volatility. ';
        } else if (riskProfile === 'high') {
          systemPrompt += 'For high risk appetite: Recommend aggressive allocation with 70-80% in equity (including mid, small-cap, and sectoral funds), 10-20% in debt for stability, and possibly 5-10% in high-risk high-reward options like international funds or concentrated portfolios. ';
        }
      }
      
      // Add financial goals context with specific timelines and strategies
      if (financialGoals && financialGoals.length > 0) {
        systemPrompt += `Their financial goals include: ${financialGoals.join(', ')}. `;
        
        // Add goal-specific recommendations
        financialGoals.forEach(goal => {
          if (goal.toLowerCase().includes('retirement')) {
            systemPrompt += 'For retirement planning: Recommend NPS allocation, equity mutual funds for long-term horizon, and debt instruments as they approach retirement age. Calculate corpus needed based on their current age, expected retirement age, and inflation. ';
          } else if (goal.toLowerCase().includes('education') || goal.toLowerCase().includes('college')) {
            systemPrompt += 'For education planning: Recommend Sukanya Samriddhi Yojana for girl child, education-focused mutual fund SIPs, or education insurance plans depending on time horizon. Calculate expected education inflation at 10-12% annually. ';
          } else if (goal.toLowerCase().includes('home') || goal.toLowerCase().includes('house')) {
            systemPrompt += 'For home purchase: Recommend liquid funds for down payment savings, optimal loan-to-value ratio based on income, and prepayment strategies to reduce interest burden. ';
          } else if (goal.toLowerCase().includes('wedding') || goal.toLowerCase().includes('marriage')) {
            systemPrompt += 'For wedding expenses: Recommend balanced mutual funds for 3+ year horizons, liquid and ultra-short funds for shorter horizons, and systematic withdrawal plans as the event approaches. ';
          } else if (goal.toLowerCase().includes('business') || goal.toLowerCase().includes('startup')) {
            systemPrompt += 'For business funding: Recommend high-liquidity instruments, balanced risk approach, and separate emergency fund specifically for business contingencies. ';
          }
        });
      }
      
      // Add occupation-specific advice if available
      if (demographicInfo && demographicInfo.occupation) {
        systemPrompt += `Their occupation is ${demographicInfo.occupation}. `;
        
        if (demographicInfo.occupation.toLowerCase().includes('business') || 
            demographicInfo.occupation.toLowerCase().includes('entrepreneur')) {
          systemPrompt += 'For business owners: Recommend separate personal and business emergency funds, business insurance, retirement plans like NPS as corporate tax may be optimized differently, and diversification away from their business industry. ';
        } else if (demographicInfo.occupation.toLowerCase().includes('government') || 
                  demographicInfo.occupation.toLowerCase().includes('public sector')) {
          systemPrompt += 'For government employees: Leverage NPS additional contribution benefits, consider VPF for additional tax-free returns, and focus on post-retirement planning to complement pension benefits. ';
        } else if (demographicInfo.occupation.toLowerCase().includes('private') || 
                  demographicInfo.occupation.toLowerCase().includes('corporate')) {
          systemPrompt += 'For private sector employees: Maximize employer-provided benefits like NPS matching, ESOP planning if applicable, and build a stronger emergency fund due to job market volatility. ';
        } else if (demographicInfo.occupation.toLowerCase().includes('freelance') || 
                  demographicInfo.occupation.toLowerCase().includes('self-employed')) {
          systemPrompt += 'For freelancers/self-employed: Recommend larger emergency fund (9-12 months), professional liability insurance if applicable, and disciplined investment through auto-debits to manage irregular income. ';
        }
      }
      
      // Add psychological profile information with tailored communication approach
      if (psychologicalProfile) {
        if (psychologicalProfile.riskTolerance) {
          systemPrompt += `Their risk tolerance is ${psychologicalProfile.riskTolerance}. `;
        }
        if (psychologicalProfile.financialAnxiety) {
          systemPrompt += `Their financial anxiety level is ${psychologicalProfile.financialAnxiety}. `;
          
          if (psychologicalProfile.financialAnxiety === 'high') {
            systemPrompt += 'For high financial anxiety: Use reassuring language, emphasize safety features of recommended investments, suggest automation of savings/investments to reduce decision stress, and recommend gradual approach to new financial strategies. ';
          }
        }
        if (psychologicalProfile.decisionMakingStyle) {
          systemPrompt += `Their decision making style is ${psychologicalProfile.decisionMakingStyle}. `;
          
          if (psychologicalProfile.decisionMakingStyle === 'analytical') {
            systemPrompt += 'For analytical decision-makers: Provide detailed data, comparative analysis, historical performance metrics, and logical frameworks for financial decisions. ';
          } else if (psychologicalProfile.decisionMakingStyle === 'intuitive') {
            systemPrompt += 'For intuitive decision-makers: Focus on big-picture benefits, use analogies and stories, and connect recommendations to their personal values and goals. ';
          } else if (psychologicalProfile.decisionMakingStyle === 'consultative') {
            systemPrompt += 'For consultative decision-makers: Suggest resources for second opinions, provide multiple expert viewpoints, and recommend community or advisor-based validation options. ';
          } else if (psychologicalProfile.decisionMakingStyle === 'spontaneous') {
            systemPrompt += 'For spontaneous decision-makers: Provide clear, actionable steps with immediate benefits highlighted, and suggest automation strategies to harness quick decisions positively. ';
          }
        }
      }
    }
    
    // Add query type flags to context
    context.isSipVsLumpSumQuery = isSipVsLumpSumQuery;
    context.isStockVsMutualFundQuery = isStockVsMutualFundQuery;
    
    // Complete the system prompt with special instructions for future planning or investment queries
    if ((isFuturePlanQuery || isInvestmentQuery) && context.personalization) {
      // Add specific formatting instructions for financial planning data
      systemPrompt += 'DEEP SEARCH FORMATTING: When providing investment recommendations, present options in a comparison table with columns for investment type, risk level, expected returns, and minimum investment amount. When discussing tax implications, use bullet points for each tax rule. When explaining financial concepts, use numbered steps. When showing calculations, highlight the formula and result in bold. ';
      
      const { age, income, riskProfile } = context.personalization;
      
      // Add specific age-based analysis to system prompt
      if (age) {
        systemPrompt += `The user's age is ${age}. `;
        if (age < 30) {
          systemPrompt += 'For young users, focus on long-term investments, higher risk tolerance, and building financial habits. ';
        } else if (age >= 30 && age < 45) {
          systemPrompt += 'For middle-aged users, focus on balanced investment strategies, family financial planning, and increasing savings rate. ';
        } else if (age >= 45 && age < 60) {
          systemPrompt += 'For mature users, focus on retirement planning, safer investments, and wealth preservation strategies. ';
        } else {
          systemPrompt += 'For senior users, focus on income security, asset protection, and estate planning. ';
        }
      }
      
      // Add specific income-based analysis to system prompt
      if (income) {
        systemPrompt += `The user's annual income is ₹${income}. `;
        if (income < 500000) {
          systemPrompt += 'For lower income levels, focus on budget management, emergency funds, and essential insurance. ';
        } else if (income >= 500000 && income < 1000000) {
          systemPrompt += 'For moderate income levels, focus on increasing savings rate, tax-saving investments, and lifestyle management. ';
        } else if (income >= 1000000 && income < 2000000) {
          systemPrompt += 'For good income levels, focus on diversified investment portfolio, tax planning, and wealth accumulation. ';
        } else {
          systemPrompt += 'For high income levels, focus on asset diversification, tax optimization, and wealth management services. ';
        }
      }
      
      // Add specific investment recommendations based on query type
      if (isInvestmentQuery) {
        systemPrompt += 'INVESTMENT RECOMMENDATIONS: The user is asking about investment options. ';
        
        // Add risk-based investment recommendations
        if (riskProfile) {
          systemPrompt += `Based on their ${riskProfile} risk profile: `;
          if (riskProfile === 'low') {
            systemPrompt += 'RECOMMEND: Fixed deposits, government bonds, debt mutual funds, PPF, and low-risk index funds. AVOID: Direct equity investments, high-risk sector funds, and cryptocurrency. ';
          } else if (riskProfile === 'medium') {
            systemPrompt += 'RECOMMEND: Balanced mutual funds, blue-chip stocks, SIPs in diversified equity funds, corporate bonds, and REITs. AVOID: High-risk small-cap stocks and concentrated sector bets. ';
          } else if (riskProfile === 'high') {
            systemPrompt += 'RECOMMEND: Equity-heavy portfolio, mid and small-cap funds, international equity, sectoral funds, and some alternative investments. AVOID: Excessive concentration in fixed income. ';
          }
        }
        
        // Check for specific SIP vs lump sum query
        if (context.isSipVsLumpSumQuery) {
          systemPrompt += 'SPECIFIC QUERY: The user is asking about SIP vs lump sum investments. PROVIDE DETAILED COMPARISON: ';
          systemPrompt += 'FORMAT AS TABLE: Create a detailed comparison table with rows for: 1) Definition, 2) Best suited for, 3) Market condition advantage, 4) Risk management, 5) Return potential, 6) Psychological benefits, 7) Flexibility, 8) Recommended allocation based on user profile. ';
          systemPrompt += 'PERSONALIZED RECOMMENDATION: Based on the user\'s age, income, and risk profile, provide a specific recommendation on whether they should prefer SIP, lump sum, or a combination approach. If recommending a combination, specify exact percentages. ';
          systemPrompt += 'EXAMPLE CALCULATION: Show a 5-year projection comparing returns from both approaches using realistic market scenarios and the user\'s potential investment amount (estimated from income). ';
        }
        // Check for specific stock vs mutual fund query
        else if (context.isStockVsMutualFundQuery) {
          systemPrompt += 'SPECIFIC QUERY: The user is asking about direct stock investments vs mutual funds. PROVIDE DETAILED COMPARISON: ';
          systemPrompt += 'FORMAT AS TABLE: Create a detailed comparison table with rows for: 1) Control & decision making, 2) Diversification, 3) Research required, 4) Time commitment, 5) Minimum investment, 6) Expense ratio/costs, 7) Tax implications, 8) Recommended allocation based on user profile. ';
          systemPrompt += 'PERSONALIZED RECOMMENDATION: Based on the user\'s age, income, risk profile, and psychological profile (if available), provide a specific recommendation on whether they should prefer direct stocks, mutual funds, or a hybrid approach. If recommending a hybrid approach, specify exact percentages and suggest specific investment vehicles. ';
          systemPrompt += 'KNOWLEDGE ASSESSMENT: Based on the user\'s profile, assess their likely investment knowledge level and tailor your recommendation accordingly. For beginners, emphasize learning resources alongside safer options. ';
        }
        // General investment recommendations
        else {
          // Add specific instructions for SIP vs lump sum recommendations
          systemPrompt += 'IMPORTANT: When recommending between SIP vs lump sum investments, consider: 1) For beginners or those with regular income, recommend SIPs to build discipline and benefit from rupee cost averaging. 2) For those with lump sum amounts, recommend partial SIP and partial lump sum approach based on market conditions. 3) Always explain the pros and cons of each approach with examples. ';
          
          // Add specific instructions for stock vs mutual fund recommendations
          systemPrompt += 'When recommending between direct stocks vs mutual funds: 1) For users with limited investment knowledge or time, recommend mutual funds with appropriate risk categories. 2) For financially savvy users with time to research, suggest a core portfolio of mutual funds supplemented with direct stocks. 3) Always explain the tax implications, expense ratios, and time commitment required for each approach. ';
        }
        
        systemPrompt += 'ALWAYS provide specific investment vehicle recommendations (not just asset classes) with approximate expected returns based on historical data. Include minimum investment amounts, lock-in periods, and tax implications for each recommendation. ';
      } else {
        systemPrompt += 'The user is asking about future financial plans or advice. ';
      }
      
      systemPrompt += 'IMPORTANT: Base your recommendations STRICTLY on their profile data. Only suggest plans that align with their specific financial goals, risk appetite, income level, and demographic information. DO NOT provide generic advice. If their profile lacks critical information, suggest completing those specific profile fields first. ALWAYS analyze age and income implications in your advice. ';
    }
    
    systemPrompt += 'Provide helpful, accurate information about personal finance topics, especially in the Indian context. IMPORTANT FORMATTING INSTRUCTIONS: 1) When presenting numerical data, statistics, or comparisons, ALWAYS use markdown tables. 2) When listing options, steps, or multiple points, ALWAYS use bullet points. 3) For explanations and general advice, use well-structured paragraphs with clear headings. 4) For important financial metrics or key figures, highlight them in bold. 5) When explaining complex concepts, break them down into numbered steps. Use a conversational, friendly tone and respond in a natural way that feels human-like. Include some personality in your responses, use analogies where appropriate, and vary your sentence structure. When responding in Hindi, use natural conversational Hindi rather than formal language. Respond as if you are having a real conversation with the user.';
    
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
      userQuery = `${query} (Note: User is asking about profile completion. Their profile is ${context.profileStatus.completionPercentage}% complete, missing: ${context.profileStatus.missingFields.join(', ')}. Please guide them on how to complete these specific fields in a conversational, helpful manner. Use examples and analogies to explain why completing these fields is important. FORMAT RESPONSE: Present missing fields in a table with field name and importance, use bullet points for steps to complete profile, and use paragraphs for general explanations.)`;
    }
    
    // Enhance query with dynamic context based on query type
    if (context.personalization) {
      const { name, age, income, riskProfile, financialGoals, demographicInfo, psychologicalProfile } = context.personalization;
      
      // Enhanced analysis instructions for age and income
      let ageAnalysis = "";
      if (age) {
        if (age < 30) {
          ageAnalysis = `उपयोगकर्ता युवा है (${age} वर्ष), इसलिए लंबी अवधि के निवेश और जोखिम लेने की क्षमता अधिक है।`;
        } else if (age >= 30 && age < 45) {
          ageAnalysis = `उपयोगकर्ता मध्य आयु वर्ग में है (${age} वर्ष), इसलिए संतुलित निवेश रणनीति उचित होगी।`;
        } else if (age >= 45 && age < 60) {
          ageAnalysis = `उपयोगकर्ता परिपक्व आयु वर्ग में है (${age} वर्ष), इसलिए सुरक्षित निवेश और रिटायरमेंट प्लानिंग पर ध्यान देना चाहिए।`;
        } else {
          ageAnalysis = `उपयोगकर्ता वरिष्ठ आयु वर्ग में है (${age} वर्ष), इसलिए आय सुरक्षा और संपत्ति संरक्षण पर ध्यान केंद्रित करना चाहिए।`;
        }
      }
      
      let incomeAnalysis = "";
      if (income) {
        if (income < 500000) {
          incomeAnalysis = `उपयोगकर्ता की आय कम है (₹${income}/वर्ष), इसलिए बजट प्रबंधन और आपातकालीन फंड बनाने पर ध्यान देना चाहिए।`;
        } else if (income >= 500000 && income < 1000000) {
          incomeAnalysis = `उपयोगकर्ता की आय मध्यम है (₹${income}/वर्ष), इसलिए बचत बढ़ाने और कर बचत पर ध्यान देना चाहिए।`;
        } else if (income >= 1000000 && income < 2000000) {
          incomeAnalysis = `उपयोगकर्ता की आय अच्छी है (₹${income}/वर्ष), इसलिए विविध निवेश पोर्टफोलियो और कर योजना पर ध्यान देना चाहिए।`;
        } else {
          incomeAnalysis = `उपयोगकर्ता की आय उच्च है (₹${income}/वर्ष), इसलिए संपत्ति विविधीकरण, कर योजना और संपत्ति प्रबंधन पर ध्यान देना चाहिए।`;
        }
      }
      
      // Location-specific analysis
      let locationAnalysis = "";
      if (demographicInfo && demographicInfo.location) {
        if (demographicInfo.location.toLowerCase().includes('mumbai') || 
            demographicInfo.location.toLowerCase().includes('delhi') || 
            demographicInfo.location.toLowerCase().includes('bangalore') || 
            demographicInfo.location.toLowerCase().includes('pune') || 
            demographicInfo.location.toLowerCase().includes('hyderabad')) {
          locationAnalysis = `उपयोगकर्ता महानगर ${demographicInfo.location} में रहता है, जहां जीवन यापन की लागत अधिक है, इसलिए बड़े आपातकालीन फंड और उच्च स्वास्थ्य बीमा कवरेज की आवश्यकता है।`;
        } else if (demographicInfo.location.toLowerCase().includes('tier 2') || 
                 demographicInfo.location.toLowerCase().includes('tier ii')) {
          locationAnalysis = `उपयोगकर्ता टियर 2 शहर ${demographicInfo.location} में रहता है, जहां रियल एस्टेट निवेश के अच्छे अवसर हो सकते हैं।`;
        }
      }
      
      // Occupation-specific analysis
      let occupationAnalysis = "";
      if (demographicInfo && demographicInfo.occupation) {
        if (demographicInfo.occupation.toLowerCase().includes('business') || 
            demographicInfo.occupation.toLowerCase().includes('entrepreneur')) {
          occupationAnalysis = `उपयोगकर्ता एक व्यवसायी है, इसलिए व्यक्तिगत और व्यावसायिक वित्त को अलग रखने और व्यवसाय से अलग क्षेत्रों में निवेश करने की सलाह दें।`;
        } else if (demographicInfo.occupation.toLowerCase().includes('government') || 
                 demographicInfo.occupation.toLowerCase().includes('public sector')) {
          occupationAnalysis = `उपयोगकर्ता सरकारी कर्मचारी है, इसलिए NPS अतिरिक्त योगदान लाभ और VPF पर विचार करने की सलाह दें।`;
        } else if (demographicInfo.occupation.toLowerCase().includes('private') || 
                 demographicInfo.occupation.toLowerCase().includes('corporate')) {
          occupationAnalysis = `उपयोगकर्ता निजी क्षेत्र में काम करता है, इसलिए नौकरी की अस्थिरता को देखते हुए मजबूत आपातकालीन फंड बनाने की सलाह दें।`;
        } else if (demographicInfo.occupation.toLowerCase().includes('freelance') || 
                 demographicInfo.occupation.toLowerCase().includes('self-employed')) {
          occupationAnalysis = `उपयोगकर्ता फ्रीलांसर/स्वरोजगार है, इसलिए बड़े आपातकालीन फंड और अनियमित आय के प्रबंधन के लिए ऑटो-डेबिट के माध्यम से अनुशासित निवेश की सलाह दें।`;
        }
      }
      
      // Psychological profile analysis
      let psychologicalAnalysis = "";
      if (psychologicalProfile) {
        if (psychologicalProfile.financialAnxiety === 'high') {
          psychologicalAnalysis += `उपयोगकर्ता की वित्तीय चिंता अधिक है, इसलिए आश्वासक भाषा का उपयोग करें और निवेश की सुरक्षा विशेषताओं पर जोर दें। `;
        }
        
        if (psychologicalProfile.decisionMakingStyle === 'analytical') {
          psychologicalAnalysis += `उपयोगकर्ता विश्लेषणात्मक निर्णय लेने वाला है, इसलिए विस्तृत डेटा और तुलनात्मक विश्लेषण प्रदान करें। `;
        } else if (psychologicalProfile.decisionMakingStyle === 'intuitive') {
          psychologicalAnalysis += `उपयोगकर्ता सहज निर्णय लेने वाला है, इसलिए बड़ी तस्वीर के लाभों पर ध्यान केंद्रित करें और उदाहरणों का उपयोग करें। `;
        } else if (psychologicalProfile.decisionMakingStyle === 'consultative') {
          psychologicalAnalysis += `उपयोगकर्ता परामर्शदात्मक निर्णय लेने वाला है, इसलिए विभिन्न विशेषज्ञ दृष्टिकोण प्रदान करें। `;
        } else if (psychologicalProfile.decisionMakingStyle === 'spontaneous') {
          psychologicalAnalysis += `उपयोगकर्ता स्वतःस्फूर्त निर्णय लेने वाला है, इसलिए स्पष्ट, कार्रवाई योग्य चरण प्रदान करें। `;
        }
      }
      
      // Customize query enhancement based on query type
      if (context.isFuturePlanQuery) {
        userQuery = `${query} (Note: This is a future planning query. ANALYZE the user's profile data: Name: ${name || 'Not provided'}, Age: ${age || 'Not provided'}, Income: ${income || 'Not provided'}, Risk Profile: ${riskProfile || 'Not provided'}, Financial Goals: ${financialGoals?.join(', ') || 'Not provided'}. ${ageAnalysis} ${incomeAnalysis} ${locationAnalysis} ${occupationAnalysis} ${psychologicalAnalysis}

Provide personalized advice based ONLY on this profile data with detailed analysis of age, income, location, and occupation implications. FORMAT YOUR RESPONSE: 1) Present investment options in a comparison TABLE with columns for investment type, risk level, expected returns, and minimum investment. 2) Use BULLET POINTS for listing steps, recommendations, or options. 3) Use NUMBERED STEPS for explaining complex financial concepts. 4) Use BOLD text for highlighting key financial metrics or important figures. 5) Present any tax implications in a structured format with clear headings. Use a conversational, friendly tone with natural language flow. Include relatable examples and analogies that connect with the user's specific situation. Vary your sentence structure and use a mix of short and detailed explanations. If responding in Hindi, use natural conversational Hindi rather than formal language. If critical information is missing, suggest completing the profile first in a friendly, encouraging way that explains the benefits of providing this information.)`;
      } 
      // For investment queries, provide more specific investment recommendations
      else if (context.isInvestmentQuery) {
        userQuery = `${query} (Note: This is an investment query. ANALYZE the user's investment profile: Age: ${age || 'Not provided'}, Income: ${income || 'Not provided'}, Risk Profile: ${riskProfile || 'Not provided'}. ${ageAnalysis} ${incomeAnalysis} ${locationAnalysis} ${psychologicalAnalysis}

Provide SPECIFIC investment recommendations based on the user's profile. FORMAT YOUR RESPONSE: 1) Present a comparison TABLE of recommended investment options with columns for: investment name, risk level, expected returns (%), minimum investment amount, lock-in period, and tax implications. 2) For each recommended investment, provide EXACT fund names or investment vehicles (not just asset classes). 3) Include a separate section on tax optimization strategies relevant to their income bracket. 4) Recommend SPECIFIC SIP amounts or lump sum investments based on their income level. 5) Include a small section on market timing considerations if relevant. Use a conversational, friendly tone and tailor your communication style to match their psychological profile.)`;
      }
      // For SIP vs lump sum queries, provide detailed comparison
      else if (context.isSipVsLumpSumQuery) {
        userQuery = `${query} (Note: This is a SIP vs Lump Sum query. ANALYZE the user's profile: Age: ${age || 'Not provided'}, Income: ${income || 'Not provided'}, Risk Profile: ${riskProfile || 'Not provided'}. ${ageAnalysis} ${incomeAnalysis} ${psychologicalAnalysis}

Provide a DETAILED COMPARISON between SIP and lump sum investments specifically tailored to this user's situation. FORMAT YOUR RESPONSE: 1) Create a comprehensive comparison TABLE with rows for: definition, best suited for, market condition advantage, risk management, return potential, psychological benefits, flexibility, and recommended allocation based on user profile. 2) Include a PERSONALIZED RECOMMENDATION section stating whether they should prefer SIP, lump sum, or a combination approach with EXACT percentages. 3) Show a 5-YEAR PROJECTION comparing returns from both approaches using realistic market scenarios and the user's potential investment amount (estimated from their income). 4) Include a section on TAX IMPLICATIONS for both approaches. Use a conversational, friendly tone and tailor your communication style to match their psychological profile.)`;
      }
      // For stock vs mutual fund queries, provide detailed comparison
      else if (context.isStockVsMutualFundQuery) {
        userQuery = `${query} (Note: This is a Stocks vs Mutual Funds query. ANALYZE the user's profile: Age: ${age || 'Not provided'}, Income: ${income || 'Not provided'}, Risk Profile: ${riskProfile || 'Not provided'}. ${ageAnalysis} ${incomeAnalysis} ${psychologicalAnalysis}

Provide a DETAILED COMPARISON between direct stock investments and mutual funds specifically tailored to this user's situation. FORMAT YOUR RESPONSE: 1) Create a comprehensive comparison TABLE with rows for: control & decision making, diversification, research required, time commitment, minimum investment, expense ratio/costs, tax implications, and recommended allocation based on user profile. 2) Include a PERSONALIZED RECOMMENDATION section stating whether they should prefer direct stocks, mutual funds, or a hybrid approach with EXACT percentages and SPECIFIC investment vehicles. 3) Include a KNOWLEDGE ASSESSMENT section that evaluates their likely investment knowledge level based on their profile and tailors recommendations accordingly. 4) Provide a GETTING STARTED section with exact steps to begin implementing your recommendation. Use a conversational, friendly tone and tailor your communication style to match their psychological profile.)`;
      }
      // For profile completion queries, provide guidance on completing profile
      else if (query.toLowerCase().includes('profile') && context.profileStatus && !context.profileStatus.complete) {
        userQuery = `${query} (Note: User is asking about profile completion. Their profile is ${context.profileStatus.completionPercentage}% complete, missing: ${context.profileStatus.missingFields.join(', ')}. Please guide them on how to complete these specific fields in a conversational, helpful manner. FORMAT RESPONSE: 1) Present missing fields in a TABLE with field name and importance, 2) Use BULLET POINTS for steps to complete profile, 3) Use PARAGRAPHS for general explanations, and 4) Include EXAMPLES of how providing this information will lead to better financial advice. For example, if age is missing, explain how different age groups receive different investment strategies. Use a conversational, friendly tone with natural language flow.)`;
      }
      // For general queries, still provide some personalization
      else {
        userQuery = `${query} (Note: PERSONALIZE your response based on: Age: ${age || 'Not provided'}, Income: ${income || 'Not provided'}, Risk Profile: ${riskProfile || 'Not provided'}. ${ageAnalysis} ${incomeAnalysis} ${psychologicalAnalysis} FORMAT YOUR RESPONSE appropriately using tables for comparisons, bullet points for lists, and clear paragraphs for explanations. Use a conversational, friendly tone and tailor your communication style to match their psychological profile.)`;
      }
    }
    
    messages.push({
      role: 'user',
      content: userQuery
    });
    
    // Make API request with enhanced parameters for more dynamic responses
    const response = await axios.post(
      `${process.env.MISTRAL_API_URL}/chat/completions`,
      {
        model: 'mistral-medium',  // or whichever model is appropriate
        messages: messages,
        temperature: 0.85,        // Increased temperature for more creative responses
        max_tokens: 1000,         // Increased token limit for more comprehensive responses
        top_p: 0.95,              // Nucleus sampling for more diverse text generation
        presence_penalty: 0.6,    // Reduces repetition by penalizing tokens already present
        frequency_penalty: 0.5,   // Reduces repetition by penalizing frequent tokens
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
    
    // Process the response to enhance natural flow and readability
    let responseText = response.data.choices[0].message.content;
    
    // Remove any unnecessary formatting that might make the response look automated
    responseText = responseText.replace(/\n\n+/g, '\n\n')  // Replace multiple newlines with double newlines
                             .trim();                      // Remove trailing whitespace
    
    // Add natural pauses and flow indicators for more human-like responses
    if (responseText.length > 200 && !responseText.includes('...')) {
      // Find a good spot to add a thoughtful pause in longer responses
      const sentences = responseText.split('. ');
      if (sentences.length > 3) {
        const pauseIndex = Math.floor(sentences.length / 3);
        sentences[pauseIndex] = sentences[pauseIndex] + '... ';
        responseText = sentences.join('. ');
      }
    }
    
    return {
      text: responseText,
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