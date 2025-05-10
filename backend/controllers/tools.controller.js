const mongoose = require('mongoose');

/**
 * Calculate SIP (Systematic Investment Plan) returns
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.calculateSIP = (req, res) => {
  try {
    const { amount = 5000, years = 10, returnRate = 12 } = req.body;
    
    // Validate inputs
    if (amount <= 0 || years <= 0 || returnRate < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input parameters. Amount and years must be positive, return rate must be non-negative.'
      });
    }
    
    // Convert annual return rate to monthly
    const monthlyRate = returnRate / 12 / 100;
    const months = years * 12;
    
    // Calculate SIP returns using formula: P × ((1 + r)^n - 1) / r × (1 + r)
    // Where P is monthly investment, r is monthly interest rate, n is number of months
    const totalInvestment = amount * months;
    const totalValue = amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const estimatedReturns = totalValue - totalInvestment;
    
    res.status(200).json({
      status: 'success',
      data: {
        monthlyInvestment: amount,
        years,
        expectedReturn: returnRate,
        totalInvestment,
        estimatedReturns,
        totalValue
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error calculating SIP returns',
      error: error.message
    });
  }
};

/**
 * Calculate EMI (Equated Monthly Installment)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.calculateEMI = (req, res) => {
  try {
    const { amount = 100000, interestRate = 10, tenure = 12 } = req.body;
    
    // Validate inputs
    if (amount <= 0 || interestRate <= 0 || tenure <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input parameters. Amount, interest rate, and tenure must be positive.'
      });
    }
    
    // Convert annual interest rate to monthly
    const monthlyRate = interestRate / 12 / 100;
    
    // Calculate EMI using formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
    // Where P is principal, r is monthly interest rate, n is number of months
    const emiAmount = amount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
    const totalPayment = emiAmount * tenure;
    const totalInterest = totalPayment - amount;
    
    res.status(200).json({
      status: 'success',
      data: {
        loanAmount: amount,
        interestRate,
        tenureMonths: tenure,
        emiAmount,
        totalInterest,
        totalPayment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error calculating EMI',
      error: error.message
    });
  }
};

/**
 * Budget planner tool
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.budgetPlanner = (req, res) => {
  try {
    const { income = 50000, expenses = [] } = req.body;
    
    // Validate inputs
    if (income < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Income cannot be negative'
      });
    }
    
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    // Calculate savings
    const savings = income - totalExpenses;
    
    // Generate basic recommendations
    const recommendations = [];
    
    // 50-30-20 rule (50% needs, 30% wants, 20% savings)
    const idealSavings = income * 0.2;
    
    if (savings < idealSavings) {
      recommendations.push('Consider increasing your savings to at least 20% of your income.');
    }
    
    if (totalExpenses > income) {
      recommendations.push('Your expenses exceed your income. Consider reducing non-essential expenses.');
    }
    
    // Add emergency fund recommendation
    recommendations.push('Aim to build an emergency fund that covers 3-6 months of expenses.');
    
    res.status(200).json({
      status: 'success',
      data: {
        income,
        expenses,
        totalExpenses,
        savings,
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error in budget planning',
      error: error.message
    });
  }
};