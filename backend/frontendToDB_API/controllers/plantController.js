/**
 * Plant Controller - API endpoints for plant data
 */
const PlantDiscovery = require('../services/plantDiscovery');
const influxService = require('../services/influx');

/**
 * API health check endpoint
 */
function healthCheck(req, res) {
  res.json({
    status: 'ok',
    service: 'Plant Monitoring API',
    timestamp: new Date().toISOString()
  });
}

/**
 * Discover all plants from database
 */
async function discoverAll(req, res) {
  try {
    // Use the discovery service
    const data = await PlantDiscovery.discoverAllPlants();
    res.json(data);
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({
      error: 'Failed to discover plants',
      message: error.message
    });
  }
}

/**
 * Get data for specific plant
 */
async function getPlantData(req, res) {
  try {
    const plantId = req.params.id;
    
    // Use the discovery service for single plant
    const plantInfo = await PlantDiscovery.getPlantInfo(plantId);
    
    if (!plantInfo) {
      return res.status(404).json({
        error: `Plant ${plantId} not found`
      });
    }
    
    res.json(plantInfo);
  } catch (error) {
    console.error('Error getting plant data:', error);
    res.status(500).json({
      error: 'Failed to get plant data',
      message: error.message
    });
  }
}

/**
 * Test InfluxDB connection
 */
async function testConnection(req, res) {
  try {
    const result = await influxService.testConnection();
    res.json({
      success: true,
      message: 'InfluxDB connection working!',
      details: result
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'InfluxDB connection failed',
      error: error.message
    });
  }
}

module.exports = {
  healthCheck,
  discoverAll,
  getPlantData,
  testConnection
};