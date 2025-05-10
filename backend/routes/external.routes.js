const express = require('express');
const externalController = require('../controllers/external.controller');

const router = express.Router();

// Get updates from the RBI and other financial news sources
router.get('/rbi-news', externalController.getRBINews);

// Fetch stock market updates (NSE/BSE)
router.get('/markets', externalController.getMarketUpdates);

// Access live currency exchange data
router.get('/currency', externalController.getCurrencyExchange);

module.exports = router;