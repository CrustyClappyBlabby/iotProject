/**
 * API Routes
 */
const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');

// Health check
router.get('/health', plantController.healthCheck);

// Test InfluxDB connection  
router.get('/test', plantController.testConnection);

// Main endpoint - gets all plants
router.get('/discover', plantController.discoverAll);

// Individual plant data
router.get('/plants/:id', plantController.getPlantData);

module.exports = router;