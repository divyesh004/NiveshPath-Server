/**
 * Mistral AI मॉडल परीक्षण स्क्रिप्ट
 * 
 * यह स्क्रिप्ट विभिन्न Mistral AI मॉडलों का परीक्षण करती है और उनके प्रदर्शन का विश्लेषण करती है।
 * परीक्षण परिणामों को MISTRAL_MODEL_TESTING.md दस्तावेज़ में जोड़ने के लिए उपयोग किया जा सकता है।
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// परीक्षण के लिए उपलब्ध मॉडल
const MODELS = [
  'mistral-tiny',
  'mistral-small',
  'mistral-medium',
  'mistral-large'
];

// परीक्षण परिदृश्य और प्रश्न
const TEST_SCENARIOS = {
  'बुनियादी वित्तीय प्रश्न': [
    'म्यूचुअल फंड क्या होते हैं?',
    'SIP का क्या मतलब है?',
    'What is the difference between stocks and bonds?',
    'PPF और EPF में क्या अंतर है?',
    'How do I calculate my tax liability?'
  ],
  'निवेश सलाह': [
    'मुझे अपनी बचत का निवेश कहां करना चाहिए?',
    'What is better - mutual funds or direct stocks?',
    'क्या मुझे गोल्ड में निवेश करना चाहिए?',
    'How should I diversify my portfolio?',
    'SIP और एकमुश्त निवेश में क्या बेहतर है?'
  ],
  'व्यक्तिगत वित्तीय योजना': [
    'मैं 30 साल का हूं और 10 लाख रुपये सालाना कमाता हूं। मुझे अपना पैसा कहां निवेश करना चाहिए?',
    'I am 45 years old with 2 children. How should I plan for their education?',
    'मेरी शादी के लिए 5 साल में 20 लाख की जरूरत है। मुझे कैसे निवेश करना चाहिए?',
    'How much should I save for retirement if I am 35 years old?',
    'मैं 50 साल का हूं और रिटायरमेंट के लिए कोई बचत नहीं की है। अब क्या करूं?'
  ],
  'कर योजना': [
    'सेक्शन 80C के तहत कौन से निवेश विकल्प हैं?',
    'How can I save tax on my capital gains?',
    'क्या ELSS फंड में निवेश करना अच्छा है?',
    'What is the tax implication of selling a property after 3 years?',
    'NPS में निवेश करने के क्या टैक्स लाभ हैं?'
  ],
  'द्विभाषी क्षमता': [
    'Please explain SIP in Hindi',
    'म्यूचुअल फंड के बारे में अंग्रेजी में बताएं',
    'Translate "diversification" into Hindi and explain the concept',
    'इन्फ्लेशन का मतलब अंग्रेजी में समझाएं',
    'Explain the concept of compound interest in both Hindi and English'
  ]
};

// परीक्षण मापदंड
const TEST_CRITERIA = [
  'उत्तर की सटीकता',
  'प्रतिक्रिया समय',
  'टोकन उपयोग',
  'लागत प्रभावशीलता',
  'भाषा क्षमता'
];

// परीक्षण परिणाम
const testResults = {};

/**
 * Mistral API को कॉल करने के लिए फंक्शन
 */
async function callMistralAPI(model, query) {
  const startTime = performance.now();
  
  try {
    const response = await axios.post(
      `${process.env.MISTRAL_API_URL}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor assistant for NiveshPath, a personal finance education platform for Indian users. आपको उपयोगकर्ता के प्रश्न का उत्तर उसी भाषा में देना है जिसमें प्रश्न पूछा गया है (हिंदी या अंग्रेजी)। यदि प्रश्न हिंदी में है, तो उत्तर हिंदी में दें। यदि प्रश्न अंग्रेजी में है, तो उत्तर अंग्रेजी में दें।'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      success: true,
      text: response.data.choices[0].message.content,
      responseTime: responseTime,
      tokenUsage: response.data.usage,
      raw: response.data
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    console.error(`Error calling ${model}:`, error.message);
    return {
      success: false,
      error: error.message,
      responseTime: responseTime
    };
  }
}

/**
 * परीक्षण चलाने के लिए मुख्य फंक्शन
 */
async function runTests() {
  console.log('Mistral AI मॉडल परीक्षण शुरू...');
  
  for (const model of MODELS) {
    console.log(`\nमॉडल परीक्षण: ${model}`);
    testResults[model] = {
      averageResponseTime: 0,
      totalTokenUsage: { prompt: 0, completion: 0, total: 0 },
      successCount: 0,
      totalTests: 0,
      scenarioResults: {}
    };
    
    let totalResponseTime = 0;
    
    for (const [scenario, questions] of Object.entries(TEST_SCENARIOS)) {
      console.log(`\nपरिदृश्य: ${scenario}`);
      testResults[model].scenarioResults[scenario] = [];
      
      for (const question of questions) {
        console.log(`प्रश्न: ${question}`);
        testResults[model].totalTests++;
        
        const result = await callMistralAPI(model, question);
        
        if (result.success) {
          console.log(`उत्तर: ${result.text.substring(0, 100)}...`);
          console.log(`प्रतिक्रिया समय: ${result.responseTime.toFixed(2)} ms`);
          console.log(`टोकन उपयोग: ${JSON.stringify(result.tokenUsage)}`);
          
          testResults[model].successCount++;
          totalResponseTime += result.responseTime;
          testResults[model].totalTokenUsage.prompt += result.tokenUsage.prompt_tokens;
          testResults[model].totalTokenUsage.completion += result.tokenUsage.completion_tokens;
          testResults[model].totalTokenUsage.total += result.tokenUsage.total_tokens;
          
          testResults[model].scenarioResults[scenario].push({
            question,
            answer: result.text,
            responseTime: result.responseTime,
            tokenUsage: result.tokenUsage
          });
        } else {
          console.log(`त्रुटि: ${result.error}`);
          testResults[model].scenarioResults[scenario].push({
            question,
            error: result.error,
            responseTime: result.responseTime
          });
        }
        
        // API रेट लिमिट से बचने के लिए थोड़ा इंतजार करें
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // औसत प्रतिक्रिया समय की गणना
    if (testResults[model].successCount > 0) {
      testResults[model].averageResponseTime = totalResponseTime / testResults[model].successCount;
    }
    
    console.log(`\n${model} परीक्षण परिणाम:`);
    console.log(`कुल परीक्षण: ${testResults[model].totalTests}`);
    console.log(`सफल परीक्षण: ${testResults[model].successCount}`);
    console.log(`औसत प्रतिक्रिया समय: ${testResults[model].averageResponseTime.toFixed(2)} ms`);
    console.log(`कुल टोकन उपयोग: ${JSON.stringify(testResults[model].totalTokenUsage)}`);
  }
  
  // परीक्षण परिणामों को फाइल में सहेजें
  saveResults();
}

/**
 * परीक्षण परिणामों को फाइल में सहेजने के लिए फंक्शन
 */
function saveResults() {
  const resultsDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = path.join(resultsDir, `mistral-test-results-${timestamp}.json`);
  
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\nपरीक्षण परिणाम सहेजे गए: ${resultsPath}`);
  
  // मार्कडाउन रिपोर्ट तैयार करें
  generateMarkdownReport(timestamp);
}

/**
 * परीक्षण परिणामों से मार्कडाउन रिपोर्ट तैयार करने के लिए फंक्शन
 */
function generateMarkdownReport(timestamp) {
  const date = new Date().toLocaleDateString('hi-IN');
  let markdown = `### परीक्षण परिणाम (${date})\n\n`;
  
  // परिणाम तालिका
  markdown += `| मॉडल | औसत प्रतिक्रिया समय | औसत टोकन उपयोग | अनुमानित लागत/1000 प्रश्न | उत्तर गुणवत्ता स्कोर (1-10) |\n`;
  markdown += `|------|-------------------|----------------|------------------------|----------------------------|\n`;
  
  // प्रत्येक मॉडल के लिए परिणाम जोड़ें
  for (const model of MODELS) {
    const results = testResults[model];
    if (!results) continue;
    
    const avgResponseTime = results.averageResponseTime.toFixed(2);
    const avgTokenUsage = Math.round(results.totalTokenUsage.total / results.successCount);
    
    // अनुमानित लागत की गणना (यह मूल्य अनुमानित हैं और वास्तविक मूल्य अलग हो सकते हैं)
    let estimatedCost = 0;
    if (model === 'mistral-tiny') {
      estimatedCost = (results.totalTokenUsage.prompt * 0.00014 + results.totalTokenUsage.completion * 0.00042) / results.successCount * 1000;
    } else if (model === 'mistral-small') {
      estimatedCost = (results.totalTokenUsage.prompt * 0.0002 + results.totalTokenUsage.completion * 0.0006) / results.successCount * 1000;
    } else if (model === 'mistral-medium') {
      estimatedCost = (results.totalTokenUsage.prompt * 0.00027 + results.totalTokenUsage.completion * 0.00081) / results.successCount * 1000;
    } else if (model === 'mistral-large') {
      estimatedCost = (results.totalTokenUsage.prompt * 0.00087 + results.totalTokenUsage.completion * 0.00261) / results.successCount * 1000;
    }
    
    // उत्तर गुणवत्ता स्कोर - यह मैन्युअल रूप से भरा जाना चाहिए
    const qualityScore = 'मैन्युअल समीक्षा आवश्यक';
    
    markdown += `| ${model} | ${avgResponseTime} ms | ${avgTokenUsage} | $${estimatedCost.toFixed(2)} | ${qualityScore} |\n`;
  }
  
  markdown += `\n#### निष्कर्ष\n[परीक्षण के आधार पर अंतिम अनुशंसा - मैन्युअल समीक्षा के बाद भरें]\n`;
  
  // परिदृश्य-वार विश्लेषण
  markdown += `\n### परिदृश्य-वार विश्लेषण\n`;
  
  for (const scenario of Object.keys(TEST_SCENARIOS)) {
    markdown += `\n#### ${scenario}\n`;
    markdown += `| मॉडल | औसत प्रतिक्रिया समय | औसत टोकन उपयोग | सफलता दर |\n`;
    markdown += `|------|-------------------|----------------|------------|\n`;
    
    for (const model of MODELS) {
      const results = testResults[model];
      if (!results || !results.scenarioResults[scenario]) continue;
      
      const scenarioResults = results.scenarioResults[scenario];
      const successCount = scenarioResults.filter(r => !r.error).length;
      const totalTests = scenarioResults.length;
      const successRate = (successCount / totalTests * 100).toFixed(2);
      
      let avgResponseTime = 0;
      let totalTokens = 0;
      
      for (const result of scenarioResults) {
        if (!result.error) {
          avgResponseTime += result.responseTime;
          totalTokens += result.tokenUsage.total;
        }
      }
      
      if (successCount > 0) {
        avgResponseTime = (avgResponseTime / successCount).toFixed(2);
        totalTokens = Math.round(totalTokens / successCount);
      }
      
      markdown += `| ${model} | ${avgResponseTime} ms | ${totalTokens} | ${successRate}% |\n`;
    }
  }
  
  const reportPath = path.join(__dirname, `../test-results/mistral-test-report-${timestamp}.md`);
  fs.writeFileSync(reportPath, markdown);
  console.log(`मार्कडाउन रिपोर्ट तैयार की गई: ${reportPath}`);
  
  console.log('\nइस रिपोर्ट को MISTRAL_MODEL_TESTING.md दस्तावेज़ में जोड़ने के लिए उपयोग किया जा सकता है।');
}

// यदि स्क्रिप्ट सीधे चलाई जाती है
if (require.main === module) {
  if (!process.env.MISTRAL_API_KEY) {
    console.error('त्रुटि: MISTRAL_API_KEY पर्यावरण चर सेट नहीं है');
    process.exit(1);
  }
  
  if (!process.env.MISTRAL_API_URL) {
    console.log('चेतावनी: MISTRAL_API_URL सेट नहीं है, डिफ़ॉल्ट URL का उपयोग किया जाएगा');
    process.env.MISTRAL_API_URL = 'https://api.mistral.ai/v1';
  }
  
  runTests().catch(error => {
    console.error('परीक्षण चलाने में त्रुटि:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  callMistralAPI,
  TEST_SCENARIOS,
  MODELS
};