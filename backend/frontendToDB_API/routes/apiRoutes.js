/**
 * API Routes
 * All routes for the IoT Plant Monitoring API
 */
const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// Health check
router.get('/health', apiController.healthCheck);

// Test InfluxDB connection
router.get('/test', apiController.testConnection);

// System information endpoints (combining debug and schema)
router.get('/system/diagnostics', apiController.getDebugData);
router.get('/system/schema', apiController.getSchema);

// Plant routes
router.get('/plants', apiController.getAllPlants);
router.get('/plants/:id/latest', apiController.getPlantLatestValues);

// Room routes
router.get('/rooms', apiController.getAllRooms);
router.get('/rooms/:id/summary', apiController.getRoomSummary);

module.exports = router;