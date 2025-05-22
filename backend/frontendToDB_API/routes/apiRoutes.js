/**
 * API Routes
 */
const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');

// Health check
router.get('/health', plantController.healthCheck);

// Main endpoint - gets all plants
router.get('/discover', plantController.discoverAll);

// Individual plant data (hvis du vil beholde den)
router.get('/plants/:id', plantController.getPlantData);

// Test endpoint (fjern i production)
router.get('/test', plantController.testConnection);

module.exports = router;