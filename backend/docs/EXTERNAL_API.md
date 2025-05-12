# External API Integration Guide

## Yahoo Finance API

NiveshPath server obtains real-time stock market and currency exchange data using the Yahoo Finance API. This integration is implemented in the `external.controller.js` file.

### Setup Instructions

1. Install the required package:
   ```bash
   npm install yahoo-finance2
   ```

2. No API key is required in the `.env` file, as the Yahoo Finance API is free and publicly available.

### Usage

#### Stock Market Updates

```javascript
// Get stock market updates
GET /api/external/markets
```

This endpoint provides the following data:
- NSE (NIFTY 50) and BSE (SENSEX) index values, changes, and percentage changes
- Top gainers (3 stocks)
- Top losers (3 stocks)

#### Currency Exchange Data

```javascript
// Get currency exchange data
GET /api/external/currency
```

This endpoint provides exchange rates for various currencies in reference to INR (USD, EUR, GBP, JPY, etc.).

### Error Handling

When API calls fail, the system provides fallback data so that the application continues to function. The fallback data includes a message that informs the user that live data is unavailable.

### Rate Limits

The Yahoo Finance API has rate limits. To avoid excessive requests, we have implemented the following measures:

1. A 10-second timeout is set for API calls
2. Batching is used to retrieve data for multiple stocks/currency pairs in a single request
3. Detailed logging has been added to diagnose any issues

### Notes

- The Yahoo Finance API is unofficial and not officially supported by Yahoo
- Future changes to the API may occur, which may require code updates
- For production use, consider an alternative or official API such as Alpha Vantage, Finnhub, or the official APIs of NSE/BSE