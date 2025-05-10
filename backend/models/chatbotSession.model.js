const mongoose = require('mongoose');

const chatbotSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  context: {
    type: Object,
    default: {}
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  errorDetails: {
    type: String,
    default: null
  },
  feedback: {
    helpful: Boolean,
    comments: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    submittedAt: Date
  }
});

// Create indexes for faster lookups
chatbotSessionSchema.index({ userId: 1 });
chatbotSessionSchema.index({ timestamp: -1 });
chatbotSessionSchema.index({ userId: 1, conversationId: 1 });

const ChatbotSession = mongoose.model('ChatbotSession', chatbotSessionSchema);

module.exports = ChatbotSession;