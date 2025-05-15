const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

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
app.use(express.json());
app.use(morgan('dev'));

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

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/niveshpath';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes