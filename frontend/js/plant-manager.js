/**
 * Plant Management System
 * Scalable with data comparison
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
        // Return default thresholds for all plants
        return this.defaultThresholds;
    }
}

/**
 * PlantManager - Main controller with refresh
 * Checks for data changes every five minutes and only updates UI when needed
 */
class PlantManager {
    constructor(apiClient = window.PlantAPI) {
        this.api = apiClient;
        this.plants = new Map(); // Store all plants
        this.rooms = new Map();  // Store all rooms
        this.thresholds = new PlantThresholds();
        this.isLoaded = false;
        this.refreshStarted = false;
        this.lastUpdateTime = null;
    }

    /**
     * Initialise with optimized data comparison
     * Only updates UI when actual data changes are detected
     */
    async initialize() {
        console.log('Checking for plant data updates...');
        
        try {
            // Fetch fresh data from API
            const response = await this.api.discoverPlants();
            
            // Fast comparison: Check if data has actually changed
            if (this.hasDataChanged(response)) {
                console.log('Data changes detected - updating UI');
                
                // Update plant and room objects with new data
                this.updatePlantData(response);
                this.lastUpdateTime = new Date();
                
                // Notify UI components that data has changed
                this.notifyDataUpdated(true);
                
            } else {
                console.log('No data changes detected - keeping current UI');
                
                this.notifyDataUpdated(false); // false = no data changes
            }
            
            this.isLoaded = true;
            
            // Start auto-refresh timer only on first initialization
            if (!this.refreshStarted) {
                this.startSmartAutoRefresh();
                this.refreshStarted = true;
            }
            
        } catch (error) {
            console.error('Failed to load plant data:', error);
            throw error;
        }
    }

    /**
     * Data comparison
     * Uses early exit pattern and number comparisons for better performance
     */
    hasDataChanged(newResponse) {
        // Quick check: Has the number of plants changed?
        if (newResponse.plants.length !== this.plants.size) {
            console.log(`Plant count changed: ${this.plants.size} → ${newResponse.plants.length}`);
            return true;
        }
        
        // If no existing plants
        if (this.plants.size === 0) {
            return true;
        }
        
        // Check each plant for changes
        for (const newPlantData of newResponse.plants) {
            const existingPlant = this.plants.get(newPlantData.id);
            
            // New plant detected
            if (!existingPlant) {
                console.log(`New plant detected: ${newPlantData.id}`);
                return true;
            }
            
            // Fast comparisons
            const oldData = existingPlant.data;
            const newData = newPlantData.data;
            
            // Check all sensor values + room assignment
            // Uses OR operator with early exit - stops at first difference found
            if (oldData.temperature !== newData.temperature ||
                oldData.humidity !== newData.humidity ||
                oldData.moisture !== newData.moisture ||
                oldData.light !== newData.light ||
                existingPlant.room !== newPlantData.room) {
                
                console.log(`Data changed for plant: ${newPlantData.id}`);
                return true; // Early exit - immediately return on first change
            }
        }
        
        // No changes found after checking all plants
        return false;
    }

    /**
     * Update plant and room data with new API response
     */
    updatePlantData(response) {
        // Clear existing data
        this.plants.clear();
        this.rooms.clear();
        
        // Create new Plant objects
        for (const plantData of response.plants || []) {
            const plant = new Plant(plantData, this.thresholds);
            this.plants.set(plant.id, plant);
        }
        
        // Create new Room objects
        for (const roomData of response.rooms || []) {
            const room = new Room(roomData);
            this.rooms.set(room.id, room);
        }
        
        console.log(`Updated ${this.plants.size} plants in ${this.rooms.size} rooms`);
    }

    /**
     * Notify UI components about data updates
     */
    notifyDataUpdated(dataChanged = true) {
        const event = new CustomEvent('plantDataUpdated', {
            detail: {
                plants: this.getAllPlants(),
                rooms: this.getAllRooms(),
                timestamp: new Date(),
                totalPlants: this.plants.size,
                totalRooms: this.rooms.size,
                dataChanged: dataChanged,
                lastUpdateTime: this.lastUpdateTime
            }
        });
        window.dispatchEvent(event);
        
        console.log(`Sent plantDataUpdated event (dataChanged: ${dataChanged})`);
    }

    /**
     * Start auto-refresh timer
     * Checks for data changes every five minutes
     * Only updates UI when actual changes are detected
     */
    startSmartAutoRefresh() {
        setInterval(async () => {
            console.log('Auto-refresh: Checking for data changes...');
            try {
                // Call initialize() which handles data comparison automatically
                await this.initialize();
            } catch (error) {
                console.error('Auto-refresh failed:', error);
                // Don't throw error - let the app continue running
            }
        }, 300000); // Check every five minutes
        
        console.log('Smart auto-refresh started (five minutes interval, UI updates only when data changes)');
    }

    /**
     * Force refresh (manual) - always updates UI regardless of data changes
     */
    async forceRefresh() {
        console.log('Force refreshing plant data...');
        try {
            // Get fresh data
            const response = await this.api.discoverPlants();
            
            // Force update regardless of changes
            this.updatePlantData(response);
            this.lastUpdateTime = new Date();
            
            // Always notify UI on manual refresh
            this.notifyDataUpdated(true);
            
            return true;
        } catch (error) {
            console.error('Force refresh failed:', error);
            throw error;
        }
    }

    // Getter methods for accessing plant and room data
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
        this.thresholds = thresholds;
        
        // Calculate health when plant is created
        this.calculateHealth();
    }

    /**
     * Calculate plant health percentage (0-100%)
     * Based on sensor values compared to optimal thresholds
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
            
            // Scoring system: optimal=100, warning=50, critical=0
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

        // Calculate average health percentage
        if (sensorCount > 0) {
            this.health = Math.round(totalScore / sensorCount);
        } else {
            this.health = 0;
        }

        // Set status based on health percentage
        this.status = this.getStatusFromHealth(this.health);
    }

    /**
     * Get status category based on health percentage
     */
    getStatusFromHealth(health) {
        if (health >= 80) return 'optimal';   // Green
        if (health >= 40) return 'warning';   // Yellow
        return 'critical';                    // Red
    }

    /**
     * Get formatted value for display in UI
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
        
        // Same logic as health calculation
        if (value >= threshold.optimal[0] && value <= threshold.optimal[1]) {
            return 'optimal';
        } else if ((value >= threshold.warning[0] && value <= threshold.warning[1]) || 
                   (value >= threshold.warning[2] && value <= threshold.warning[3])) {
            return 'warning';
        } else {
            return 'critical';
        }
    }

    // Public getter methods
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
        
        // Calculate average health of all plants in room
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

// Export classes globally for use in other scripts
window.PlantManager = PlantManager;