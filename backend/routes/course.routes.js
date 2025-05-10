const express = require('express');
const { body, param } = require('express-validator');
const courseController = require('../controllers/course.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all courses (public route)
router.get('/', courseController.getAllCourses);

// Get course by ID (public route)
router.get('/:id', courseController.getCourseById);

// Protected routes below - require authentication
router.use(authenticate);

// Update course progress
router.post(
  '/:id/progress',
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
    body('currentModule').optional().notEmpty().withMessage('Current module cannot be empty'),
    body('completedModuleId').optional().isMongoId().withMessage('Invalid completed module ID')
  ],
  courseController.updateCourseProgress
);

// Get user's progress for a specific course
router.get(
  '/:id/progress',
  [
    param('id').isMongoId().withMessage('Invalid course ID')
  ],
  courseController.getCourseProgress
);

// Get all user's course progress
router.get('/user/progress', courseController.getAllUserProgress);

module.exports = router;