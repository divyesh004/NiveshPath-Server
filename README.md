NiveshPath – AI-Driven Personal Finance Education Platform
Version: 2.1
Author: [Your Name]
Date: 2025-05-09

1. Objective
To develop a robust educational platform focused on personal finance for Indian users. The platform will utilize the MERN stack and integrate an AI-powered chatbot to assist with education, budgeting, and investment advisory.

2. High-Level System Flow
[User] ──▶ [Frontend (React)] ──▶ [Backend (Express API)] ──▶ [Database (MongoDB)]
              │                           │
              │                           ├──▶ [AI Chatbot (Mistral API via Gateway)]
              │                           └──▶ [Finance Tools APIs (SIP/EMI, Budget)]
              │
              └──▶ [External APIs: RBI News, Currency Exchange, NSE/BSE Feeds]
3. UI/UX Flow (Frontend)
Technologies:
React.js (with functional components and hooks)

Tailwind CSS or Bootstrap for responsive design

React Router DOM for page navigation

Toastify for notifications

Axios for API calls

Context API or Redux for state management (to be decided based on complexity)

Page Structure:
Landing Page – Hero banner, intro to NiveshPath, call to action

Register/Login Page – Authentication forms with password validation and error handling

Onboarding Survey Page – Collect demographic, psychological, and ethnographic inputs

Dashboard – Personalized user dashboard with:

Learning path recommendations

Quick access to tools (SIP, EMI, Budget)

Latest finance news widget

Course Listing Page – Browse all courses

Course Details Page – Show modules, description, instructor details, enroll button

Progress Tracker Page – Visual course progress with current module tracking

Finance Tools Pages:

SIP Calculator

EMI Calculator

Budget Planner

Chatbot Page or Component – Fixed floating chatbot on all pages or accessible from the menu

Profile Settings Page – Update personal information and preferences

UX Features:
Mobile-first design

Dark mode toggle

Breadcrumb navigation for multi-step onboarding

Loading skeletons during data fetching

Empty state UI for unused tools or no progress

4. Backend (Node.js + Express)
4.1 Key Endpoints (REST APIs)
🔐 Authentication
POST /api/auth/register – Register a new user

POST /api/auth/login – Authenticate and log in the user

👤 User Profile
GET /api/user/profile – Retrieve user profile details

PUT /api/user/profile – Update user profile information

🧭 Onboarding
POST /api/onboarding – Submit onboarding information including demographic, psychological, and ethnographic data

📚 Courses
GET /api/courses – Retrieve a list of available finance courses

GET /api/courses/:id – Get details of a specific course by ID

POST /api/courses/:id/progress – Update a user’s course progress

GET /api/courses/:id/progress – Retrieve a user’s progress for a specific course

🤖 AI Chatbot
POST /api/chatbot/query – Submit a query to the AI chatbot

GET /api/chatbot/history – Retrieve the user’s chat history

📊 Finance Tools
POST /api/tools/sip – Calculate SIP (Systematic Investment Plan)

POST /api/tools/emi – Calculate EMI (Equated Monthly Installment)

POST /api/tools/budget – Use the budget planner tool

📰 External APIs
GET /api/external/rbi-news – Get updates from the RBI and other financial news sources

GET /api/external/markets – Fetch stock market updates (NSE/BSE)

GET /api/external/currency – Access live currency exchange data

4.2 Middleware
JWT Auth Middleware – Secures protected routes

Role Middleware – Distinguishes between admin and user roles

Request Validator – Validates request bodies using Joi or Zod

Error Handler – Manages consistent error responses across the platform

Rate Limiter – Controls API rate limits to prevent abuse

Logger – Implements logging with Winston and Morgan

4.3 Folder Structure (API)
/backend
│
├── controllers/
├── routes/
├── models/
├── middlewares/
├── services/
├── utils/
└── config/
4.4 Tools & Libraries
Express.js – Backend framework

Mongoose – MongoDB object modeling

bcryptjs – Password hashing

jsonwebtoken – JWT-based authentication

dotenv – Environment variable management

cors – Cross-Origin Resource Sharing

express-validator / Joi – Input validation

winston / morgan – Logging

5. Database Design (MongoDB)
Collections Overview

users: Contains authentication credentials like email, hashed password, and role (user/admin).

Fields: _id, email, passwordHash, role, createdAt

Indexes: email (unique)

profiles: Stores detailed user profiles linked to the users collection.

Fields: _id, userId (ref: users._id), age, income, riskAppetite, goals, onboardingData

Indexes: userId

courses: Contains educational courses on finance.

Fields: _id, title, description, level, duration, modules[]

userProgress: Tracks a user’s progress in a course.

Fields: _id, userId, courseId, progressPercentage, currentModule

Compound Index: userId + courseId

chatbotSessions: Logs user queries and AI chatbot responses.

Fields: _id, userId, query, response, timestamp

Indexes: userId, timestamp

Relationships:

profiles.userId references users._id

userProgress.userId references users._id

userProgress.courseId references courses._id

chatbotSessions.userId references users._id

Indexing Strategy:

Unique indexes on email for fast lookup

Compound indexes for user progress filtering by course and user

Timestamps indexed for chronological chatbot history retrieval

6. External APIs
API Endpoints: Descriptions of specific endpoints with methods (GET, POST, etc.).

Authentication: How to authenticate API requests (e.g., API keys, OAuth).

Request & Response Formats: Details of how data is sent and received (e.g., JSON, XML).

Error Handling: Common errors and how to resolve them.

7. AI Chatbot Architecture
In this section, the design and operation of the AI-powered chatbot should be described, including the use of Mistral API and how it interacts with the platform.

7.1. Mistral API Integration
API Endpoint: POST /api/chatbot/query

Description: A user submits queries to the chatbot, which is powered by Mistral AI.

Flow:

The user submits a query to the chatbot through the platform's interface.

The request is forwarded to the Mistral API, where AI processes the query.

The response is sent back to the platform and displayed to the user.

7.2. Query Flow
User Input: The user asks a financial question (e.g., "What are the tax implications of SIP?").

AI Processing: Mistral AI analyzes the query to determine intent, extract relevant data, and generate a response.

Response: The AI provides a response, which could include financial tips, tools, or recommendations based on the user's profile.

7.3. Chatbot History
API Endpoint: GET /api/chatbot/history

Description: Retrieve the past conversations between the user and the chatbot for reference.

Usage: Helps users track their previous interactions, so they don’t need to repeat queries.

8. Data Flow Diagram (DFD)
Level 0 - Context Diagram
[User] ──▶ [NiveshPath Platform]
    ├───▶ [AI Chatbot]
    ├───▶ [Finance Education Content System]
    ├───▶ [Finance Tools (SIP, EMI, Budget)]
    └───▶ [External Data Sources (RBI, NSE, Currency APIs)]
Level 1 - Functional Breakdown
[User]
 ├──▶ [Auth Service] ──▶ [MongoDB - Users]
 ├──▶ [Onboarding Module] ──▶ [MongoDB - Profiles]
 ├──▶ [Course Module]
 │       ├──▶ [Content Service] ──▶ [MongoDB - Courses]
 │       └──▶ [Progress Tracker] ──▶ [MongoDB - User Progress]
 ├──▶ [Chatbot Interface] ──▶ [Mistral AI Gateway]
 ├──▶ [Finance Tools]
 │       ├──▶ [SIP Calculator Logic]
 │       ├──▶ [EMI Calculator Logic]
 │       └──▶ [Budget Planner Logic]
 └──▶ [External Feeds] ──▶ [Market API, Currency API, RBI News API]
9. CI/CD & Hosting
Deployment Strategy
Frontend Deployment: Deployed on Vercel or Netlify with auto-deployment from the main Git branch.

Backend Deployment: Hosted on Render or Railway, using Docker containerization if necessary.

Database Hosting: MongoDB Atlas for scalable, managed cloud database solution.

CI/CD
GitHub Actions for testing and auto-build triggers

Environment variables managed via .env with secure keys in Vercel/Render Dashboard

Webhooks configured for instant deployment after merges into the production branch

Monitoring Tools
LogRocket or Sentry for frontend error logging

PM2 and Winston logs for backend performance monitoring

MongoDB Atlas monitoring for query performance and alerts

10. Roadmap Summary
[...unchanged content...]

11. User Journey (Example Scenario)
🧑‍🎓 First-Time User:
Lands on the homepage and registers an account

Completes the onboarding survey including demographic and financial behavior data

Enters a personalized dashboard with recommended learning paths and tools

Enrolls in the “Budgeting Basics” course

Uses the SIP Calculator while taking the course

Engages with the AI Chatbot to clarify a financial concept

Completes the course and receives a badge or certificate

Begins receiving curated financial news updates from RBI and NSE

12. Sample API Responses
🔐 Login
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "123456"
}
Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "userId",
    "name": "Test User"
  }
}
📚 Get Courses
GET /api/courses
Response:
[
  {
    "_id": "courseId",
    "title": "Investing 101",
    "level": "Beginner",
    "duration": "4 weeks"
  }
]
📚 Course Progress Update
POST /api/courses/:id/progress
{
  "progress": 40,
  "currentModule": "Risk & Returns"
}
Response:
{
  "message": "Progress updated successfully"
}