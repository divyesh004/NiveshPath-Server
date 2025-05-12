const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Submit onboarding information
router.post(
  '/',
  [
    // Demographic validation
    body('demographic.location').optional().notEmpty().withMessage('Location cannot be empty'),
    body('demographic.occupation').optional().notEmpty().withMessage('Occupation cannot be empty'),
    body('demographic.education').optional().notEmpty().withMessage('Education cannot be empty'),
    body('demographic.familySize').optional().isInt({ min: 1 }).withMessage('Family size must be at least 1'),
    body('age').optional().isInt({ min: 18, max: 120 }).withMessage('Age must be between 18 and 120'),
    body('income').optional().isNumeric().withMessage('Income must be a number'),
    
    // Psychological validation
    body('psychological.riskTolerance').optional()
      .isIn(['very_low', 'low', 'medium', 'high', 'very_high'])
      .withMessage('Risk tolerance must be very_low, low, medium, high, or very_high'),
    body('psychological.financialAnxiety').optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Financial anxiety must be low, medium, or high'),
    body('psychological.decisionMakingStyle').optional()
      .isIn(['analytical', 'intuitive', 'consultative', 'spontaneous'])
      .withMessage('Decision making style must be analytical, intuitive, consultative, or spontaneous'),
    
    // Ethnographic validation
    body('ethnographic.culturalBackground').optional().notEmpty().withMessage('Cultural background cannot be empty'),
    body('ethnographic.financialBeliefs').optional().isArray().withMessage('Financial beliefs must be an array'),
    body('ethnographic.communityInfluence').optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Community influence must be low, medium, or high'),
    
    // Financial goals validation
    body('financialGoals').optional().isArray().withMessage('Financial goals must be an array'),
    
    // Investment assessment validation
    body('investmentTimeframe').optional()
      .isIn(['short_term', 'medium_term', 'long_term'])
      .withMessage('Investment timeframe must be short_term, medium_term, or long_term'),
    body('riskTolerance').optional()
      .isIn(['very_low', 'low', 'medium', 'high', 'very_high'])
      .withMessage('Risk tolerance must be very_low, low, medium, high, or very_high'),
    body('existingInvestments').optional().isArray().withMessage('Existing investments must be an array'),
    body('knowledgeAssessment.financialKnowledgeLevel').optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Financial knowledge level must be beginner, intermediate, or advanced')
  ],
  (req, res, next) => {
    // Map financialGoals to goals if financialGoals is provided
    if (req.body.financialGoals && !req.body.goals) {
      req.body.goals = req.body.financialGoals;
    }
    
    // Extract name, age, income from demographic if provided directly
    if (req.body.demographic) {
      if (req.body.demographic.name && !req.body.name) {
        req.body.name = req.body.demographic.name;
      }
      if (req.body.demographic.age && !req.body.age) {
        req.body.age = req.body.demographic.age;
      }
      if (req.body.demographic.income && !req.body.income) {
        req.body.income = req.body.demographic.income;
      }
    }
    next();
  },
  userController.submitOnboarding
);

module.exports = router;