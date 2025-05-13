const { validationResult } = require('express-validator');
const Course = require('../models/course.model');
const UserProgress = require('../models/userProgress.model');

// Get all courses
exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().select('_id title description level duration');
    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

// Get course by ID
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

// Update course progress
exports.updateCourseProgress = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { progress, currentModule, completedModuleId } = req.body;
    
    // Find course to ensure it exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find or create user progress
    let userProgress = await UserProgress.findOne({
      userId: req.user.userId,
      courseId: req.params.id
    });
    
    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user.userId,
        courseId: req.params.id,
        progressPercentage: progress || 0,
        currentModule: currentModule || '',
        completedModules: completedModuleId ? [{ moduleId: completedModuleId }] : []
      });
    } else {
      // Update existing progress
      if (progress !== undefined) {
        userProgress.progressPercentage = progress;
      }
      
      if (currentModule) {
        userProgress.currentModule = currentModule;
      }
      
      if (completedModuleId) {
        // Check if module is already marked as completed
        const moduleAlreadyCompleted = userProgress.completedModules.some(
          module => module.moduleId.toString() === completedModuleId
        );
        
        if (!moduleAlreadyCompleted) {
          userProgress.completedModules.push({
            moduleId: completedModuleId,
            completedAt: new Date()
          });
        }
      }
      
      userProgress.lastAccessedAt = new Date();
    }
    
    await userProgress.save();
    
    res.status(200).json({
      message: 'Progress updated successfully',
      progress: userProgress
    });
  } catch (error) {
    next(error);
  }
};

// Get user's progress for a specific course
exports.getCourseProgress = async (req, res, next) => {
  try {
    const userProgress = await UserProgress.findOne({
      userId: req.user.userId,
      courseId: req.params.id
    });
    
    if (!userProgress) {
      return res.status(404).json({ message: 'No progress found for this course' });
    }
    
    res.status(200).json(userProgress);
  } catch (error) {
    next(error);
  }
};

// Get all user's course progress
exports.getAllUserProgress = async (req, res, next) => {
  try {
    const userProgress = await UserProgress.find({
      userId: req.user.userId
    }).populate('courseId', 'title level');
    
    res.status(200).json(userProgress);
  } catch (error) {
    next(error);
  }
};