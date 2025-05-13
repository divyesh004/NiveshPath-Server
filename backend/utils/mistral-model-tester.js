/**
 * Mistral मॉडल परीक्षण उपयोगिता
 * 
 * यह फ़ाइल विभिन्न Mistral AI मॉडलों के प्रदर्शन और लागत का तुलनात्मक विश्लेषण करने के लिए उपयोगिता प्रदान करती है।
 * इसका उपयोग NiveshPath के लिए सबसे उपयुक्त मॉडल का चयन करने में मदद करने के लिए किया जा सकता है।
 */

const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const { performance } = require('perf_hooks');

// परीक्षण के लिए उपलब्ध मॉडल
const AVAILABLE_MODELS = [
  'mistral-tiny',
  'mistral-small',
  'mistral-medium',
  'mistral-large'
];

// परीक्षण परिदृश्य
const TEST_SCENARIOS = {
  BASIC_FINANCE: 'बुनियादी वित्तीय प्रश्न',
  INVESTMENT_ADVICE: 'निवेश सलाह',
  PERSONAL_FINANCE: 'व्यक्तिगत वित्तीय योजना',
  TAX_PLANNING: 'कर योजना',
  BILINGUAL: 'द्विभाषी क्षमता'
};

// परीक्षण प्रश्न
const TEST_QUERIES = {
  [TEST_SCENARIOS.BASIC_FINANCE]: [
    'म्यूचुअल फंड क्या होते हैं?',
    'What is the difference between equity and debt?',
    'SIP का क्या मतलब है और यह कैसे काम करता है?',
    'Explain the concept of compound interest.',
    'भारत में PPF क्या है और इसके क्या लाभ हैं?'
  ],
  [TEST_SCENARIOS.INVESTMENT_ADVICE]: [
    'क्या मुझे स्टॉक्स में निवेश करना चाहिए या म्यूचुअल फंड्स में?',
    'How should I diversify my investment portfolio?',
    'मेरे पास 10 लाख रुपये हैं, मुझे इसका निवेश कैसे करना चाहिए?',
    'What are the best tax-saving investment options in India?',
    'क्या अभी सोने में निवेश करना अच्छा है?'
  ],
  [TEST_SCENARIOS.PERSONAL_FINANCE]: [
    'मैं 30 साल का हूं और IT सेक्टर में काम करता हूं। मुझे अपनी वित्तीय योजना कैसे बनानी चाहिए?',
    'I am planning to buy a house. How should I plan my finances?',
    'मेरी शादी के लिए मुझे कितना पैसा बचाना चाहिए और कैसे?',
    'How can I plan for my child\'s education expenses?',
    'मैं 45 साल का हूं और अभी तक रिटायरमेंट प्लानिंग नहीं की है। मुझे क्या करना चाहिए?'
  ],
  [TEST_SCENARIOS.TAX_PLANNING]: [
    'सेक्शन 80C के तहत कौन से निवेश विकल्प उपलब्ध हैं?',
    'How can I reduce my income tax liability?',
    'क्या ELSS फंड्स में निवेश करना अच्छा है?',
    'Explain the tax implications of selling property in India.',
    'NPS में निवेश करने के क्या टैक्स बेनिफिट्स हैं?'
  ],
  [TEST_SCENARIOS.BILINGUAL]: [
    'मुझे हिंदी में बताएं कि SIP क्या है और अंग्रेजी में बताएं कि इसके क्या फायदे हैं?',
    'Explain mutual funds in English and then explain the same in Hindi.',
    'मुझे अंग्रेजी और हिंदी दोनों में बताएं कि PPF और ELSS में क्या अंतर है?',
    'First in English, then in Hindi: What is the difference between NIFTY and SENSEX?',
    'हिंदी में: इमरजेंसी फंड क्या है? In English: How much emergency fund should I have?'
  ]
};

// उपयोगकर्ता प्रोफाइल नमूने
const USER_PROFILES = [
  {
    name: 'राजेश शर्मा',
    age: 28,
    income: 800000,
    riskProfile: 'moderate',
    location: 'Delhi'
  },
  {
    name: 'प्रिया पटेल',
    age: 35,
    income: 1200000,
    riskProfile: 'conservative',
    location: 'Mumbai'
  },
  {
    name: 'अमित सिंह',
    age: 45,
    income: 1800000,
    riskProfile: 'aggressive',
    location: 'Bangalore'
  },
  {
    name: 'सुनीता गुप्ता',
    age: 60,
    income: 1000000,
    riskProfile: 'very_conservative',
    location: 'Chennai'
  }
];

/**
 * Mistral API को कॉल करता है
 * @param {string} model - परीक्षण के लिए मॉडल
 * @param {string} query - उपयोगकर्ता का प्रश्न
 * @param {Object} userProfile - उपयोगकर्ता प्रोफाइल (वैकल्पिक)
 * @returns {Promise<Object>} API प्रतिक्रिया और प्रदर्शन मेट्रिक्स
 */
async function callMistralAPI(model, query, userProfile = null) {
  const startTime = performance.now();
  let success = false;
  let errorMessage = null;
  let responseText = null;
  let tokenUsage = null;
  
  try {
    // सिस्टम प्रॉम्प्ट तैयार करें
    let systemPrompt = 'You are a financial advisor assistant for NiveshPath, a personal finance education platform for Indian users. LANGUAGE INSTRUCTIONS: Respond in the same language as the user query - if the query is in Hindi, respond in Hindi; if in English, respond in English.';
    
    // यदि उपयोगकर्ता प्रोफाइल उपलब्ध है, तो इसे जोड़ें
    if (userProfile) {
      systemPrompt += ` USER PROFILE: Name: ${userProfile.name}, Age: ${userProfile.age}, Income: ₹${userProfile.income}, Risk Profile: ${userProfile.riskProfile}, Location: ${userProfile.location}.`;
    }
    
    // API अनुरोध तैयार करें
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ];
    
    // API कॉल करें
    const response = await axios.post(
      `${process.env.MISTRAL_API_URL}/chat/completions`,
      {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 सेकंड टाइमआउट
      }
    );
    
    // प्रतिक्रिया से डेटा निकालें
    responseText = response.data.choices[0].message.content;
    tokenUsage = {
      promptTokens: response.data.usage.prompt_tokens,
      completionTokens: response.data.usage.completion_tokens,
      totalTokens: response.data.usage.total_tokens
    };
    
    success = true;
  } catch (error) {
    errorMessage = error.message;
    if (error.response) {
      errorMessage += ` (Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)})`;
    }
  }
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  
  return {
    model,
    query,
    success,
    responseText,
    errorMessage,
    tokenUsage,
    responseTime,
    timestamp: new Date().toISOString()
  };
}

/**
 * एक परिदृश्य के लिए परीक्षण चलाता है
 * @param {string} model - परीक्षण के लिए मॉडल
 * @param {string} scenario - परीक्षण परिदृश्य
 * @param {Object} userProfile - उपयोगकर्ता प्रोफाइल (वैकल्पिक)
 * @returns {Promise<Array>} परीक्षण परिणामों की सूची
 */
async function runScenarioTest(model, scenario, userProfile = null) {
  const queries = TEST_QUERIES[scenario];
  const results = [];
  
  console.log(`Running ${scenario} tests for model: ${model}`);
  
  for (const query of queries) {
    console.log(`Testing query: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`);
    
    const result = await callMistralAPI(model, query, userProfile);
    results.push(result);
    
    // API रेट लिमिट से बचने के लिए थोड़ा इंतजार करें
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * सभी मॉडलों के लिए परीक्षण चलाता है
 * @param {Array} models - परीक्षण के लिए मॉडल
 * @param {Array} scenarios - परीक्षण परिदृश्य
 * @param {Object} userProfile - उपयोगकर्ता प्रोफाइल (वैकल्पिक)
 * @returns {Promise<Object>} परीक्षण परिणाम
 */
async function runModelTests(models = AVAILABLE_MODELS, scenarios = Object.values(TEST_SCENARIOS), userProfile = null) {
  const testResults = {};
  
  for (const model of models) {
    testResults[model] = {};
    
    for (const scenario of scenarios) {
      const results = await runScenarioTest(model, scenario, userProfile);
      testResults[model][scenario] = results;
    }
  }
  
  return testResults;
}

/**
 * परीक्षण परिणामों का विश्लेषण करता है
 * @param {Object} testResults - परीक्षण परिणाम
 * @returns {Object} विश्लेषण परिणाम
 */
function analyzeResults(testResults) {
  const analysis = {};
  
  for (const model of Object.keys(testResults)) {
    let totalResponseTime = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let successCount = 0;
    let totalQueries = 0;
    
    for (const scenario of Object.keys(testResults[model])) {
      const results = testResults[model][scenario];
      
      for (const result of results) {
        totalQueries++;
        
        if (result.success) {
          successCount++;
          totalResponseTime += result.responseTime;
          
          if (result.tokenUsage) {
            totalPromptTokens += result.tokenUsage.promptTokens;
            totalCompletionTokens += result.tokenUsage.completionTokens;
            totalTokens += result.tokenUsage.totalTokens;
          }
        }
      }
    }
    
    // प्रति 1000 प्रश्न अनुमानित लागत की गणना करें
    // नोट: यह मॉडल के आधार पर अलग-अलग होगी, यहां अनुमानित मूल्य का उपयोग किया गया है
    let costPer1000Queries;
    switch (model) {
      case 'mistral-tiny':
        costPer1000Queries = (totalTokens / totalQueries) * 1000 * 0.00014;
        break;
      case 'mistral-small':
        costPer1000Queries = (totalTokens / totalQueries) * 1000 * 0.0006;
        break;
      case 'mistral-medium':
        costPer1000Queries = (totalTokens / totalQueries) * 1000 * 0.0027;
        break;
      case 'mistral-large':
        costPer1000Queries = (totalTokens / totalQueries) * 1000 * 0.0087;
        break;
      default:
        costPer1000Queries = 0;
    }
    
    analysis[model] = {
      averageResponseTime: totalResponseTime / successCount,
      averageTokenUsage: totalTokens / successCount,
      averagePromptTokens: totalPromptTokens / successCount,
      averageCompletionTokens: totalCompletionTokens / successCount,
      successRate: (successCount / totalQueries) * 100,
      errorRate: ((totalQueries - successCount) / totalQueries) * 100,
      estimatedCostPer1000Queries: costPer1000Queries
    };
  }
  
  return analysis;
}

/**
 * परीक्षण परिणामों को फ़ाइल में सहेजता है
 * @param {Object} testResults - परीक्षण परिणाम
 * @param {Object} analysis - विश्लेषण परिणाम
 * @returns {Promise<string>} सहेजी गई फ़ाइल का पथ
 */
async function saveResults(testResults, analysis) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = path.join(__dirname, '../docs/model-test-results');
  
  // सुनिश्चित करें कि निर्देशिका मौजूद है
  try {
    await fs.mkdir(resultsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
  
  const filePath = path.join(resultsDir, `mistral-test-results-${timestamp}.json`);
  
  const data = {
    timestamp,
    testResults,
    analysis
  };
  
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Results saved to: ${filePath}`);
  
  // मार्कडाउन रिपोर्ट भी बनाएं
  const markdownPath = path.join(resultsDir, `mistral-test-report-${timestamp}.md`);
  
  let markdown = `# Mistral AI मॉडल परीक्षण रिपोर्ट

## परीक्षण तिथि: ${new Date().toLocaleDateString('hi-IN')}

## परीक्षण परिणाम

| मॉडल | औसत प्रतिक्रिया समय (ms) | औसत टोकन उपयोग | अनुमानित लागत/1000 प्रश्न | सफलता दर (%) | त्रुटि दर (%) |
|------|-------------------------|----------------|------------------------|--------------|-------------|
`;
  
  for (const model of Object.keys(analysis)) {
    const modelAnalysis = analysis[model];
    markdown += `| ${model} | ${modelAnalysis.averageResponseTime.toFixed(2)} | ${modelAnalysis.averageTokenUsage.toFixed(2)} | $${modelAnalysis.estimatedCostPer1000Queries.toFixed(2)} | ${modelAnalysis.successRate.toFixed(2)} | ${modelAnalysis.errorRate.toFixed(2)} |\n`;
  }
  
  markdown += `
## प्रदर्शन विश्लेषण

`;
  
  for (const model of Object.keys(analysis)) {
    markdown += `### ${model}

- औसत प्रतिक्रिया समय: ${analysis[model].averageResponseTime.toFixed(2)} ms
- औसत टोकन उपयोग: ${analysis[model].averageTokenUsage.toFixed(2)}
  - प्रॉम्प्ट टोकन: ${analysis[model].averagePromptTokens.toFixed(2)}
  - पूर्णता टोकन: ${analysis[model].averageCompletionTokens.toFixed(2)}
- सफलता दर: ${analysis[model].successRate.toFixed(2)}%
- त्रुटि दर: ${analysis[model].errorRate.toFixed(2)}%
- अनुमानित लागत/1000 प्रश्न: $${analysis[model].estimatedCostPer1000Queries.toFixed(2)}

`;
  }
  
  await fs.writeFile(markdownPath, markdown, 'utf8');
  console.log(`Markdown report saved to: ${markdownPath}`);
  
  return filePath;
}

/**
 * परीक्षण चलाने के लिए मुख्य फ़ंक्शन
 * @param {Object} options - परीक्षण विकल्प
 * @returns {Promise<Object>} परीक्षण परिणाम और विश्लेषण
 */
async function runTests(options = {}) {
  const {
    models = AVAILABLE_MODELS,
    scenarios = Object.values(TEST_SCENARIOS),
    userProfile = USER_PROFILES[0],
    saveToFile = true
  } = options;
  
  console.log('Starting Mistral AI model tests with the following configuration:');
  console.log('Models:', models);
  console.log('Scenarios:', scenarios);
  console.log('User Profile:', userProfile ? `${userProfile.name}, ${userProfile.age} years` : 'None');
  
  const testResults = await runModelTests(models, scenarios, userProfile);
  const analysis = analyzeResults(testResults);
  
  console.log('\nTest Analysis:');
  console.log(JSON.stringify(analysis, null, 2));
  
  if (saveToFile) {
    await saveResults(testResults, analysis);
  }
  
  return { testResults, analysis };
}

module.exports = {
  AVAILABLE_MODELS,
  TEST_SCENARIOS,
  USER_PROFILES,
  runTests,
  runModelTests,
  analyzeResults,
  saveResults
};