/**
 * Global error handling middleware
 */
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(val => val.message)
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({
      status: 'error',
      message: 'Duplicate key error',
      error: err.message
    });
  }

  // Send error response only if headers haven't been sent yet
  if (!res.headersSent) {
    res.status(status).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};

/**
 * Not found middleware
 */
exports.notFound = (req, res, next) => {
  // Only proceed if headers haven't been sent yet
  if (!res.headersSent) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
  }
};