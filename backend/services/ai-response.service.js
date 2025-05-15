/**
 * AI Response Service
 * Handles generating AI responses for the chatbot based on user queries and profile data
 */

const axios = require('axios');

/**
 * Generate AI response based on user query and context
 * @param {string} query - User's question
 * @param {Object} context - Context information including user profile and profile status
 * @returns {Promise<string>} - AI generated response
 */
async function generateAIResponse(query, context) {
  try {
    const { profileStatus, userProfile, isInvestmentRelated, isSmartInvestmentQuery, isGoalBasedPlanningQuery, isPeerComparisonQuery, isFinancialHealthQuery } = context;
    
    // Prepare system prompt based on available profile data
    let systemPrompt = `तुम NiveshPath के AI वित्तीय सलाहकार हो, जो भारतीय उपयोगकर्ताओं को वित्तीय शिक्षा और सलाह प्रदान करते हो।`;
    
    // Add available profile information to the prompt
    if (userProfile) {
      systemPrompt += `\n\nउपयोगकर्ता की प्रोफाइल जानकारी:`;
      if (userProfile.name) systemPrompt += `\n- नाम: ${userProfile.name}`;
      if (userProfile.age) systemPrompt += `\n- उम्र: ${userProfile.age} वर्ष`;
      if (userProfile.income) systemPrompt += `\n- आय: ₹${userProfile.income} प्रति वर्ष`;
      if (userProfile.riskAppetite) systemPrompt += `\n- जोखिम क्षमता: ${userProfile.riskAppetite}`;
      if (userProfile.goals && userProfile.goals.length > 0) {
        systemPrompt += `\n- वित्तीय लक्ष्य: ${userProfile.goals.join(', ')}`;
      }
      
      // Add onboarding data if available
      if (userProfile.onboardingData) {
        if (userProfile.onboardingData.demographic) {
          const demo = userProfile.onboardingData.demographic;
          if (demo.location) systemPrompt += `\n- स्थान: ${demo.location}`;
          if (demo.occupation) systemPrompt += `\n- व्यवसाय: ${demo.occupation}`;
        }
      }
    }
    
    // Add instructions based on profile completeness
    systemPrompt += `\n\nप्रोफाइल पूर्णता: ${profileStatus.completionPercentage}%`;
    
    if (profileStatus.completionPercentage < 50) {
      systemPrompt += `\n\nउपयोगकर्ता की प्रोफाइल अधूरी है। उत्तर देते समय, उपयोगकर्ता से अधिक जानकारी मांगें और प्रोफाइल को पूरा करने के लिए प्रोत्साहित करें। हालांकि, उनके प्रश्न का उत्तर अवश्य दें।`;
    } else if (profileStatus.completionPercentage < 80) {
      systemPrompt += `\n\nउपयोगकर्ता की प्रोफाइल आंशिक रूप से पूरी है। उत्तर देते समय, उपयोगकर्ता से अधिक विशिष्ट जानकारी मांगें जो उनके प्रश्न से संबंधित हो।`;
    }
    
    // Add instructions for interactive conversation
    systemPrompt += `\n\nमहत्वपूर्ण निर्देश:
1. उपयोगकर्ता के प्रश्न का सीधा और स्पष्ट उत्तर दें।
2. उपयोगकर्ता से संबंधित प्रश्न पूछें जो उनके मूल प्रश्न से जुड़े हों।
3. भारतीय वित्तीय बाजार और नियमों के संदर्भ में उत्तर दें।
4. जटिल वित्तीय अवधारणाओं को सरल भाषा में समझाएं।
5. उपयोगकर्ता के साथ संवाद करें जैसे आप एक वास्तविक वित्तीय सलाहकार हों।`;
    
    // Add specialized instructions based on query type
    if (isSmartInvestmentQuery) {
      systemPrompt += `\n\nस्मार्ट निवेश सलाहकार के रूप में:
1. उपयोगकर्ता के प्रोफाइल, व्यवहार, लक्ष्यों और समान क्षेत्र में रहने वाले अन्य लोगों के रुझानों के आधार पर सर्वोत्तम निवेश विकल्प सुझाएं।
2. SIP, म्यूचुअल फंड, स्टॉक, सोना, रियल एस्टेट, क्रिप्टो आदि विभिन्न निवेश विकल्पों के बारे में जानकारी दें।
3. हर सिफारिश के साथ "यह सिफारिश क्यों?" समझाएं - अपनी सलाह के पीछे के कारण बताएं।
4. उपयोगकर्ता के जोखिम प्रोफाइल और वित्तीय लक्ष्यों के अनुसार व्यक्तिगत सिफारिशें दें।`;
    }
    
    if (isGoalBasedPlanningQuery) {
      systemPrompt += `\n\nलक्ष्य-आधारित योजना के लिए:
1. उपयोगकर्ता के वित्तीय लक्ष्यों (जैसे घर खरीदना, बच्चों की शिक्षा, सेवानिवृत्ति) के बारे में पूछें और उन्हें स्पष्ट रूप से परिभाषित करने में मदद करें।
2. लक्ष्य प्राप्ति का प्रतिशत और आवश्यक मासिक योगदान के बारे में जानकारी दें।
3. लक्ष्य से विचलन या बेहतर विकल्पों के बारे में सलाह दें।
4. समय सीमा और आवश्यक धनराशि के आधार पर लक्ष्य प्राप्ति के लिए योजना बनाने में मदद करें।`;
    }
    
    if (isPeerComparisonQuery) {
      systemPrompt += `\n\nपीयर कंपैरिज़न एनालिटिक्स के लिए:
1. "आपके शहर, पेशे, आय सीमा में अन्य लोग कैसे निवेश कर रहे हैं" इस बारे में जानकारी दें।
2. गुमनाम डेटा के आधार पर हीटमैप और अंतर्दृष्टि प्रदान करें।
3. उपयोगकर्ता के समान प्रोफाइल वाले लोगों के निवेश पैटर्न के बारे में बताएं।
4. उपयोगकर्ता के निवेश पैटर्न की तुलना उनके समकक्षों से करें और सुधार के सुझाव दें।`;
    }
    
    if (isFinancialHealthQuery) {
      systemPrompt += `\n\nवित्तीय स्वास्थ्य स्कोर के लिए:
1. खर्च, बचत, आय, क्रेडिट और निवेश के आधार पर AI-जनित स्कोर के बारे में बताएं।
2. मासिक अपडेट के साथ सुधार के टिप्स प्रदान करें।
3. उपयोगकर्ता के वित्तीय स्वास्थ्य को बेहतर बनाने के लिए व्यावहारिक सुझाव दें।
4. वित्तीय स्वास्थ्य के विभिन्न पहलुओं (बचत, निवेश, ऋण प्रबंधन, आदि) पर प्रतिक्रिया दें।`;
    }
    
    // Here you would normally call an external AI API like OpenAI or a local model
    // For demonstration, we'll simulate a response
    
    // In a real implementation, you would call an AI API like this:
    /*
    const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return aiResponse.data.choices[0].message.content;
    */
    
    // Simulate AI response for now
    return simulateAIResponse(query, context, systemPrompt);
  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Simulate AI response for development purposes
 * @param {string} query - User's question
 * @param {Object} context - Context information
 * @param {string} systemPrompt - System prompt for AI
 * @returns {string} - Simulated AI response
 */
function simulateAIResponse(query, context, systemPrompt) {
  const { profileStatus, userProfile, isInvestmentRelated, isSmartInvestmentQuery, isGoalBasedPlanningQuery, isPeerComparisonQuery, isFinancialHealthQuery } = context;
  const lowerQuery = query.toLowerCase();
  
  // First check if the question is related to personal finance
  const isPersonalFinanceQuery = lowerQuery.includes('personal finance') || lowerQuery.includes('वित्तीय सलाह') || 
    lowerQuery.includes('my money') || lowerQuery.includes('मेरा पैसा') || 
    lowerQuery.includes('my income') || lowerQuery.includes('मेरी आय') || 
    lowerQuery.includes('my savings') || lowerQuery.includes('मेरी बचत') || 
    lowerQuery.includes('my investment') || lowerQuery.includes('मेरा निवेश') || 
    lowerQuery.includes('my expenses') || lowerQuery.includes('मेरे खर्च') || 
    lowerQuery.includes('financial advice') || lowerQuery.includes('वित्तीय सलाह') ||
    lowerQuery.includes('money management') || lowerQuery.includes('पैसों का प्रबंधन') || 
    lowerQuery.includes('budget') || lowerQuery.includes('बजट') || 
    lowerQuery.includes('expenses') || lowerQuery.includes('खर्च') ||
    lowerQuery.includes('debt') || lowerQuery.includes('कर्ज') || 
    lowerQuery.includes('loan') || lowerQuery.includes('ऋण') ||
    lowerQuery.includes('savings') || lowerQuery.includes('बचत') || 
    lowerQuery.includes('investment') || lowerQuery.includes('निवेश') || 
    lowerQuery.includes('financial planning') || lowerQuery.includes('वित्तीय योजना') ||
    lowerQuery.includes('financial goals') || lowerQuery.includes('वित्तीय लक्ष्य') || 
    lowerQuery.includes('saving money') || lowerQuery.includes('पैसे बचाना') || isInvestmentRelated;
    
  // Answer personal finance questions based on profile completeness
  if (isPersonalFinanceQuery) {
    // Profile is incomplete
    if (profileStatus.completionPercentage < 50) {
      let response = `To answer your question about personal finance, I need more information in your profile.\n\n`;
      response += `Currently, your profile is ${profileStatus.completionPercentage}% complete. For better financial advice, please complete your profile.\n\n`;
      response += `However, I can give you a general answer to your question:\n\n`;
      
      // Provide general answers based on query type
      if (isSmartInvestmentQuery) {
        response += `For investments, you should choose options based on your risk appetite, investment timeline, and financial goals. Common options include mutual funds, stocks, bonds, and fixed deposits.`;
      } else if (isGoalBasedPlanningQuery) {
        response += `For goal-based planning, you should clearly define your goals, set a timeline, and then create a regular savings and investment plan to achieve those goals.`;
      } else if (isPeerComparisonQuery) {
        response += `To compare with your peers, we need information like your age, income, location, and occupation. This will help us tell you how people like you are investing.`;
      } else if (isFinancialHealthQuery) {
        response += `To calculate a financial health score, we need information about your income, expenses, savings, investments, and debts. This will allow us to provide you with an assessment of your overall financial situation.`;
      } else {
        response += `Personal finance management includes creating a budget, building an emergency fund, managing debt, investing, and planning for the future.`;
      }
      
      response += `\n\nWould you like to update your profile to receive more personalized advice?`;
      return response;
    }
    // Profile is partially complete
     else if (profileStatus.completionPercentage < 80) {
       let response = `Based on your question about personal finance, I can give you some advice.\n\n`;
       response += `However, your profile is currently ${profileStatus.completionPercentage}% complete. For more personalized and accurate advice, please complete your profile.\n\n`;
       
       // Provide more personalized answers based on available profile information
       if (userProfile) {
         response += `Based on your current information:\n`;
         if (userProfile.age) response += `- Your age is ${userProfile.age} years\n`;
         if (userProfile.income) response += `- Your income is ₹${userProfile.income} per year\n`;
         if (userProfile.riskAppetite) response += `- Your risk appetite is ${userProfile.riskAppetite}\n`;
         if (userProfile.goals && userProfile.goals.length > 0) response += `- Your financial goals: ${userProfile.goals.join(', ')}\n`;
         response += `\n`;
       }
       
       // Provide more specific answers based on query type
       if (isSmartInvestmentQuery || isGoalBasedPlanningQuery || isPeerComparisonQuery || isFinancialHealthQuery) {
         // Use existing logic for these queries - proceed to the existing code below
       } else {
         response += `For personal finance management, I suggest the following:\n\n`;
         response += `1. Aim to save at least 20% of your income\n`;
         response += `2. Build an emergency fund equal to 3-6 months of expenses\n`;
         response += `3. Track your expenses and create a budget\n`;
         response += `4. Invest according to your risk profile\n`;
         response += `5. Regularly review your financial situation\n\n`;
       }
       
       response += `What additional information would you like to add to your profile?`;
       return response;
     }
     // Profile is complete - provide detailed personalized advice
     else {
       // If the query is of a specific type, use existing logic
       if (isSmartInvestmentQuery || isGoalBasedPlanningQuery || isPeerComparisonQuery || isFinancialHealthQuery) {
         // Proceed to the existing code below
       } else {
         // Detailed advice for personal finance
         let response = `Based on your question about personal finance, I can give you detailed advice.\n\n`;
         
         // Provide personalized answers based on available profile information
         if (userProfile) {
           response += `According to your profile:\n`;
           if (userProfile.age) {
             const ageGroup = userProfile.age < 30 ? 'young' : userProfile.age < 50 ? 'middle-aged' : 'senior';
             response += `- As a ${ageGroup} investor, you should consider ${userProfile.age < 30 ? 'taking more risk and investing more in equity' : userProfile.age < 50 ? 'creating a balanced portfolio' : 'focusing on safe and income-generating investments'}.\n`;
           }
           
           if (userProfile.income) {
             const incomeLevel = userProfile.income < 500000 ? 'low' : userProfile.income < 1500000 ? 'medium' : 'high';
             response += `- In the ${incomeLevel} income bracket, you should ${userProfile.income < 500000 ? 'focus on savings and start with small investments' : userProfile.income < 1500000 ? 'consider tax-saving investments and mutual funds' : 'create a diverse investment portfolio and focus on tax planning'}.\n`;
           }
           
           if (userProfile.riskAppetite) {
             response += `- According to your ${userProfile.riskAppetite} risk appetite, you should invest in ${userProfile.riskAppetite === 'low' ? 'fixed deposits, PPF, and debt funds' : userProfile.riskAppetite === 'medium' ? 'hybrid funds and balanced advantage funds' : 'equity funds and stocks'}.\n`;
           }
           
           if (userProfile.goals && userProfile.goals.length > 0) {
             response += `- For your financial goals (${userProfile.goals.join(', ')}), you should create a separate investment plan for each goal.\n`;
           }
           response += `\n`;
         }
         
         response += `Special suggestions for your personal finance management:\n\n`;
         response += `1. Follow the 50-30-20 rule for your income: 50% on needs, 30% on wants, and 20% on savings and investments.\n`;
         response += `2. Use a budget app to track your expenses.\n`;
         response += `3. Plan to pay off all your debts in order of priority.\n`;
         response += `4. Regularly review your investment portfolio and adjust as needed.\n`;
         response += `5. Track the progress of your financial goals and update your plan.\n\n`;
         
         response += `Would you like more specific information about your financial goals or investment plan?`;
         return response;
       }
     }
   }
  
  // Smart Investment Advisor responses
  if (isSmartInvestmentQuery || lowerQuery.includes('investment options') || lowerQuery.includes('best investment') || lowerQuery.includes('investment options') || lowerQuery.includes('best investment')) {
    let response = `Based on your profile, I suggest the following investment options for you:\n\n`;
    
    // Personalize based on risk appetite if available
    if (userProfile?.riskAppetite) {
      if (userProfile.riskAppetite === 'low') {
        response += `1. Fixed Deposits (FD): For safe and stable returns.\n2. Public Provident Fund (PPF): Long-term savings with tax benefits.\n3. Debt Mutual Funds: Low-risk investment options.\n\n**Why this recommendation?** Your risk profile is low, so these options are suitable for you.`;
      } else if (userProfile.riskAppetite === 'medium') {
        response += `1. Hybrid Mutual Funds: For balanced risk and returns.\n2. Index Funds: To track market performance.\n3. Balanced Advantage Funds: A mix of equity and debt.\n\n**Why this recommendation?** Your risk profile is medium, so these options provide a balanced approach for you.`;
      } else if (userProfile.riskAppetite === 'high') {
        response += `1. Equity Mutual Funds: For high returns.\n2. Small Cap and Mid Cap Funds: Higher risk, higher potential returns.\n3. Sector Specific Funds: Investing in specific industries.\n\n**Why this recommendation?** Your risk profile is high, so these options offer higher return potential for you.`;
      }
    } else {
      response += `1. SIP (Systematic Investment Plan): For regular investments.\n2. Mutual Funds: For a diverse portfolio.\n3. Index Funds: Low-cost investment options.\n\n**Why this recommendation?** These options are suitable for most investors and provide diversification.`;
    }
    
    // Add follow-up questions
    response += `\n\nCan you provide more information about your investment goals and timeline? How comfortable are you with risk?`;
    
    return response;
  }
  
  // Goal-Based Planning responses
  if (isGoalBasedPlanningQuery || lowerQuery.includes('goal') || lowerQuery.includes('planning') || lowerQuery.includes('goal') || lowerQuery.includes('planning')) {
    let response = `Goal-based financial planning helps you achieve your financial goals.\n\n`;
    
    // Personalize based on goals if available
    if (userProfile?.goals && userProfile.goals.length > 0) {
      response += `Your current goals are: ${userProfile.goals.join(', ')}.

`;
      response += `To achieve these goals, you can take the following steps:
1. Set a timeline for each goal.
2. Calculate the required amount.
3. Create a regular savings and investment plan.
4. Track your progress regularly.`;
    } else {
        response += `You can define your financial goals in the following way:
1. "I want to buy a house in 5 years"
2. "I want to save for my children's higher education"
3. "I want to accumulate X rupees for retirement by age 60"`;
    }
    
    // Add follow-up questions
    response += `

Can you provide more details about your financial goals? How soon do you want to achieve them?`;
    
    return response;
  }
  
  // Peer Comparison Analytics responses
  if (isPeerComparisonQuery || lowerQuery.includes('peer') || lowerQuery.includes('comparison') || lowerQuery.includes('others investing') || lowerQuery.includes('others') || lowerQuery.includes('comparison')) {
    let response = `Peer Comparison Analytics helps you understand how people with similar profiles to yours are investing.\n\n`;
    
    // Personalize based on demographic info if available
    if (userProfile?.onboardingData?.demographic?.location || userProfile?.onboardingData?.demographic?.occupation) {
      response += `Investment patterns of people with similar profiles (${userProfile?.onboardingData?.demographic?.location || ''} ${userProfile?.onboardingData?.demographic?.occupation || ''}):\n\n`;
      response += `1. 40% of people invest in equity mutual funds.\n2. 30% of people invest in hybrid funds.\n3. 20% of people invest in fixed deposits and PPF.\n4. 10% of people invest directly in the stock market.`;
    } else {
      response += `General investment patterns of investors like you:\n\n`;
      response += `1. 35% investment in mutual funds\n2. 25% investment in fixed income options\n3. 20% investment in equity\n4. 10% investment in real estate\n5. 10% investment in gold and other options`;
    }
    
    // Add follow-up questions
    response += `\n\nWould you like to provide more information about your current investment pattern? This will help me compare your investments with your peers.`;
    
    return response;
  }
  
  // Financial Health Score responses
  if (isFinancialHealthQuery || lowerQuery.includes('financial health') || lowerQuery.includes('score') || lowerQuery.includes('financial health') || lowerQuery.includes('score')) {
    let response = `Financial Health Score assesses your overall financial situation.\n\n`;
    
    // Personalize based on profile completeness
    if (profileStatus.completionPercentage >= 80) {
      const randomScore = Math.floor(Math.random() * 30) + 70; // Generate a random score between 70-100 for demo
      response += `Your current Financial Health Score: ${randomScore}/100\n\n`;
      response += `This score is based on the following factors:\n1. Income and expense ratio\n2. Savings rate\n3. Investment diversification\n4. Debt management\n5. Emergency fund\n\nSuggestions for improvement:\n1. Increase your savings rate\n2. Diversify your investment portfolio\n3. Reduce unnecessary expenses`;
    } else {
      response += `To calculate a Financial Health Score, we need more information in your profile.\n\nPlease provide the following information:\n1. Monthly income\n2. Monthly expenses\n3. Current savings\n4. Current investments\n5. Debt details (if any)`;
    }
    
    // Add follow-up questions
    response += `\n\nWould you like to provide more details about your current financial situation? This will help me provide you with a more accurate Financial Health Score and suggestions for improvement.`;
    
    return response;
  }
  
  // Basic response templates based on query type
  if (lowerQuery.includes('sip') || lowerQuery.includes('systematic investment plan')) {
    return `SIP (Systematic Investment Plan) is an investment method where you invest a fixed amount at regular intervals.\n\nBenefits of SIP for you:\n1. Habit of regular investment\n2. Benefit of rupee-cost averaging\n3. Power of compounding\n\nCan you tell me how much you want to invest and what your investment goal is?`;
  }
  
  if (lowerQuery.includes('mutual fund') || lowerQuery.includes('mutual fund')) {
    return `A mutual fund is an investment vehicle that pools money from many investors and invests in various securities.\n\nTypes of mutual funds:\n1. Equity funds\n2. Debt funds\n3. Hybrid funds\n\nBased on your risk profile and investment goals, I can suggest appropriate funds. Can you provide more information about your investment goals and timeline?`;
  }
  
  if (lowerQuery.includes('stock') || lowerQuery.includes('share') || lowerQuery.includes('share')) {
    return `Investing in the stock market can be a good option, but it also involves risk.\n\nBasic principles for investing in the stock market:\n1. Do your research\n2. Diversify\n3. Think long-term\n\nHave you ever invested in the stock market before? What types of industries or companies are you interested in?`;
  }
  
  if (lowerQuery.includes('tax') || lowerQuery.includes('tax')) {
    return `There are many investment options for tax saving in India.\n\nTax saving options under Section 80C:\n1. PPF (Public Provident Fund)\n2. ELSS (Equity Linked Saving Scheme)\n3. Tax Saving FD\n\nCan you provide more information about your current income and tax slab?`;
  }
  
  if (lowerQuery.includes('insurance') || lowerQuery.includes('insurance')) {
    return `Insurance is an important part of financial security.\n\nTypes of insurance:\n1. Life insurance\n2. Health insurance\n3. Motor insurance\n4. Property insurance\n\nBased on your age and family situation, I can suggest appropriate insurance coverage. Do you currently have any insurance policies?`;
  }
  
  // Default response for other queries
  return `Thank you for your question. I'm here to help you on your financial journey.\n\nCan you provide more details about your financial goals? This will help me give you better advice.`;
}

module.exports = {
  generateAIResponse
};