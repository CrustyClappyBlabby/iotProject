/**
 * Plant Monitoring API Server
 * Main Express server setup
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import API routes
const apiRoutes = require('./apiRoutes');

// Mount API routes
app.use('/api', apiRoutes);

// Global error handling
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Plant monitoring server running on http://localhost:${port}`);
});