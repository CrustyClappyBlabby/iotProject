/**
 * Plant Discovery Service
 * Discovers plants and data from InfluxDB
 */
const influxService = require('./influx');

// Cache to avoid repeated database calls
let cache = {
    data: null,
    timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // keeps cache for 5 minutes

/**
 * Discover all plants and organize them by rooms
 */
async function discoverAllPlants() {
    // Return cached data if still valid
    if (cache.data && (Date.now() - cache.timestamp < CACHE_DURATION)) {
        return cache.data;
    }

    try {
        // Get all plant IDs from database
        const plantIds = await influxService.getPlants();
        
        // Get data for each plant
        const plantPromises = plantIds.map(id => getPlantInfo(id));
        const plantResults = await Promise.all(plantPromises);
        
        // Filter out null results
        const plants = plantResults.filter(plant => plant !== null);
        
        // Organize data and update cache
        const result = {
            plants,
            rooms: groupByRooms(plants),
            summary: {
                totalPlants: plants.length,
                totalRooms: new Set(plants.map(p => p.room)).size,
                lastUpdate: new Date()
            }
        };
        
        // Update cache
        cache.data = result;
        cache.timestamp = Date.now();
        
        return result;

    } catch (error) {
        console.error('Error discovering plants:', error);
        throw error;
    }
}

/**
 * Get information for a specific plant
 */
async function getPlantInfo(plantId) {
    try {
        // Get sensor data from InfluxDB
        const [sensorData, roomId] = await Promise.all([
            influxService.getLatestPlantValues(plantId),
            influxService.getPlantRoom(plantId)  // <-- ÆNDRET HER
        ]);
        
        // Skip plants without data or room assignment
        if (!sensorData || !roomId) {
            return null;
        }
        
        return {
            id: plantId,
            name: plantId,
            room: roomId,
            data: sensorData // Raw sensor values
        };

    } catch (error) {
        console.error(`Error discovering plant ${plantId}:`, error);
        return null;
    }
}

/**
 * Organize plants by rooms
 */
function groupByRooms(plants) {
    const roomMap = {};
    
    // Group plants by room
    plants.forEach(plant => {
        if (!roomMap[plant.room]) {
            roomMap[plant.room] = {
                id: plant.room,
                name: plant.room, // Just use the ID as name
                plants: []
            };
        }
        // Add plant ID to room
        roomMap[plant.room].plants.push(plant.id);
    });
    
    return Object.values(roomMap);
}

module.exports = {
    discoverAllPlants,
    getPlantInfo
};