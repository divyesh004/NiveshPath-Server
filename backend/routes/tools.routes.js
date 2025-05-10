const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const toolsController = require('../controllers/tools.controller');


// All routes require authentication
router.use(authenticate);

// SIP Calculator
router.post('/sip', toolsController.calculateSIP);

// EMI Calculator
router.post('/emi', toolsController.calculateEMI);

// Budget Planner
router.post('/budget', toolsController.budgetPlanner);

module.exports = router;