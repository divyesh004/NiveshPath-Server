const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put(
  '/profile',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('age').optional().isInt({ min: 18, max: 120 }).withMessage('Age must be between 18 and 120'),
    body('income').optional().isNumeric().withMessage('Income must be a number'),
    body('riskAppetite').optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Risk appetite must be low, medium, or high'),
    // Important: Map financialGoals to goals in the profile model
    body('financialGoals').optional().isArray().withMessage('Financial goals must be an array'),
    // Investment assessment fields
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
    
    // Extract name, age, income from demographic if provided
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
  userController.updateProfile
);

module.exports = router;