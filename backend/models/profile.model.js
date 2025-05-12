const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  },
  income: {
    type: Number,
    min: 0
  },
  riskAppetite: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  goals: [{
    type: String,
    trim: true
  }], // will be used for financialGoals
  investmentTimeframe: {
    type: String,
    enum: ['short_term', 'medium_term', 'long_term'],
    default: 'medium_term'
  },
  riskTolerance: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  existingInvestments: [{
    type: String,
    trim: true
  }],
  knowledgeAssessment: {
    financialKnowledgeLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  onboardingData: {
    demographic: {
      location: String,
      occupation: String,
      education: String,
      familySize: Number
    },
    psychological: {
      riskTolerance: {
        type: String,
        enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
        default: 'medium'
      },
      financialAnxiety: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      decisionMakingStyle: {
        type: String,
        enum: ['analytical', 'intuitive', 'consultative', 'spontaneous'],
        default: 'analytical'
      }
    },
    ethnographic: {
      culturalBackground: String,
      financialBeliefs: [String],
      communityInfluence: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }
  }
}, { timestamps: true });

// Create index for faster lookups
profileSchema.index({ userId: 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;