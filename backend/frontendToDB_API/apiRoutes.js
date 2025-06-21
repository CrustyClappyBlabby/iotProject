/**
 * API Routes
 * Handles all API endpoints for plant monitoring
 */

const express = require('express');
const router = express.Router();
const plantService = require('./plantService');

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Plant Monitoring API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Main discovery endpoint - returns all plants and rooms
 * This is what your frontend expects
 */
router.get('/discover', async (req, res) => {
  try {
    console.log('Discovery request received');
    
    // Get all plant data using scalable bulk query
    const data = await plantService.discoverAllPlants();
    
    console.log(`Returning ${data.plants.length} plants in ${data.rooms.length} rooms`);
    res.json(data);
    
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({
      error: 'Failed to discover plants',
      message: error.message,
      success: false
    });
  }
});

module.exports = router;