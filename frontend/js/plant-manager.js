/**
 * Plant Management System
 * Object-oriented design
 */

/**
 * PlantThresholds - Manages sensor thresholds for health calculation
 */
class PlantThresholds {
    constructor() {
        // Threshold ranges for realistic plant health calculation
        this.defaultThresholds = {
            temperature: {
                optimal: [18, 25],        // Green: 100 points
                warning: [15, 18, 25, 28], // Yellow: 50 points  
                critical: [0, 15, 28, 40]  // Red: 0 points
            },
            humidity: {
                optimal: [40, 60],
                warning: [30, 40, 60, 70],
                critical: [0, 30, 70, 100]
            },
            moisture: {
                optimal: [40, 60],
                warning: [30, 40, 60, 70],
                critical: [0, 30, 70, 100]
            },
            light: {
                optimal: [500, 1000],
                warning: [300, 500, 1000, 1200],
                critical: [0, 300, 1200, 3000]
            }
        };
    }

    /**
     * Get thresholds for a plant
     */
    getThresholds(plantId) {
        // For simplicity, return default thresholds for all plants
        return this.defaultThresholds;
    }
}

/**
 * PlantManager - Main controller for all plant data
 */
class PlantManager {
    constructor(apiClient = window.PlantAPI) {
        this.api = apiClient;
        this.plants = new Map(); // Store all plants
        this.rooms = new Map();  // Store all rooms
        this.thresholds = new PlantThresholds(); // Threshold management
        this.isLoaded = false;
        this.refreshStarted = false; // Track if auto-refresh is already started
    }

    /**
     * Initialize by fetching data from API
     */
    async initialize() {
        console.log('Loading plant data...');
        
        try {
            // Get data from backend API
            const response = await this.api.discoverPlants();
            
            // Create Plant objects
            this.plants.clear();
            for (const plantData of response.plants || []) {
                const plant = new Plant(plantData, this.thresholds);
                this.plants.set(plant.id, plant);
            }
            
            // Create Room objects
            this.rooms.clear();
            for (const roomData of response.rooms || []) {
                const room = new Room(roomData);
                this.rooms.set(room.id, room);
            }
            
            this.isLoaded = true;
            console.log(`Loaded ${this.plants.size} plants in ${this.rooms.size} rooms`);
            
            // Start auto-refresh only on first initialization
            if (!this.refreshStarted) {
                this.startAutoRefresh();
                this.refreshStarted = true;
            }
            
        } catch (error) {
            console.error('Failed to load plant data:', error);
            throw error;
        }
    }



    /**
     * Convert room ID from database format to frontend format
     * Example: 'living_room' -> 'livingRoom'
     */
    normalizeRoomId(roomId) {
        if (roomId === 'living_room') return 'livingRoom';
        if (roomId === 'dining_room') return 'diningRoom';
        return roomId;
    }

    // Getter methods
    getAllPlants() {
        return Array.from(this.plants.values());
    }

    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    getPlantsByRoom(roomId) {
        return this.getAllPlants().filter(plant => plant.room === roomId);
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    /**
     * Start auto-refresh every 30 seconds
     */
    startAutoRefresh() {
        // Refresh entire page every 30 seconds
        setInterval(() => {
            console.log('Auto-refreshing page...');
            window.location.reload();
        }, 30000); // 30 seconds
        
        console.log('Auto-refresh started (30 second interval)');
    }
}

/**
 * Plant - Represents a single plant with health calculation
 */
class Plant {
    constructor(plantData, thresholds) {
        this.id = plantData.id;
        this.name = plantData.name;
        this.room = plantData.room;
        this.data = plantData.data || {};
        this.thresholds = thresholds; // Reference to threshold manager
        
        // Calculate health when plant is created
        this.calculateHealth();
    }

    /**
     * Calculate plant health percentage (0-100%)
     */
    calculateHealth() {
        if (!this.data || Object.keys(this.data).length === 0) {
            this.health = 0;
            this.status = 'unknown';
            return;
        }

        // Get thresholds for this plant
        const thresholds = this.thresholds.getThresholds(this.id);
        
        let totalScore = 0;
        let sensorCount = 0;

        // Check each sensor against thresholds
        for (const [sensor, value] of Object.entries(this.data)) {
            if (value == null || !thresholds[sensor]) continue;
            
            const threshold = thresholds[sensor];
            let score = 0;
            
            // Realistic scoring with three ranges
            if (value >= threshold.optimal[0] && value <= threshold.optimal[1]) {
                score = 100; // Optimal range
            } else if ((value >= threshold.warning[0] && value <= threshold.warning[1]) || 
                       (value >= threshold.warning[2] && value <= threshold.warning[3])) {
                score = 50;  // Warning ranges
            } else {
                score = 0;   // Critical ranges
            }
            
            totalScore += score;
            sensorCount++;
        }

        // Calculate average health
        if (sensorCount > 0) {
            this.health = Math.round(totalScore / sensorCount);
        } else {
            this.health = 0;
        }

        // Set status based on health
        this.status = this.getStatusFromHealth(this.health);
    }

    /**
     * Get status category based on health percentage
     */
    getStatusFromHealth(health) {
        if (health >= 80) return 'optimal';
        if (health >= 40) return 'warning';
        return 'critical';
    }

    /**
     * Get formatted value for display
     */
    getFormattedValue(sensor) {
        const value = this.data[sensor];
        if (value == null) return 'N/A';
        
        switch (sensor) {
            case 'temperature': return `${value}°C`;
            case 'humidity':
            case 'moisture': return `${value}%`;
            case 'light': return `${value} lux`;
            default: return value.toString();
        }
    }

    /**
     * Get status for individual sensor
     */
    getSensorStatus(sensor) {
        const value = this.data[sensor];
        if (value == null) return 'unknown';
        
        const thresholds = this.thresholds.getThresholds(this.id);
        if (!thresholds[sensor]) return 'unknown';
        
        const threshold = thresholds[sensor];
        
        // Check ranges like in health calculation
        if (value >= threshold.optimal[0] && value <= threshold.optimal[1]) {
            return 'optimal';
        } else if ((value >= threshold.warning[0] && value <= threshold.warning[1]) || 
                   (value >= threshold.warning[2] && value <= threshold.warning[3])) {
            return 'warning';
        } else {
            return 'critical';
        }
    }

    // Getter methods
    getHealth() { return this.health; }
    getStatus() { return this.status; }
    getMetricStatus(metric) { return this.getSensorStatus(metric); }
}

/**
 * Room - Represents a room containing plants
 */
class Room {
    constructor(roomData) {
        this.id = roomData.id;
        this.name = roomData.name;
        this.averageHealth = 0;
        this.status = 'unknown';
    }

    /**
     * Update room health based on plants in the room
     */
    updateFromPlants(plantManager) {
        const roomPlants = plantManager.getPlantsByRoom(this.id);
        
        if (roomPlants.length === 0) {
            this.averageHealth = 0;
            this.status = 'unknown';
            return;
        }
        
        // Calculate average health of all plants
        const totalHealth = roomPlants.reduce((sum, plant) => sum + plant.getHealth(), 0);
        this.averageHealth = Math.round(totalHealth / roomPlants.length);
        
        // Set room status based on average health
        if (this.averageHealth >= 80) {
            this.status = 'optimal';
        } else if (this.averageHealth >= 40) {
            this.status = 'warning';
        } else {
            this.status = 'critical';
        }
    }
}

// Export classes globally
window.PlantManager = PlantManager;
window.Plant = Plant;
window.Room = Room;
window.PlantThresholds = PlantThresholds;