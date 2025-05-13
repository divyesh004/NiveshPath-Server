const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

// Public routes
router.post('/subscribe', subscriptionController.subscribe);
router.post('/unsubscribe', subscriptionController.unsubscribe);

// Admin only routes
router.post('/send-newsletter', [authMiddleware, adminMiddleware], subscriptionController.sendNewsletter);
router.post('/notify-new-content', [authMiddleware, adminMiddleware], subscriptionController.notifyNewContent);

module.exports = router;