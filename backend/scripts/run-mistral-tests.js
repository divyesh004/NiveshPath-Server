/**
 * Mistral मॉडल परीक्षण स्क्रिप्ट
 * 
 * इस स्क्रिप्ट का उपयोग विभिन्न Mistral AI मॉडलों के प्रदर्शन और लागत का तुलनात्मक विश्लेषण करने के लिए किया जा सकता है।
 * यह mistral-model-tester उपयोगिता का उपयोग करता है और परीक्षण परिणामों को docs/model-test-results निर्देशिका में सहेजता है।
 */

require('dotenv').config(); // .env फ़ाइल से पर्यावरण चर लोड करें
const { runTests, AVAILABLE_MODELS, TEST_SCENARIOS, USER_PROFILES } = require('../utils/mistral-model-tester');

/**
 * परीक्षण विकल्प कॉन्फ़िगर करें
 * आप अपनी आवश्यकताओं के अनुसार इन विकल्पों को संशोधित कर सकते हैं
 */
const TEST_OPTIONS = {
  // परीक्षण के लिए मॉडल
  // आप सभी मॉडलों का परीक्षण कर सकते हैं या केवल कुछ को चुन सकते हैं
  models: [
    'mistral-small',  // संतुलित प्रदर्शन/लागत के लिए
    'mistral-medium'   // बेहतर प्रदर्शन के लिए
    // 'mistral-tiny',  // कम लागत के लिए
    // 'mistral-large'  // उच्चतम प्रदर्शन के लिए
  ],
  
  // परीक्षण परिदृश्य
  // आप सभी परिदृश्यों का परीक्षण कर सकते हैं या केवल कुछ को चुन सकते हैं
  scenarios: [
    TEST_SCENARIOS.BASIC_FINANCE,
    TEST_SCENARIOS.INVESTMENT_ADVICE,
    TEST_SCENARIOS.PERSONAL_FINANCE,
    TEST_SCENARIOS.TAX_PLANNING,
    TEST_SCENARIOS.BILINGUAL
  ],
  
  // उपयोगकर्ता प्रोफाइल
  // आप विभिन्न उपयोगकर्ता प्रोफाइल के साथ परीक्षण कर सकते हैं
  userProfile: USER_PROFILES[0],  // पहला उपयोगकर्ता प्रोफाइल
  
  // परिणामों को फ़ाइल में सहेजें
  saveToFile: true
};

/**
 * परीक्षण चलाएं
 */
async function main() {
  console.log('Mistral AI मॉडल परीक्षण शुरू कर रहा है...');
  
  try {
    // API कुंजी की जांच करें
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY पर्यावरण चर सेट नहीं है। कृपया .env फ़ाइल में इसे सेट करें।');
    }
    
    if (!process.env.MISTRAL_API_URL) {
      console.log('MISTRAL_API_URL पर्यावरण चर सेट नहीं है। डिफ़ॉल्ट URL का उपयोग किया जाएगा: https://api.mistral.ai/v1');
      process.env.MISTRAL_API_URL = 'https://api.mistral.ai/v1';
    }
    
    // परीक्षण चलाएं
    const { testResults, analysis } = await runTests(TEST_OPTIONS);
    
    // परिणामों का सारांश प्रदर्शित करें
    console.log('\nपरीक्षण पूरा हुआ! परिणामों का सारांश:');
    
    for (const model of Object.keys(analysis)) {
      console.log(`\n${model}:`);
      console.log(`  औसत प्रतिक्रिया समय: ${analysis[model].averageResponseTime.toFixed(2)} ms`);
      console.log(`  औसत टोकन उपयोग: ${analysis[model].averageTokenUsage.toFixed(2)}`);
      console.log(`  सफलता दर: ${analysis[model].successRate.toFixed(2)}%`);
      console.log(`  अनुमानित लागत/1000 प्रश्न: $${analysis[model].estimatedCostPer1000Queries.toFixed(2)}`);
    }
    
    console.log('\nविस्तृत परिणाम docs/model-test-results निर्देशिका में सहेजे गए हैं।');
    console.log('परीक्षण परिणामों के आधार पर, आप MISTRAL_MODEL पर्यावरण चर को अपडेट कर सकते हैं।');
    
  } catch (error) {
    console.error('परीक्षण चलाते समय त्रुटि:', error.message);
    process.exit(1);
  }
}

// परीक्षण चलाएं
main();