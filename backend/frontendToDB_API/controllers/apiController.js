/**
 * API Controller
 * Handles all API endpoints
 */
const influxService = require('../services/influx');

// Inline async handler to avoid external dependency
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Simple error class
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }

  static badRequest(message) {
    return new ApiError(message, 400);
  }

  static notFound(message) {
    return new ApiError(message, 404);
  }
}

/**
 * Health check endpoint
 */
function healthCheck(req, res) {
  res.json({
    status: 'ok',
    message: 'API server is running'
  });
}

/**
 * Test InfluxDB connection
 */
const testConnection = asyncHandler(async (req, res) => {
  const buckets = await influxService.testConnection();
  res.json({
    success: true,
    message: 'InfluxDB connection working!',
    connected: true
  });
});

/**
 * Get all plant IDs
 */
const getAllPlants = asyncHandler(async (req, res) => {
  const plants = await influxService.getPlants();
  res.json(plants);
});

/**
 * Get latest values for a specific plant
 */
const getPlantLatestValues = asyncHandler(async (req, res) => {
  const plantId = req.params.id;

  if (!plantId) {
    throw ApiError.badRequest('Plant ID is required');
  }

  const data = await influxService.getLatestPlantValues(plantId);

  if (!data || Object.keys(data).length === 0) {
    throw ApiError.notFound(`No data found for plant ID: ${plantId}`);
  }

  res.json(data);
});

/**
 * Get all room IDs
 */
const getAllRooms = asyncHandler(async (req, res) => {
  const rooms = await influxService.getRooms();
  res.json(rooms);
});

/**
 * Get summary for a specific room
 */
const getRoomSummary = asyncHandler(async (req, res) => {
  const roomId = req.params.id;

  if (!roomId) {
    throw ApiError.badRequest('Room ID is required');
  }

  const data = await influxService.getRoomSummary(roomId);

  if (!data || Object.keys(data).length === 0) {
    throw ApiError.notFound(`No data found for room ID: ${roomId}`);
  }

  res.json(data);
});

/**
 * Debug endpoint to view raw data
 */
const getDebugData = asyncHandler(async (req, res) => {
  const data = await influxService.getDebugData();
  res.json({
    dataFound: data.length > 0,
    sampleCount: data.length,
    sampleData: data.slice(0, 3),
    message: data.length > 0 ? 'Data found in database' : 'No data found in database'
  });
});

/**
 * Get schema information
 */
const getSchema = asyncHandler(async (req, res) => {
  const schema = await influxService.getSchemaInfo();
  res.json(schema);
});

module.exports = {
  healthCheck,
  testConnection,
  getAllPlants,
  getPlantLatestValues,
  getAllRooms,
  getRoomSummary,
  getDebugData,
  getSchema
};