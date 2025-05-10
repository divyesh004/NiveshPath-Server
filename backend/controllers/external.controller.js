const axios = require('axios');

/**
 * @desc    Get updates from the RBI and other financial news sources
 * @route   GET /api/external/rbi-news
 * @access  Public
 */
exports.getRBINews = async (req, res) => {
  try {
    // In a real implementation, this would call an actual RBI news API
    // For now, we'll return mock data
    const mockNews = [
      {
        id: 1,
        title: 'RBI Announces New Monetary Policy',
        summary: 'The Reserve Bank of India has announced its latest monetary policy with changes to key interest rates.',
        date: '2025-05-08',
        source: 'RBI Press Release',
        url: 'https://www.rbi.org.in/news/monetary-policy-2025'
      },
      {
        id: 2,
        title: 'Financial Inclusion Initiative Launched',
        summary: 'RBI launches new initiative to improve financial literacy and inclusion across rural India.',
        date: '2025-05-05',
        source: 'Financial Express',
        url: 'https://www.financialexpress.com/rbi-initiative-2025'
      }
    ];

    res.status(200).json({
      success: true,
      data: mockNews
    });
  } catch (error) {
    console.error('Error fetching RBI news:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch RBI news'
    });
  }
};

/**
 * @desc    Fetch stock market updates (NSE/BSE)
 * @route   GET /api/external/markets
 * @access  Public
 */
exports.getMarketUpdates = async (req, res) => {
  try {
    // In a real implementation, this would call an actual stock market API
    // For now, we'll return mock data
    const mockMarketData = {
      nse: {
        index: 'NIFTY 50',
        value: 22456.80,
        change: 145.30,
        changePercent: 0.65,
        lastUpdated: '2025-05-09T10:30:00Z'
      },
      bse: {
        index: 'SENSEX',
        value: 73890.45,
        change: 412.75,
        changePercent: 0.56,
        lastUpdated: '2025-05-09T10:30:00Z'
      },
      topGainers: [
        { symbol: 'HDFCBANK', name: 'HDFC Bank', change: 2.34 },
        { symbol: 'INFY', name: 'Infosys', change: 1.89 }
      ],
      topLosers: [
        { symbol: 'TATASTEEL', name: 'Tata Steel', change: -1.45 },
        { symbol: 'SUNPHARMA', name: 'Sun Pharma', change: -0.98 }
      ]
    };

    res.status(200).json({
      success: true,
      data: mockMarketData
    });
  } catch (error) {
    console.error('Error fetching market updates:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch market updates'
    });
  }
};

/**
 * @desc    Access live currency exchange data
 * @route   GET /api/external/currency
 * @access  Public
 */
exports.getCurrencyExchange = async (req, res) => {
  try {
    // In a real implementation, this would call an actual currency exchange API
    // For now, we'll return mock data
    const mockCurrencyData = {
      base: 'INR',
      date: '2025-05-09',
      rates: {
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0094,
        JPY: 1.82,
        AUD: 0.018,
        CAD: 0.016,
        SGD: 0.016,
        AED: 0.044
      },
      lastUpdated: '2025-05-09T10:30:00Z'
    };

    res.status(200).json({
      success: true,
      data: mockCurrencyData
    });
  } catch (error) {
    console.error('Error fetching currency exchange data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch currency exchange data'
    });
  }
};