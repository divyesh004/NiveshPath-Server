const { validationResult } = require('express-validator');
const Profile = require('../models/profile.model');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name,
      age,
      income,
      riskAppetite,
      goals,
      financialGoals,
      onboardingData,
      investmentTimeframe,
      riskTolerance,
      existingInvestments,
      knowledgeAssessment
    } = req.body;
    
    // Determine which goals to use (financialGoals or goals)
    const finalGoals = goals || financialGoals || [];
    
    // Find profile by userId
    let profile = await Profile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      // Create new profile if it doesn't exist
      profile = new Profile({
        userId: req.user.userId,
        name,
        age,
        income,
        riskAppetite,
        goals: finalGoals,
        investmentTimeframe,
        riskTolerance,
        existingInvestments,
        knowledgeAssessment,
        onboardingData
      });
    } else {
      // Update existing profile
      if (name) profile.name = name;
      if (age) profile.age = age;
      if (income) profile.income = income;
      if (riskAppetite) profile.riskAppetite = riskAppetite;
      if (finalGoals.length > 0) profile.goals = finalGoals;
      if (investmentTimeframe) profile.investmentTimeframe = investmentTimeframe;
      if (riskTolerance) profile.riskTolerance = riskTolerance;
      if (existingInvestments) profile.existingInvestments = existingInvestments;
      if (knowledgeAssessment) {
        profile.knowledgeAssessment = {
          ...profile.knowledgeAssessment,
          ...knowledgeAssessment
        };
      }
      if (onboardingData) {
        // Merge onboarding data with existing data
        profile.onboardingData = {
          ...profile.onboardingData,
          ...onboardingData
        };
      }
    }
    
    await profile.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
};

// Submit onboarding information
exports.submitOnboarding = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      demographic, 
      psychological, 
      ethnographic, 
      financialGoals, 
      goals, 
      name, 
      age, 
      income,
      investmentTimeframe,
      riskTolerance,
      existingInvestments,
      knowledgeAssessment
    } = req.body;
    
    // Find profile by userId
    let profile = await Profile.findOne({ userId: req.user.userId });
    
    // Determine which goals to use (financialGoals or goals)
    const finalGoals = goals || financialGoals || [];
    
    if (!profile) {
      // Create new profile if it doesn't exist
      profile = new Profile({
        userId: req.user.userId,
        name: name || (demographic?.name),
        age: age || (demographic?.age),
        income: income || (demographic?.income),
        goals: finalGoals,
        investmentTimeframe,
        riskTolerance,
        existingInvestments,
        knowledgeAssessment,
        onboardingData: {
          demographic,
          psychological,
          ethnographic
        }
      });
    } else {
      // Update existing profile's onboarding data
      if (name) profile.name = name;
      if (age) profile.age = age;
      if (income) profile.income = income;
      if (finalGoals.length > 0) profile.goals = finalGoals;
      if (investmentTimeframe) profile.investmentTimeframe = investmentTimeframe;
      if (riskTolerance) profile.riskTolerance = riskTolerance;
      if (existingInvestments) profile.existingInvestments = existingInvestments;
      if (knowledgeAssessment) {
        profile.knowledgeAssessment = {
          ...profile.knowledgeAssessment,
          ...knowledgeAssessment
        };
      }
      
      // Update from demographic if direct fields not provided
      if (demographic?.name && !name) profile.name = demographic.name;
      if (demographic?.age && !age) profile.age = demographic.age;
      if (demographic?.income && !income) profile.income = demographic.income;
      
      if (finalGoals.length > 0) {
        profile.goals = finalGoals;
      }
      
      profile.onboardingData = {
        demographic: demographic || profile.onboardingData?.demographic,
        psychological: psychological || profile.onboardingData?.psychological,
        ethnographic: ethnographic || profile.onboardingData?.ethnographic
      };
    
    await profile.save();
    
    res.status(200).json({
      message: 'Onboarding information submitted successfully',
      profile
    });
  }} catch (error) {
    next(error);
  }
};