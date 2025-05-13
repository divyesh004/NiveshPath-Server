const Subscription = require('../models/subscription.model');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  // Configure your email service here
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Subscribe a new email to the newsletter
 * @route POST /api/subscription/subscribe
 */
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'ईमेल आवश्यक है' });
    }

    // Check if email already exists
    const existingSubscription = await Subscription.findOne({ email });
    
    if (existingSubscription) {
      // If subscription exists but is inactive, reactivate it
      if (!existingSubscription.isActive) {
        existingSubscription.isActive = true;
        await existingSubscription.save();
        return res.status(200).json({ 
          success: true, 
          message: 'आपकी सदस्यता सफलतापूर्वक पुनः सक्रिय की गई है' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: 'यह ईमेल पहले से ही सदस्यता ले चुका है' 
      });
    }

    // Generate unique unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Create new subscription
    const newSubscription = new Subscription({
      email,
      unsubscribeToken
    });

    await newSubscription.save();

    // Send welcome email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'NiveshPath न्यूज़लेटर की सदस्यता की पुष्टि',
      html: `
        <h1>NiveshPath न्यूज़लेटर में आपका स्वागत है!</h1>
        <p>आपकी सदस्यता सफलतापूर्वक पंजीकृत कर ली गई है।</p>
        <p>अब आपको हमारे नवीनतम वित्तीय अपडेट, पाठ्यक्रम और टिप्स मिलेंगे।</p>
        <p>यदि आप भविष्य में सदस्यता रद्द करना चाहते हैं, तो नीचे दिए गए लिंक पर क्लिक करें:</p>
        <a href="${process.env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}">सदस्यता रद्द करें</a>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({ 
      success: true, 
      message: 'आपने सफलतापूर्वक न्यूज़लेटर की सदस्यता ले ली है' 
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'सर्वर त्रुटि, कृपया बाद में पुनः प्रयास करें' 
    });
  }
};

/**
 * Unsubscribe an email from the newsletter
 * @route POST /api/subscription/unsubscribe
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'अमान्य अनुरोध, टोकन आवश्यक है' 
      });
    }

    const subscription = await Subscription.findOne({ unsubscribeToken: token });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'सदस्यता नहीं मिली' 
      });
    }

    // Update subscription status to inactive
    subscription.isActive = false;
    await subscription.save();

    return res.status(200).json({ 
      success: true, 
      message: 'आपकी सदस्यता सफलतापूर्वक रद्द कर दी गई है' 
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'सर्वर त्रुटि, कृपया बाद में पुनः प्रयास करें' 
    });
  }
};

/**
 * Send newsletter to all active subscribers
 * @route POST /api/subscription/send-newsletter
 * @access Private (Admin only)
 */
exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'विषय और सामग्री आवश्यक हैं' 
      });
    }

    // Get all active subscribers
    const activeSubscribers = await Subscription.find({ isActive: true });

    if (activeSubscribers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'कोई सक्रिय सदस्य नहीं मिला' 
      });
    }

    // Send newsletter to each subscriber
    const emailPromises = activeSubscribers.map(subscriber => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: subscriber.email,
        subject: subject,
        html: `
          ${content}
          <br/><br/>
          <p>यदि आप भविष्य में सदस्यता रद्द करना चाहते हैं, तो नीचे दिए गए लिंक पर क्लिक करें:</p>
          <a href="${process.env.FRONTEND_URL}/unsubscribe?token=${subscriber.unsubscribeToken}">सदस्यता रद्द करें</a>
        `
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    // Update last notification sent date for all subscribers
    await Subscription.updateMany(
      { isActive: true },
      { $set: { lastNotificationSent: new Date() } }
    );

    return res.status(200).json({ 
      success: true, 
      message: `न्यूज़लेटर सफलतापूर्वक ${activeSubscribers.length} सदस्यों को भेजा गया` 
    });
  } catch (error) {
    console.error('Send newsletter error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'सर्वर त्रुटि, कृपया बाद में पुनः प्रयास करें' 
    });
  }
};

/**
 * Send notification to all active subscribers when new content is added
 * @param {string} contentType - Type of content (course, blog, etc.)
 * @param {string} contentTitle - Title of the new content
 * @param {string} contentId - ID of the new content
 * @param {string} contentDescription - Brief description of the new content
 */
exports.sendContentNotification = async (contentType, contentTitle, contentId, contentDescription) => {
  try {
    // Get all active subscribers
    const activeSubscribers = await Subscription.find({ isActive: true });

    if (activeSubscribers.length === 0) {
      console.log('कोई सक्रिय सदस्य नहीं मिला');
      return;
    }

    // Prepare notification content based on content type
    let subject = '';
    let contentLink = '';
    
    if (contentType === 'course') {
      subject = `NiveshPath पर नया पाठ्यक्रम: ${contentTitle}`;
      contentLink = `${process.env.FRONTEND_URL}/courses/${contentId}`;
    } else if (contentType === 'blog') {
      subject = `NiveshPath पर नया ब्लॉग: ${contentTitle}`;
      contentLink = `${process.env.FRONTEND_URL}/blog/${contentId}`;
    } else {
      subject = `NiveshPath पर नई सामग्री: ${contentTitle}`;
      contentLink = `${process.env.FRONTEND_URL}`;
    }

    // Send notification to each subscriber
    const emailPromises = activeSubscribers.map(subscriber => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: subscriber.email,
        subject: subject,
        html: `
          <h1>NiveshPath पर नई सामग्री जोड़ी गई है!</h1>
          <h2>${contentTitle}</h2>
          <p>${contentDescription}</p>
          <p><a href="${contentLink}">अभी देखें</a></p>
          <br/><br/>
          <p>यदि आप भविष्य में सदस्यता रद्द करना चाहते हैं, तो नीचे दिए गए लिंक पर क्लिक करें:</p>
          <a href="${process.env.FRONTEND_URL}/unsubscribe?token=${subscriber.unsubscribeToken}">सदस्यता रद्द करें</a>
        `
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    // Update last notification sent date for all subscribers
    await Subscription.updateMany(
      { isActive: true },
      { $set: { lastNotificationSent: new Date() } }
    );

    console.log(`नई सामग्री की सूचना सफलतापूर्वक ${activeSubscribers.length} सदस्यों को भेजी गई`);
  } catch (error) {
    console.error('Content notification error:', error);
  }
};

/**
 * Send automatic notification to subscribers when new content is added
 * @route POST /api/subscription/notify-new-content
 * @access Private (Admin only)
 */
exports.notifyNewContent = async (req, res) => {
  try {
    const { contentType, contentTitle, contentId, contentDescription } = req.body;

    if (!contentType || !contentTitle || !contentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'सामग्री का प्रकार, शीर्षक और आईडी आवश्यक हैं' 
      });
    }

    // Call the function to send notifications
    await exports.sendContentNotification(contentType, contentTitle, contentId, contentDescription || '');

    return res.status(200).json({ 
      success: true, 
      message: 'नई सामग्री की सूचना सफलतापूर्वक भेजी गई' 
    });
  } catch (error) {
    console.error('Notify new content error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'सर्वर त्रुटि, कृपया बाद में पुनः प्रयास करें' 
    });
  }
};