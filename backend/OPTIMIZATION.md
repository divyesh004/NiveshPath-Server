NiveshPath Backend Optimization
Changes Made
To optimize the NiveshPath backend, the following changes were implemented:

1. Caching Mechanism
A new service cache.service.js has been added for in-memory caching.

Two cache instances have been created:

chatbotCache: For chatbot responses (30-minute TTL)

userProfileCache: For user profiles (1-hour TTL)

Caching has been added for frequently asked questions.

Caching added for conversation context.

2. Database Query Optimization
MongoDB connection settings have been optimized.

Usage of lean() to improve query performance.

Pagination queries optimized.

Reduced unnecessary countDocuments calls.

3. Response Compression
compression middleware has been added.

Compression applied to all API responses.

Special compression applied to chatbot routes.

4. Performance Monitoring
Response time tracking middleware added.

Logging added for slow responses (more than 500ms).

X-Response-Time header added.

5. Security Enhancements
Security headers implemented.

JSON body size limit enforced.

Performance Benefits
Reduced database queries due to caching.

Reduced network bandwidth usage due to compression.

Improved scalability from optimized MongoDB connection.

Instant response for frequently asked queries.

Future Improvements
Implement Redis caching (currently commented out).

Further optimize indexing for query results.

Add monitoring system for performance metrics.

Usage
No additional configuration is required. All optimizations are applied automatically.

npm install   # To install new dependencies
npm run dev   # To start the development server