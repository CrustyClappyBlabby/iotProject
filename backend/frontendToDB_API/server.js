/**
 * InfluxDB API Server
 * This server provides endpoints to access data from InfluxDB
 */

// Import required packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT;

// Enable CORS for cross-origin requests (all domains can call API)
app.use(cors());
app.use(express.json());

// Import API routes
const apiRoutes = require('./routes/apiRoutes.js');

// Basic root route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Mount API routes
app.use('/api', apiRoutes);

// Simple error handling
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});