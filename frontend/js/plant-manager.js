/**
* Plant Thresholds - Manages sensor thresholds for health calculation
* Consists of four classes:
* 1. PlantThresholds - limits
* 2. PlantManager - controller of all plant data
* 3. Plant - a singe plant
* 4: Room - a room with plants
*/
class PlantThresholds {
   constructor() {
       // Default array of thresholds matching Grafana dashboard values
       this.defaultThresholds = {
           temperature: {
               min: 15,
               max: 28,
               optimal: [18, 25],
               warning: [15, 18, 25, 28], // Yellow ranges [low1-low2, high1-high2]
               critical: [0, 15, 28, 40] // Red ranges [min-low, high-max]
           },
           humidity: {
               min: 30,
               max: 70,
               optimal: [40, 60],
               warning: [30, 40, 60, 70],
               critical: [0, 30, 70, 100]
           },
           moisture: {
               min: 30,
               max: 70,
               optimal: [40, 60],
               warning: [30, 40, 60, 70],
               critical: [0, 30, 70, 100]
           },
           light: {
               min: 300,
               max: 1200,
               optimal: [500, 1000],
               warning: [300, 500, 1000, 1200],
               critical: [0, 300, 1200, 3000]
           }
       };
       
       // Custom thresholds for specific plants (later)
       this.customThresholds = new Map();
   }

   /**
    * Get thresholds for a specific plant (not implemented fully yet)
    */
   getThresholds(plantId, plantType = 'unknown') {
       // Check for custom thresholds first
       if (this.customThresholds.has(plantId)) {
           return this.customThresholds.get(plantId);
       }
       
       // Return default thresholds
       return this.defaultThresholds;
   }

   /**
    * Set custom thresholds for a specific plant (also not yet)
    */
   setCustomThresholds(plantId, thresholds) {
       this.customThresholds.set(plantId, { ...this.defaultThresholds, ...thresholds });
   }
}

class PlantManager {
   constructor(config = window.PlantConfig, apiClient = window.PlantAPI) {
       this.config = config;
       this.api = apiClient;
       
       // Data storage
       this.plants = new Map(); //all plants
       this.rooms = new Map(); //all rooms
       this.discovery = null;  // Initially null - will be set by discoverPlants()
       
       // Threshold management for health calculation
       this.thresholds = new PlantThresholds();
       
       // States of initializing
       this.isLoaded = false;
       this.isLoading = false;
       this.lastUpdate = null;
       
       // Auto-update timer
       this.updateTimer = null;
   }

   /**
    * Initialize the plant manager
    */
   async initialize() {
       console.log('Initializing Plant Manager...');
       
       try {
           await this.discoverPlants(); //fetch data from API
           this.startAutoUpdate(); //start auto-refresh
           this.isLoaded = true;
           return true;
       } catch (error) {
           console.error('Plant manager initialization failed:', error);
           throw error;
       }
   }

   /**
    * Discover all plants from the backend API and create objects accordingly
    */
   async discoverPlants() {
       if (this.isLoading) return this.discovery; // prevents duplicate call
       
       this.isLoading = true; // loading flag
       
       try {
           console.log('Discovering plants...');
           
           // Get data from backend API
           const response = await this.api.discoverPlants();
           
           // Store the response
           this.discovery = response;
           
           // Create Plant objects with health calculation
           this.plants.clear(); // clear existing map
           for (const plant of this.discovery.plants || []) {
               this.plants.set(plant.id, new Plant(plant, this.thresholds)); //saves health calculation in map with plant.id as key
           }
           
           // Create Room objects
           this.rooms.clear();
           for (const room of this.discovery.rooms || []) {
               this.rooms.set(room.id, new Room(room));
           }
           
           console.log(`Discovered ${this.plants.size} plants in ${this.rooms.size} rooms`);
           
           return this.discovery;
           
       } catch (error) {
           console.error('Plant discovery failed:', error);
           throw error;
       } finally {
           this.isLoading = false;
       }
   }

   /**
    * Update data for a specific plant
    */
   async updatePlantData(plantId) {
       const plant = this.plants.get(plantId);
       if (!plant) {
           throw new Error(`Plant ${plantId} not found`);
       }
       
       try {
           const response = await this.api.getPlantData(plantId);
           if (response.success) {
               plant.updateData(response.plant.data);
               return plant;
           }
       } catch (error) {
           console.error(`Failed to update plant ${plantId}:`, error);
           throw error;
       }
   }

   /**
    * Update all plant data
    */
   async updateAllPlants() {
       for (const plantId of this.plants.keys()) {
           try {
               await this.updatePlantData(plantId); // calls updatePlantData for each
           } catch (error) {
               console.warn(`Failed to update ${plantId}:`, error);
           }
       }
       
       console.log(`Updated all plants`);
   }

   // Getter methods
   getPlant(plantId) {
       return this.plants.get(plantId);
   }

   getAllPlants() {
       return Array.from(this.plants.values());
   }

   getPlantsByRoom(roomId) {
       return this.getAllPlants().filter(plant => plant.room === roomId);
   }

   getRoom(roomId) {
       return this.rooms.get(roomId);
   }

   getAllRooms() {
       return Array.from(this.rooms.values());
   }

   /**
    * Start auto-update timer
    */
   startAutoUpdate() {
       if (!this.config.UI.AUTO_REFRESH) return;
       
       this.stopAutoUpdate(); // Clear existing timer
       
       this.updateTimer = setInterval(async () => {
           console.log('Auto-updating plant data...');
           try {
               await this.updateAllPlants();
           } catch (error) {
               console.error('Auto-update failed:', error);
           }
       }, this.config.UI.UPDATE_INTERVAL);
       
       console.log(`Auto-update started (${this.config.UI.UPDATE_INTERVAL}ms interval)`);
   }

   /**
    * Stop auto-update timer
    */
   stopAutoUpdate() {
       if (this.updateTimer) {
           clearInterval(this.updateTimer);
           this.updateTimer = null;
       }
   }

   /**
    * Cleanup resources
    */
   destroy() { // cleanup when dashboard is closed
       this.stopAutoUpdate();
       this.plants.clear();
       this.rooms.clear();
       console.log('Plant Manager destroyed');
   }
}

/**
* Plant class - Represents a single plant with health calculation
*/
class Plant {
   constructor(plantData, thresholds) {
       this.id = plantData.id;
       this.name = plantData.name;
       this.room = plantData.room;
       
       // Sensor data
       this.data = plantData.data || {};
       this.lastUpdate = new Date();
       
       // Threshold manager for health calculation
       this.thresholds = thresholds;
       
       // Calculated values
       this.health = 0;
       this.status = 'unknown';
       this.metricStatuses = {};
       
       // Calculate health on creation
       this.calculateHealth();
       this.calculateMetricStatuses();
   }

   /**
    * Update plant data and recalculate health
    */
   updateData(newData) {
       this.data = { ...newData };
       this.lastUpdate = new Date();
       
       this.calculateHealth();
       this.calculateMetricStatuses();
   }

   /**
    * Calculate plant health percentage based on sensor thresholds
    */
   calculateHealth() {
   // Early exit if no sensor data available
   if (!this.data || Object.keys(this.data).length === 0) {
       this.health = 0;
       this.status = 'unknown';
       return;
   }

   // Get plant-specific sensor thresholds
   const thresholds = this.thresholds.getThresholds(this.id);
   
   // Calculate health score for each valid sensor reading
   let totalScore = 0;
   let validSensorCount = 0;

   for (const sensorName in this.data) {
       const sensorValue = this.data[sensorName];
       const sensorThreshold = thresholds[sensorName];
       
       // Skip sensors with missing values or no thresholds
       if (sensorValue == null || !sensorThreshold) {
           continue;
       }
       
       // Calculate score for this sensor (0, 50, or 100 points)
       const sensorScore = this.scoreMetric(sensorValue, sensorThreshold);
       totalScore += sensorScore;
       validSensorCount++;
   }

   // Handle case where no valid sensors found
   if (validSensorCount === 0) {
       this.health = 0;
       this.status = 'unknown';
       return;
   }

   // Calculate average health percentage
   this.health = Math.round(totalScore / validSensorCount);
   
   // Set status based on health percentage
   this.status = this.getStatusFromHealth(this.health);
   }

   /**
    * Calculate health score for a single sensor (0, 50, or 100 points)
    */
   scoreMetric(value, threshold) {
       // Optimal range (100 points)
       if (value >= threshold.optimal[0] && value <= threshold.optimal[1]) {
           return 100;
       }
       
       // Warning ranges (50 points) - check both ranges
       if ((value >= threshold.warning[0] && value <= threshold.warning[1]) || 
           (value >= threshold.warning[2] && value <= threshold.warning[3])) {
           return 50;
       }
       
       // Critical range (0 points)
       return 0;
   }

   /**
    * Determine status based on health percentage
    */
   getStatusFromHealth(health) {
       if (health >= 80) return 'optimal';
       if (health >= 40) return 'warning';
       if (health > 0) return 'critical';
       return 'unknown';
   }

   /**
    * Calculate status for each individual metric
    */
   calculateMetricStatuses() {
       this.metricStatuses = {};
       const thresholds = this.thresholds.getThresholds(this.id);
       
       for (const [metric, value] of Object.entries(this.data)) {
           if (value == null || !thresholds[metric]) {
               this.metricStatuses[metric] = 'unknown';
               continue;
           }
           
           const thresh = thresholds[metric];
           
           // Determine status for this metric using detailed thresholds
           if (value >= thresh.optimal[0] && value <= thresh.optimal[1]) {
               // Value is in optimal (green) range
               this.metricStatuses[metric] = 'optimal';
           } else if ((value >= thresh.warning[0] && value <= thresh.warning[1]) || 
                      (value >= thresh.warning[2] && value <= thresh.warning[3])) {
               // Value is in one of the warning (yellow) ranges
               this.metricStatuses[metric] = 'warning';
           } else {
               // Value is in one of the critical (red) ranges
               this.metricStatuses[metric] = 'critical';
           }
       }
   }

   /**
    * Get formatted value for display
    */
   getFormattedValue(metric) {
       const value = this.data[metric];
       if (value == null) return 'N/A';
       
       switch (metric.toLowerCase()) {
           case 'temperature':
               return `${value}°C`;
           case 'humidity':
           case 'moisture':
               return `${value}%`;
           case 'light':
               return `${value} lux`;
           default:
               return value.toString();
       }
   }

   // Getter methods
   getMetricStatus(metric) {
       return this.metricStatuses[metric] || 'unknown';
   }

   getHealth() {
       return this.health;
   }

   getStatus() {
       return this.status;
   }

   needsAttention() {
       return this.status === 'warning' || this.status === 'critical';
   }
}

/**
* Room class - Represents a room with plants
*/
class Room {
   constructor(roomData) {
       this.id = roomData.id;
       this.name = roomData.name;
       this.plants = roomData.plants || [];
       this.averageHealth = 0;
       this.status = 'unknown';
   }

   /**
    * Calculate room statistics from plant manager
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
       
       // Determine room status based on plant conditions (three zones as described)
       const critical = roomPlants.filter(plant => plant.getStatus() === 'critical').length;
       const needsAttention = roomPlants.filter(plant => plant.needsAttention()).length;
       
       if (critical > 0) {
           this.status = 'critical';
       } else if (needsAttention > 0) {
           this.status = 'warning';
       } else if (this.averageHealth >= 80) {
           this.status = 'optimal';
       } else {
           this.status = 'warning';
       }
   }
}

// Export to global scope
window.PlantManager = PlantManager;
window.Plant = Plant;
window.Room = Room;
window.PlantThresholds = PlantThresholds;