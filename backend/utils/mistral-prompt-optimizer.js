/**
 * Mistral API प्रॉम्प्ट अनुकूलन उपयोगिता
 * 
 * यह फ़ाइल Mistral API के साथ एकीकरण के लिए प्रॉम्प्ट अनुकूलन और प्रदर्शन सुधार प्रदान करती है।
 * इसमें प्रॉम्प्ट को छोटा करने, टोकन उपयोग को कम करने और प्रतिक्रिया गुणवत्ता को बेहतर बनाने के लिए विधियां शामिल हैं।
 */

/**
 * उपयोगकर्ता प्रोफाइल से प्रासंगिक जानकारी निकालता है
 * @param {Object} userProfile - उपयोगकर्ता प्रोफाइल ऑब्जेक्ट
 * @returns {Object} प्रासंगिक प्रोफाइल जानकारी
 */
const extractRelevantProfileInfo = (userProfile) => {
  // यदि प्रोफाइल उपलब्ध नहीं है, तो खाली ऑब्जेक्ट लौटाएं
  if (!userProfile) return {};
  
  // केवल प्रासंगिक फ़ील्ड निकालें
  const {
    name,
    age,
    income,
    riskProfile,
    location,
    investmentHorizon,
    financialGoals
  } = userProfile;
  
  const relevantInfo = {};
  
  // केवल उपलब्ध फ़ील्ड जोड़ें
  if (name) relevantInfo.name = name;
  if (age) relevantInfo.age = age;
  if (income) relevantInfo.income = income;
  if (riskProfile) relevantInfo.riskProfile = riskProfile;
  if (location) relevantInfo.location = location;
  if (investmentHorizon) relevantInfo.investmentHorizon = investmentHorizon;
  
  // वित्तीय लक्ष्यों को संक्षिप्त करें
  if (financialGoals && Array.isArray(financialGoals)) {
    relevantInfo.financialGoals = financialGoals.map(goal => ({
      type: goal.type,
      priority: goal.priority
    }));
  }
  
  return relevantInfo;
};

/**
 * प्रश्न की प्रकृति का विश्लेषण करता है
 * @param {string} query - उपयोगकर्ता का प्रश्न
 * @returns {Object} प्रश्न विश्लेषण
 */
const analyzeQueryType = (query) => {
  const queryLower = query.toLowerCase();
  
  // प्रश्न प्रकार का पता लगाएं
  const isInvestmentQuery = [
    'invest', 'stock', 'mutual fund', 'sip', 'equity', 'bond',
    'निवेश', 'शेयर', 'म्यूचुअल फंड', 'एसआईपी', 'इक्विटी'
  ].some(keyword => queryLower.includes(keyword));
  
  const isTaxQuery = [
    'tax', 'section 80c', 'deduction', 'exemption',
    'कर', 'धारा 80c', 'कटौती', 'छूट'
  ].some(keyword => queryLower.includes(keyword));
  
  const isInsuranceQuery = [
    'insurance', 'policy', 'premium', 'cover', 'claim',
    'बीमा', 'पॉलिसी', 'प्रीमियम', 'कवर', 'दावा'
  ].some(keyword => queryLower.includes(keyword));
  
  const isRetirementQuery = [
    'retirement', 'pension', 'senior citizen', 'old age',
    'सेवानिवृत्ति', 'पेंशन', 'वरिष्ठ नागरिक', 'बुढ़ापा'
  ].some(keyword => queryLower.includes(keyword));
  
  // भाषा का पता लगाएं
  const isHindiQuery = /[\u0900-\u097F]/.test(query); // हिंदी यूनिकोड वर्णों की जांच करें
  
  return {
    isInvestmentQuery,
    isTaxQuery,
    isInsuranceQuery,
    isRetirementQuery,
    isHindiQuery,
    language: isHindiQuery ? 'hindi' : 'english'
  };
};

/**
 * प्रश्न प्रकार के आधार पर प्रॉम्प्ट अनुकूलित करता है
 * @param {string} query - उपयोगकर्ता का प्रश्न
 * @param {Object} queryAnalysis - प्रश्न विश्लेषण
 * @param {Object} relevantProfile - प्रासंगिक प्रोफाइल जानकारी
 * @returns {string} अनुकूलित प्रॉम्प्ट
 */
const optimizePrompt = (query, queryAnalysis, relevantProfile) => {
  const { language, isInvestmentQuery, isTaxQuery, isInsuranceQuery, isRetirementQuery } = queryAnalysis;
  
  // भाषा निर्देश जोड़ें
  let optimizedPrompt = query + ' ';
  
  // भाषा निर्देश जोड़ें
  if (language === 'hindi') {
    optimizedPrompt += '(कृपया हिंदी में उत्तर दें। उत्तर में भारतीय वित्तीय शब्दावली का सटीक उपयोग करें।) ';
  } else {
    optimizedPrompt += '(Please respond in English. Use precise Indian financial terminology in your response.) ';
  }
  
  // प्रश्न प्रकार के आधार पर विशिष्ट निर्देश जोड़ें
  if (isInvestmentQuery) {
    optimizedPrompt += language === 'hindi' ?
      '(यह निवेश से संबंधित प्रश्न है। कृपया विशिष्ट निवेश विकल्प, जोखिम स्तर, और अनुमानित रिटर्न के बारे में जानकारी प्रदान करें।) ' :
      '(This is an investment-related query. Please provide information about specific investment options, risk levels, and expected returns.) ';
  } else if (isTaxQuery) {
    optimizedPrompt += language === 'hindi' ?
      '(यह कर से संबंधित प्रश्न है। कृपया भारतीय कर कानूनों और बचत विकल्पों के बारे में सटीक जानकारी प्रदान करें।) ' :
      '(This is a tax-related query. Please provide accurate information about Indian tax laws and saving options.) ';
  } else if (isInsuranceQuery) {
    optimizedPrompt += language === 'hindi' ?
      '(यह बीमा से संबंधित प्रश्न है। कृपया बीमा विकल्पों, कवरेज, और प्रीमियम के बारे में जानकारी प्रदान करें।) ' :
      '(This is an insurance-related query. Please provide information about insurance options, coverage, and premiums.) ';
  } else if (isRetirementQuery) {
    optimizedPrompt += language === 'hindi' ?
      '(यह सेवानिवृत्ति से संबंधित प्रश्न है। कृपया सेवानिवृत्ति योजना, पेंशन विकल्प, और वरिष्ठ नागरिकों के लिए निवेश रणनीतियों के बारे में जानकारी प्रदान करें।) ' :
      '(This is a retirement-related query. Please provide information about retirement planning, pension options, and investment strategies for senior citizens.) ';
  }
  
  // प्रतिक्रिया प्रारूपण निर्देश जोड़ें
  optimizedPrompt += language === 'hindi' ?
    '(अपने उत्तर को अच्छी तरह से संरचित करें: तालिकाओं के लिए मार्कडाउन का उपयोग करें, सूचियों के लिए बुलेट पॉइंट्स का उपयोग करें, और व्याख्याओं के लिए पैराग्राफ का उपयोग करें।) ' :
    '(Structure your response well: use markdown for tables, bullet points for lists, and paragraphs for explanations.) ';
  
  // प्रासंगिक प्रोफाइल जानकारी जोड़ें, यदि उपलब्ध है
  if (Object.keys(relevantProfile).length > 0) {
    optimizedPrompt += language === 'hindi' ?
      `(उपयोगकर्ता प्रोफाइल: ${JSON.stringify(relevantProfile, null, 0)} - इस प्रोफाइल के आधार पर व्यक्तिगत सलाह प्रदान करें।) ` :
      `(User profile: ${JSON.stringify(relevantProfile, null, 0)} - Provide personalized advice based on this profile.) `;
  }
  
  return optimizedPrompt;
};

/**
 * प्रतिक्रिया को अनुकूलित करता है
 * @param {string} response - API से प्राप्त प्रतिक्रिया
 * @param {string} language - उपयोगकर्ता की भाषा (hindi या english)
 * @returns {string} अनुकूलित प्रतिक्रिया
 */
const optimizeResponse = (response, language) => {
  if (!response) return '';
  
  // अनावश्यक स्पेस और फॉर्मेटिंग हटाएं
  let optimizedResponse = response.replace(/\n\n+/g, '\n\n').trim();
  
  // यदि प्रतिक्रिया बहुत लंबी है, तो अनावश्यक विवरण हटाएं
  if (optimizedResponse.length > 1000) {
    // पैराग्राफ में विभाजित करें
    const paragraphs = optimizedResponse.split('\n\n');
    
    // यदि बहुत सारे पैराग्राफ हैं, तो कुछ को संक्षिप्त करें
    if (paragraphs.length > 5) {
      // पहले 2 और अंतिम 2 पैराग्राफ रखें, बीच के पैराग्राफ संक्षिप्त करें
      const summarizedMiddle = language === 'hindi' ?
        '\n\n[अधिक विस्तृत जानकारी...]\n\n' :
        '\n\n[More detailed information...]\n\n';
      
      optimizedResponse = [...paragraphs.slice(0, 2), summarizedMiddle, ...paragraphs.slice(-2)].join('\n\n');
    }
  }
  
  return optimizedResponse;
};

/**
 * प्रॉम्प्ट में उपयोगकर्ता प्रोफाइल जानकारी को अनुकूलित करता है
 * @param {string} systemPrompt - मूल सिस्टम प्रॉम्प्ट
 * @param {Object} userProfile - उपयोगकर्ता प्रोफाइल
 * @param {Object} queryAnalysis - प्रश्न विश्लेषण
 * @returns {string} अनुकूलित सिस्टम प्रॉम्प्ट
 */
const optimizeSystemPrompt = (systemPrompt, userProfile, queryAnalysis) => {
  // यदि प्रॉम्प्ट बहुत लंबा है, तो इसे छोटा करें
  if (systemPrompt.length > 1000) {
    // मूल प्रॉम्प्ट का पहला हिस्सा रखें
    const firstPart = systemPrompt.substring(0, 500);
    
    // प्रश्न प्रकार के आधार पर प्रासंगिक निर्देश जोड़ें
    let relevantInstructions = '';
    
    if (queryAnalysis.isInvestmentQuery) {
      relevantInstructions = 'INVESTMENT FOCUS: Provide specific investment advice based on user profile, risk tolerance, and market conditions. Use precise financial terminology for mutual funds, stocks, and other investment vehicles.';
    } else if (queryAnalysis.isTaxQuery) {
      relevantInstructions = 'TAX FOCUS: Provide accurate information about Indian tax laws, deductions, and exemptions. Reference specific sections of the Income Tax Act when applicable.';
    } else if (queryAnalysis.isInsuranceQuery) {
      relevantInstructions = 'INSURANCE FOCUS: Provide information about insurance products, coverage options, and premium considerations based on user profile and needs.';
    } else if (queryAnalysis.isRetirementQuery) {
      relevantInstructions = 'RETIREMENT FOCUS: Provide retirement planning advice, pension options, and investment strategies suitable for senior citizens or retirement planning.';
    }
    
    // भाषा निर्देश जोड़ें
    const languageInstructions = queryAnalysis.isHindiQuery ?
      'LANGUAGE: Respond in Hindi using natural conversational language. Use precise Hindi financial terminology.' :
      'LANGUAGE: Respond in English using precise financial terminology appropriate for Indian markets.';
    
    // प्रोफाइल जानकारी जोड़ें, यदि उपलब्ध है
    let profileInstructions = '';
    if (userProfile) {
      const { age, income, riskProfile } = userProfile;
      if (age || income || riskProfile) {
        profileInstructions = `USER PROFILE: ${age ? 'Age: ' + age + ', ' : ''}${income ? 'Income: ₹' + income + ', ' : ''}${riskProfile ? 'Risk Profile: ' + riskProfile : ''}`;
      }
    }
    
    // अनुकूलित प्रॉम्प्ट बनाएं
    return `${firstPart}\n\n${relevantInstructions}\n\n${languageInstructions}\n\n${profileInstructions}`;
  }
  
  // यदि प्रॉम्प्ट पहले से ही छोटा है, तो इसे वापस लौटाएं
  return systemPrompt;
};

/**
 * प्रश्न के आधार पर कैशिंग कुंजी बनाता है
 * @param {string} query - उपयोगकर्ता का प्रश्न
 * @returns {string} कैशिंग कुंजी
 */
const generateCacheKey = (query) => {
  // प्रश्न को सामान्यीकृत करें
  const normalizedQuery = query.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // सामान्य वित्तीय प्रश्नों के लिए कैश कुंजी बनाएं
  if (normalizedQuery.includes('sip') || normalizedQuery.includes('एसआईपी')) {
    return 'sip_explanation';
  } else if (normalizedQuery.includes('mutual fund') || normalizedQuery.includes('म्यूचुअल फंड')) {
    return 'mutual_fund_explanation';
  } else if (normalizedQuery.includes('tax saving') || normalizedQuery.includes('कर बचत')) {
    return 'tax_saving_options';
  } else if (normalizedQuery.includes('emergency fund') || normalizedQuery.includes('आपातकालीन फंड')) {
    return 'emergency_fund_explanation';
  }
  
  // यदि सामान्य प्रश्न नहीं है, तो प्रश्न का हैश बनाएं
  return 'query_' + normalizedQuery.split(' ').slice(0, 5).join('_');
};

module.exports = {
  extractRelevantProfileInfo,
  analyzeQueryType,
  optimizePrompt,
  optimizeResponse,
  optimizeSystemPrompt,
  generateCacheKey
};