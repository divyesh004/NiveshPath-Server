/**
 * Mistral API त्रुटि प्रबंधन उपयोगिता
 * 
 * यह फ़ाइल Mistral API के साथ एकीकरण के लिए उन्नत त्रुटि प्रबंधन प्रदान करती है।
 * इसमें विभिन्न प्रकार की त्रुटियों के लिए विशिष्ट संदेश और फॉलबैक प्रतिक्रियाएं शामिल हैं।
 */

// त्रुटि प्रकारों के लिए कॉन्स्टेंट्स
const ERROR_TYPES = {
  RATE_LIMIT: 'RATE_LIMIT',
  AUTH_ERROR: 'AUTH_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Mistral API त्रुटि का विश्लेषण करता है और उचित त्रुटि प्रकार निर्धारित करता है
 * @param {Error} error - API कॉल से प्राप्त त्रुटि
 * @returns {string} त्रुटि प्रकार
 */
const determineErrorType = (error) => {
  if (error.response?.status === 429) {
    return ERROR_TYPES.RATE_LIMIT;
  } else if (error.response?.status === 401 || error.response?.status === 403) {
    return ERROR_TYPES.AUTH_ERROR;
  } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  } else if (error.response?.status >= 500) {
    return ERROR_TYPES.SERVER_ERROR;
  } else if (!error.response?.data || !error.response?.data.choices) {
    return ERROR_TYPES.INVALID_RESPONSE;
  } else {
    return ERROR_TYPES.UNKNOWN;
  }
};

/**
 * त्रुटि प्रकार के आधार पर उपयुक्त त्रुटि संदेश प्रदान करता है
 * @param {string} errorType - त्रुटि प्रकार
 * @param {string} language - उपयोगकर्ता की भाषा (hindi या english)
 * @returns {string} उपयोगकर्ता के लिए त्रुटि संदेश
 */
const getErrorMessage = (errorType, language = 'hindi') => {
  const messages = {
    [ERROR_TYPES.RATE_LIMIT]: {
      hindi: 'अत्यधिक अनुरोधों के कारण सेवा अस्थायी रूप से अनुपलब्ध है। कृपया कुछ मिनट बाद पुनः प्रयास करें।',
      english: 'Service temporarily unavailable due to high request volume. Please try again in a few minutes.'
    },
    [ERROR_TYPES.AUTH_ERROR]: {
      hindi: 'प्रमाणीकरण त्रुटि। कृपया सिस्टम व्यवस्थापक से संपर्क करें।',
      english: 'Authentication error. Please contact the system administrator.'
    },
    [ERROR_TYPES.TIMEOUT]: {
      hindi: 'सर्वर प्रतिक्रिया में देरी हो रही है। कृपया अपना प्रश्न संक्षिप्त करें या कुछ देर बाद पुनः प्रयास करें।',
      english: 'Server response delayed. Please shorten your query or try again later.'
    },
    [ERROR_TYPES.SERVER_ERROR]: {
      hindi: 'AI सेवा में तकनीकी समस्या है। हमारी टीम इस पर काम कर रही है। कृपया कुछ देर बाद पुनः प्रयास करें।',
      english: 'Technical issue with the AI service. Our team is working on it. Please try again later.'
    },
    [ERROR_TYPES.INVALID_RESPONSE]: {
      hindi: 'अमान्य प्रतिक्रिया प्राप्त हुई। कृपया कुछ देर बाद पुनः प्रयास करें।',
      english: 'Invalid response received. Please try again later.'
    },
    [ERROR_TYPES.UNKNOWN]: {
      hindi: 'मुझे खेद है, मैं अभी आपके प्रश्न का उत्तर नहीं दे पा रहा हूँ। कृपया कुछ देर बाद पुनः प्रयास करें।',
      english: 'I apologize, I cannot answer your question right now. Please try again later.'
    }
  };

  return messages[errorType][language] || messages[ERROR_TYPES.UNKNOWN][language];
};

/**
 * त्रुटि प्रकार के आधार पर फॉलबैक प्रतिक्रिया प्रदान करता है
 * @param {string} errorType - त्रुटि प्रकार
 * @param {string} query - उपयोगकर्ता का मूल प्रश्न
 * @param {string} language - उपयोगकर्ता की भाषा (hindi या english)
 * @returns {Object} फॉलबैक प्रतिक्रिया ऑब्जेक्ट
 */
const getFallbackResponse = (errorType, query, language = 'hindi') => {
  const errorMessage = getErrorMessage(errorType, language);
  
  // बुनियादी फॉलबैक प्रतिक्रिया
  const fallbackResponse = {
    text: errorMessage,
    fallback: true,
    errorType: errorType
  };
  
  // त्रुटि प्रकार के आधार पर अतिरिक्त जानकारी जोड़ें
  if (errorType === ERROR_TYPES.RATE_LIMIT) {
    fallbackResponse.retryAfter = 60; // सुझाव दें कि 60 सेकंड बाद पुनः प्रयास करें
  } else if (errorType === ERROR_TYPES.TIMEOUT) {
    fallbackResponse.suggestion = language === 'hindi' ? 
      'अपने प्रश्न को छोटा करके पुनः प्रयास करें' : 
      'Try again with a shorter query';
  }
  
  // वित्तीय प्रश्नों के लिए सामान्य फॉलबैक जानकारी जोड़ें
  if (isFinancialQuery(query)) {
    fallbackResponse.generalInfo = getGeneralFinancialInfo(query, language);
  }
  
  return fallbackResponse;
};

/**
 * जांचता है कि क्या प्रश्न वित्तीय प्रकृति का है
 * @param {string} query - उपयोगकर्ता का प्रश्न
 * @returns {boolean} क्या प्रश्न वित्तीय है
 */
const isFinancialQuery = (query) => {
  const financialKeywords = [
    // अंग्रेजी कीवर्ड
    'invest', 'stock', 'mutual fund', 'sip', 'tax', 'budget', 'saving', 'finance',
    'insurance', 'loan', 'interest', 'emi', 'return', 'portfolio', 'equity', 'debt',
    // हिंदी कीवर्ड
    'निवेश', 'शेयर', 'म्यूचुअल फंड', 'एसआईपी', 'कर', 'बजट', 'बचत', 'वित्त',
    'बीमा', 'ऋण', 'ब्याज', 'ईएमआई', 'रिटर्न', 'पोर्टफोलियो', 'इक्विटी', 'डेट'
  ];
  
  return financialKeywords.some(keyword => query.toLowerCase().includes(keyword));
};

/**
 * वित्तीय प्रश्नों के लिए सामान्य जानकारी प्रदान करता है
 * @param {string} query - उपयोगकर्ता का प्रश्न
 * @param {string} language - उपयोगकर्ता की भाषा (hindi या english)
 * @returns {string} सामान्य वित्तीय जानकारी
 */
const getGeneralFinancialInfo = (query, language) => {
  // SIP से संबंधित प्रश्न
  if (query.toLowerCase().includes('sip') || query.toLowerCase().includes('एसआईपी')) {
    return language === 'hindi' ?
      'SIP (सिस्टमैटिक इन्वेस्टमेंट प्लान) एक निवेश विधि है जिसमें आप नियमित अंतराल पर एक निश्चित राशि का निवेश करते हैं। यह लंबी अवधि में संपत्ति निर्माण के लिए एक प्रभावी तरीका है।' :
      'SIP (Systematic Investment Plan) is an investment method where you invest a fixed amount at regular intervals. It is an effective way to build wealth over the long term.';
  }
  
  // म्यूचुअल फंड से संबंधित प्रश्न
  else if (query.toLowerCase().includes('mutual fund') || query.toLowerCase().includes('म्यूचुअल फंड')) {
    return language === 'hindi' ?
      'म्यूचुअल फंड एक निवेश वाहन है जो कई निवेशकों से धन एकत्र करता है और विभिन्न प्रतिभूतियों में निवेश करता है। ये फंड पेशेवर रूप से प्रबंधित होते हैं और विविधीकरण प्रदान करते हैं।' :
      'A mutual fund is an investment vehicle that pools money from many investors and invests in various securities. These funds are professionally managed and provide diversification.';
  }
  
  // कर से संबंधित प्रश्न
  else if (query.toLowerCase().includes('tax') || query.toLowerCase().includes('कर')) {
    return language === 'hindi' ?
      'भारत में, आयकर विभिन्न स्लैब दरों पर लगाया जाता है। कर बचत के लिए, आप धारा 80C, 80D, और NPS जैसे विकल्पों का उपयोग कर सकते हैं।' :
      'In India, income tax is levied at various slab rates. For tax savings, you can use options like Section 80C, 80D, and NPS.';
  }
  
  // सामान्य वित्तीय सलाह
  else {
    return language === 'hindi' ?
      'वित्तीय योजना के लिए, आपातकालीन फंड बनाना, बीमा लेना, निवेश करना और कर योजना बनाना महत्वपूर्ण है। अधिक विशिष्ट सलाह के लिए, कृपया बाद में पुनः प्रयास करें।' :
      'For financial planning, it is important to create an emergency fund, get insurance, invest, and plan for taxes. For more specific advice, please try again later.';
  }
};

/**
 * त्रुटि का विस्तृत लॉगिंग करता है
 * @param {Error} error - API कॉल से प्राप्त त्रुटि
 * @param {string} query - उपयोगकर्ता का प्रश्न
 */
const logDetailedError = (error, query) => {
  console.error('Mistral API error:', {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url,
    query: query.substring(0, 100) + (query.length > 100 ? '...' : ''), // प्रश्न का संक्षिप्त रूप लॉग करें
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  ERROR_TYPES,
  determineErrorType,
  getErrorMessage,
  getFallbackResponse,
  isFinancialQuery,
  getGeneralFinancialInfo,
  logDetailedError
};