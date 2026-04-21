const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for proper IP detection behind load balancers
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '10mb' })); // Increase payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database
const { initDatabase } = require('./database');

// Import middleware
const { logger, errorLogger } = require('./middleware/logger');
const { generalLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimit');

// Apply logging middleware
app.use(logger);

// Import routes (SQLite versions)
const authRoutes = require('./routes/auth-sqlite');
const shipmentRoutes = require('./routes/shipments-sqlite');
const userRoutes = require('./routes/users-sqlite');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply rate limiting to routes
app.use('/api/auth', authLimiter.middleware(), authRoutes);
app.use('/api/shipments', apiLimiter.middleware(), shipmentRoutes);
app.use('/api/users', generalLimiter.middleware(), userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    console.log('SQLite database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
