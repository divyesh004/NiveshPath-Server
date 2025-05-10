const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentModule: {
    type: String,
    default: ''
  },
  completedModules: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create compound index for faster lookups
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;