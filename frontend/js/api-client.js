/**
 * API Client
 */
class PlantAPIClient {
    constructor(config = window.PlantConfig) {
        this.baseURL = config.API.BASE_URL;
        this.isOnline = true;
    }

    async request(endpoint) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url); // HTTP request created
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`); // error handling
            }
            
            const data = await response.json(); //parse json to js object
            this.isOnline = true; // update status
            return data;
            
        } catch (error) {
            this.isOnline = false;
            throw error;
        }
    }

    async discoverPlants() {
        return await this.request('/discover');
    }

    async getPlantData(plantId) {
        return await this.request(`/plants/${plantId}`);
    }
}

// Export to global instance of class
window.PlantAPI = new PlantAPIClient();