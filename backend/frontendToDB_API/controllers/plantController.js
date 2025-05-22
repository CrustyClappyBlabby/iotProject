/**
 * Plant Controller - API endpoints for plant data
 */
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
    // Step 1: Get all plant IDs from InfluxDB
    console.log('Getting all plants from database...');
    const plantIds = await influxService.getPlants();
    console.log('Found plant IDs:', plantIds);
    
    const plants = [];
    
    // Step 2: Get data for each plant ("for each plant ID in the list, get data for that plant")
    for (const plantId of plantIds) {
      try {
        console.log(`Getting data for plant: ${plantId}`);
        
        // Get latest sensor data
        const data = await influxService.getLatestPlantValues(plantId);
        
        // Get room assignment
        const room = await getRoomFromDatabase(plantId);
        
        // Only include plants with both data and room
        if (data && room) {
          plants.push({
            id: plantId,
            name: plantId,
            room: room,
            data: data
          });
          console.log(`Successfully processed ${plantId}`);
        } else {
          console.log(`Skipping ${plantId} - missing data or room`);
        }
      } catch (plantError) {
        console.error(`Error processing plant ${plantId}:`, plantError);
        // Continue with next plant
      }
    }
    
    // Step 3: Organize plants by rooms
    const rooms = organizeByRooms(plants);
    
    // Step 4: Send response
    res.json({
      plants: plants,
      rooms: rooms,
      summary: {
        totalPlants: plants.length,
        totalRooms: rooms.length,
        lastUpdate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({
      error: 'Failed to discover plants',
      message: error.message
    });
  }
}

/**
 * Get room_ID from InfluxDB for a specific plant
 */
async function getRoomFromDatabase(plantId) {
  try {
    // Simple query to get room for this plant
    const query = `
      from(bucket: "${process.env.INFLUX_BUCKET || 'SensorData'}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "sensorData")
        |> filter(fn: (r) => r.Plant_ID == "${plantId}")
        |> group(columns: ["room_ID"])
        |> distinct(column: "room_ID")
        |> limit(n: 1)
    `;
    
    const result = await influxService._executeFluxQuery(query);
    
    if (result && result.length > 0) {
      // Return room_ID value directly without modification
      return result[0].room_ID;
    } else {
      console.log(`No room found for plant ${plantId}`);
      return null;
    }
    
  } catch (error) {
    console.error(`Error getting room for ${plantId}:`, error);
    return null;
  }
}

/**
 * Get data for specific plant
 */
async function getPlantData(req, res) {
  try {
    const plantId = req.params.id;
    console.log(`Getting data for plant: ${plantId}`);
    
    // Get latest sensor data
    const data = await influxService.getLatestPlantValues(plantId);
    
    // Get room assignment
    const room = await getRoomFromDatabase(plantId);
    
    if (!data) {
      return res.status(404).json({
        error: `No sensor data found for plant ${plantId}`
      });
    }
    
    if (!room) {
      return res.status(404).json({
        error: `No room assignment found for plant ${plantId}`
      });
    }
    
    // Send response
    res.json({
      id: plantId,
      name: plantId, // Just use the ID as name
      room: room,
      data: data
    });
    
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
    console.log('Testing InfluxDB connection...');
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

// Helper function: Organize plants by rooms
function organizeByRooms(plants) {
  const roomMap = {};
  
  // Group plants by room
  plants.forEach(plant => {
    const roomId = plant.room;
    
    // If room doesn't exist in map, create it
    if (!roomMap[roomId]) {
      roomMap[roomId] = {
        id: roomId,
        name: makeRoomNameFriendly(roomId),
        plants: []
      };
    }
    
    // Add plant ID to this room
    roomMap[roomId].plants.push(plant.id);
  });
  
  // Convert object to array
  return Object.values(roomMap);
}

// Helper function: Make room names user-friendly
function makeRoomNameFriendly(roomId) {
  const friendlyNames = {
    'living-room': 'Living Room',
    'living_room': 'Living Room',
    'kitchen': 'Kitchen', 
    'bedroom': 'Bedroom'
  };
  
  // Use friendly name if available, otherwise format the ID
  return friendlyNames[roomId] || roomId.replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

module.exports = {
  healthCheck,
  discoverAll,
  getPlantData,
  testConnection
};