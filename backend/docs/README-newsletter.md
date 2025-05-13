# NiveshPath न्यूज़लेटर सब्सक्रिप्शन सिस्टम

इस दस्तावेज़ में NiveshPath वेबसाइट के लिए न्यूज़लेटर सब्सक्रिप्शन सिस्टम का उपयोग करने के निर्देश दिए गए हैं। यह सिस्टम उपयोगकर्ताओं को न्यूज़लेटर की सदस्यता लेने और नए कंटेंट के जुड़ने पर स्वचालित नोटिफिकेशन प्राप्त करने की अनुमति देता है।

## सुविधाएँ

- **न्यूज़लेटर सब्सक्रिप्शन**: उपयोगकर्ता अपना ईमेल दर्ज करके न्यूज़लेटर की सदस्यता ले सकते हैं
- **सदस्यता रद्द करना**: उपयोगकर्ता किसी भी समय अपनी सदस्यता रद्द कर सकते हैं
- **नए कंटेंट नोटिफिकेशन**: जब नया कोर्स, ब्लॉग या अन्य कंटेंट जोड़ा जाता है, तो सभी सक्रिय सदस्यों को स्वचालित रूप से नोटिफिकेशन भेजा जाता है
- **मैनुअल न्यूज़लेटर**: एडमिन कस्टम न्यूज़लेटर भेज सकते हैं

## सेटअप और उपयोग

### 1. फ्रंटएंड सेटअप

फ्रंटएंड में न्यूज़लेटर सब्सक्रिप्शन फॉर्म जोड़ने के लिए:

1. `NewsletterSubscription.jsx` कंपोनेंट को अपने फुटर या किसी अन्य उपयुक्त स्थान पर आयात करें और उपयोग करें:

```jsx
import NewsletterSubscription from '../components/NewsletterSubscription';

// अपने लेआउट या फुटर कंपोनेंट में
const Footer = () => {
  return (
    <footer>
      {/* अन्य फुटर सामग्री */}
      <NewsletterSubscription />
    </footer>
  );
};
```

### 2. नए कंटेंट पर नोटिफिकेशन भेजना

जब आप नया कंटेंट (जैसे कोर्स, ब्लॉग, आदि) जोड़ते हैं, तो सब्सक्राइबर्स को नोटिफिकेशन भेजने के लिए:

#### विधि 1: कंट्रोलर में सीधे इंटीग्रेशन

```javascript
const { sendContentNotification } = require('../controllers/subscription.controller');

// कोर्स कंट्रोलर में
exports.createCourse = async (req, res) => {
  try {
    // नया कोर्स बनाएं
    const newCourse = new Course(req.body);
    await newCourse.save();
    
    // सब्सक्राइबर्स को नोटिफिकेशन भेजें
    await sendContentNotification(
      'course',                 // कंटेंट का प्रकार
      newCourse.title,          // कंटेंट का शीर्षक
      newCourse._id.toString(), // कंटेंट की आईडी
      newCourse.description     // कंटेंट का विवरण
    );
    
    // रिस्पांस भेजें
  } catch (error) {
    // त्रुटि हैंडलिंग
  }
};
```

#### विधि 2: API के माध्यम से

एडमिन पैनल से API कॉल के माध्यम से नोटिफिकेशन भेजें:

```javascript
// एडमिन पैनल से API कॉल
async function sendNotification() {
  try {
    const response = await axios.post('/api/subscription/notify-new-content', {
      contentType: 'course',
      contentTitle: 'नया वित्तीय पाठ्यक्रम',
      contentId: 'course-id',
      contentDescription: 'इस पाठ्यक्रम में आप वित्तीय नियोजन के बारे में सीखेंगे'
    });
    
    if (response.data.success) {
      console.log('नोटिफिकेशन सफलतापूर्वक भेजा गया');
    }
  } catch (error) {
    console.error('नोटिफिकेशन भेजने में त्रुटि:', error);
  }
}
```

### 3. मैनुअल न्यूज़लेटर भेजना

एडमिन पैनल से कस्टम न्यूज़लेटर भेजने के लिए:

```javascript
async function sendNewsletter() {
  try {
    const response = await axios.post('/api/subscription/send-newsletter', {
      subject: 'महत्वपूर्ण अपडेट',
      content: '<h1>महत्वपूर्ण अपडेट</h1><p>यहां न्यूज़लेटर की सामग्री है...</p>'
    });
    
    if (response.data.success) {
      console.log('न्यूज़लेटर सफलतापूर्वक भेजा गया');
    }
  } catch (error) {
    console.error('न्यूज़लेटर भेजने में त्रुटि:', error);
  }
}
```

## API एंडपॉइंट्स

### पब्लिक एंडपॉइंट्स

- **POST /api/subscription/subscribe**
  - न्यूज़लेटर की सदस्यता लेने के लिए
  - बॉडी: `{ "email": "user@example.com" }`

- **POST /api/subscription/unsubscribe**
  - न्यूज़लेटर की सदस्यता रद्द करने के लिए
  - बॉडी: `{ "token": "unsubscribe-token" }`

### एडमिन एंडपॉइंट्स (प्रमाणीकरण आवश्यक)

- **POST /api/subscription/send-newsletter**
  - सभी सक्रिय सदस्यों को कस्टम न्यूज़लेटर भेजने के लिए
  - बॉडी: `{ "subject": "न्यूज़लेटर विषय", "content": "HTML सामग्री" }`

- **POST /api/subscription/notify-new-content**
  - नए कंटेंट के बारे में सदस्यों को सूचित करने के लिए
  - बॉडी: `{ "contentType": "course", "contentTitle": "शीर्षक", "contentId": "id", "contentDescription": "विवरण" }`

## ध्यान देने योग्य बातें

1. सुनिश्चित करें कि `.env` फाइल में ईमेल सेवा के लिए आवश्यक पर्यावरण चर सेट हैं:
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `FRONTEND_URL`

2. सब्सक्रिप्शन मॉडल में प्राथमिकताएँ हैं जिन्हें भविष्य में उपयोगकर्ता-विशिष्ट नोटिफिकेशन के लिए उपयोग किया जा सकता है।

3. सभी ईमेल हिंदी में हैं, आवश्यकतानुसार अनुकूलित करें।

## भविष्य के सुधार

1. उपयोगकर्ता प्राथमिकताओं के आधार पर नोटिफिकेशन फ़िल्टरिंग
2. ईमेल टेम्पलेट्स के लिए बेहतर डिज़ाइन
3. नोटिफिकेशन अनुसूचक (स्केड्यूलर) जोड़ना
4. पढ़ने की पुष्टि और क्लिक ट्रैकिंग