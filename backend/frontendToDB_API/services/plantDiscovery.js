/**
 * Plant Discovery Service
 * Discovers plants and data from InfluxDB
 */
const influxService = require('./influx');

class PlantDiscoveryService {
    constructor() {
        // Simple cache to avoid repeated database calls
        this.cache = {
            data: null,
            lastUpdate: null
        };
        this.cacheTimeout = 5 * 60 * 1000; // keeps cache for 5 minutes
    }

    /**
     * Discover all plants and organize them by rooms
     */
    async discoverAllPlants() {
        // Return cached data if still valid
        if (this.isCacheValid()) {
            return this.cache.data;
        }

        const plants = [];
        
        try {
            // Get all plant IDs from database
            const plantIds = await influxService.getPlants();
            console.log('Found plant IDs:', plantIds);

            // Get data for each plant
            for (const plantId of plantIds) {
                const plantInfo = await this.discoverPlantInfo(plantId);
                if (plantInfo) {
                    plants.push(plantInfo);
                }
            }

            // Organize data and update cache
            const result = this.organizeData(plants);
            this.updateCache(result);
            
            return result;

        } catch (error) {
            console.error('Error discovering plants:', error);
            throw error;
        }
    }

    /**
     * Get information for a specific plant
     */
    async discoverPlantInfo(plantId) {
        try {
            // Get sensor data from InfluxDB
            const data = await influxService.getLatestPlantValues(plantId);
            
            // Get room information from database tags
            const roomId = await this.getRoomFromDB(plantId);
            
            // Skip plants without data or room assignment
            if (!data || !roomId) {
                console.warn(`Skipping ${plantId}: missing data or room`);
                return null;
            }
            
            return {
                id: plantId,
                name: this.generatePlantName(plantId),
                room: roomId,
                data: data // Raw sensor values
            };

        } catch (error) {
            console.error(`Error discovering plant ${plantId}:`, error);
            return null;
        }
    }

    /**
     * Get room ID from InfluxDB tags
     */
    async getRoomFromDB(plantId) {
    try {
        const query = `
            from(bucket: "${process.env.INFLUX_BUCKET || 'PlantMeasurements'}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "plant_test")
            |> filter(fn: (r) => r.Plant_ID == "${plantId}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> limit(n: 1)
        `;
        
        const result = await influxService._executeFluxQuery(query);
        
        // Step 1: Check if we got any results
        if (!result) {
            console.log(`No results for plant ${plantId}`);
            return null;
        }
        
        // Step 2: Check if array has items
        if (result.length === 0) {
            console.log(`Empty results for plant ${plantId}`);
            return null;
        }
        
        // Step 3: Get first item
        const firstItem = result[0];
        
        // Step 4: Check if room_ID exists
        if (firstItem.room_ID) {
            return firstItem.room_ID;
        } else {
            console.log(`No room_ID found for plant ${plantId}`);
            return null;
        }
        
    } catch (error) {
        console.error(`Error getting room for ${plantId}:`, error);
        return null;
    }
}

    /**
     * Organize plants by rooms
     */
    organizeData(plants) {
        const rooms = new Map();
        
        // Group plants by room
        for (const plant of plants) {
            if (!rooms.has(plant.room)) {
                rooms.set(plant.room, {
                    id: plant.room,
                    name: this.friendlyRoomName(plant.room),
                    plants: []
                });
            }
            
            // Add plant ID to room
            rooms.get(plant.room).plants.push(plant.id);
        }

        // Return structure that matches frontend PlantManager
        return {
            plants,
            rooms: Array.from(rooms.values()),
            summary: {
                totalPlants: plants.length,
                totalRooms: rooms.size,
                lastUpdate: new Date()
            }
        };
    }

    /**
     * Convert room ID to readable name
     */
    friendlyRoomName(roomId) {
        const nameMap = {
            'living-room': 'Living Room',
            'livingRoom': 'Living Room',  // Handle both formats
            'kitchen': 'Kitchen',
            'bedroom': 'Bedroom'
        };
        
        return nameMap[roomId] || roomId;
    }

    // Cache management
    isCacheValid() {
        // Check if we have cache data
        if (!this.cache.lastUpdate) {
            return false;
        }
        
        // Check if cache is still fresh
        const now = Date.now();
        const cacheAge = now - this.cache.lastUpdate;
        
        if (cacheAge < this.cacheTimeout) {
            return true;  // Cache is still valid
        } else {
            return false; // Cache is too old
        }
    }

    updateCache(data) {
        this.cache.data = data;
        this.cache.lastUpdate = Date.now();
    }
}

module.exports = PlantDiscoveryService;