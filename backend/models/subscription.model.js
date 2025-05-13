const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  lastNotificationSent: {
    type: Date,
    default: null
  },
  preferences: {
    courses: {
      type: Boolean,
      default: true
    },
    marketUpdates: {
      type: Boolean,
      default: true
    },
    financialTips: {
      type: Boolean,
      default: true
    }
  },
  unsubscribeToken: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

// Create a text index on email for faster searching
subscriptionSchema.index({ email: 'text' });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;