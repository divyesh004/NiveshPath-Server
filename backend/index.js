const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const courseRoutes = require('./routes/course.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const toolsRoutes = require('./routes/tools.routes');
const externalRoutes = require('./routes/external.routes');

// Import middleware
const { errorHandler } = require('./middlewares/error.middleware');

// Initialize Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(compression()); // Add compression for all responses
app.use(express.json({ limit: '1mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parse URL-encoded bodies

// Use morgan in development mode only
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // In production, only log errors
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Set security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/external', externalRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'NiveshPath API is run' });
});

// Apply error handling middleware
app.use(errorHandler);

// Connect to MongoDB with optimized settings
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/niveshpath';
mongoose.connect(MONGODB_URI, {
  // These options improve MongoDB connection performance
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5,  // Maintain at least 5 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Add MongoDB connection error handler
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Add MongoDB connection success handler
mongoose.connection.once('open', () => {
  console.log('MongoDB connection established successfully');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes