# NiveshPath Backend

Backend implementation for NiveshPath - AI-Driven Personal Finance Education Platform for Indian users.

## Project Structure

The backend follows a modular architecture with the following structure:

```
/backend
│
├── config/              # Configuration files
├── controllers/         # Request handlers
├── middlewares/         # Custom middleware functions
├── models/              # MongoDB schema definitions
├── routes/              # API route definitions
├── services/            # Business logic and external service integrations
├── utils/               # Utility functions and helpers
├── .env                 # Environment variables
├── package.json         # Project dependencies
└── server.js           # Entry point
```

## API Endpoints

### Authentication
- POST /api/auth/register – Register a new user
- POST /api/auth/login – Authenticate and log in the user

### User Profile
- GET /api/user/profile – Retrieve user profile details
- PUT /api/user/profile – Update user profile information

### Onboarding
- POST /api/onboarding – Submit onboarding information

### Courses
- GET /api/courses – Retrieve a list of available finance courses
- GET /api/courses/:id – Get details of a specific course by ID
- POST /api/courses/:id/progress – Update a user's course progress
- GET /api/courses/:id/progress – Retrieve a user's progress for a specific course

### AI Chatbot
- POST /api/chatbot/query – Submit a query to the AI chatbot
- GET /api/chatbot/history – Retrieve the user's chat history

### Finance Tools
- POST /api/tools/sip – Calculate SIP (Systematic Investment Plan)
- POST /api/tools/emi – Calculate EMI (Equated Monthly Installment)
- POST /api/tools/budget – Use the budget planner tool

### External APIs
- GET /api/external/rbi-news – Get updates from the RBI and other financial news sources
- GET /api/external/markets – Fetch stock market updates (NSE/BSE)
- GET /api/external/currency – Access live currency exchange data

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

3. Start the development server:
   ```
   npm run dev
   ```

4. For production:
   ```
   npm start
   ```

## Database Models

- **users**: Authentication credentials
- **profiles**: Detailed user profiles
- **courses**: Educational courses on finance
- **userProgress**: Tracks user's progress in courses
- **chatbotSessions**: Logs user queries and AI chatbot responses

## Technologies Used

- Express.js – Backend framework
- Mongoose – MongoDB object modeling
- bcryptjs – Password hashing
- jsonwebtoken – JWT-based authentication
- dotenv – Environment variable management
- cors – Cross-Origin Resource Sharing
- express-validator – Input validation
- winston / morgan – Logging
- express-rate-limit – API rate limiting