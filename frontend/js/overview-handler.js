/**
 * Overview Handler - Main dashboard logic
 */
class SimpleOverviewHandler {
    constructor() {
        this.plantManager = window.plantManager || new PlantManager();
        this.plants = [];
        this.rooms = [];
    }

    /**
     * Initialize overview page
     */
    async init() {
        console.log('Loading overview page...');
        
        try {
            this.showLoading();
            
            // Load plant data
            if (!this.plantManager.isLoaded) {
                await this.plantManager.initialize();
            }
            
            // Get data
            this.plants = this.plantManager.getAllPlants();
            this.rooms = this.plantManager.getAllRooms();
            
            console.log(`Found ${this.plants.length} plants in ${this.rooms.length} rooms`);
            
            // Update room health
            this.updateRoomHealth();
            
            // Update UI
            this.renderRoomCards();
            this.updateEnvironmentalSummary();
            this.updateSystemStatus();
            
            this.showDashboard();
            
        } catch (error) {
            console.error('Failed to load overview:', error);
            this.showError(error);
        }
    }

    /**
     * Update health calculations for all rooms
     */
    updateRoomHealth() {
        for (const room of this.rooms) {
            room.updateFromPlants(this.plantManager);
        }
    }

    showLoading() {
        const loading = document.getElementById('loading-container');
        const dashboard = document.getElementById('dashboard-container');
        if (loading) loading.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
    }

    showDashboard() {
        const loading = document.getElementById('loading-container');
        const dashboard = document.getElementById('dashboard-container');
        if (loading) loading.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
    }

    showError(error) {
        const errorEl = document.getElementById('error-container');
        if (errorEl) {
            errorEl.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${error.message}
                    <button onclick="location.reload()" class="btn btn-sm btn-primary ms-2">Reload</button>
                </div>
            `;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Render room summary cards
     */
    renderRoomCards() {
        const container = document.getElementById('room-summary-cards');
        if (!container) return;

        let html = '';

        for (const room of this.rooms) {
            const roomPlants = this.plantManager.getPlantsByRoom(room.id);
            const healthClass = this.getHealthClass(room.averageHealth);

            // Generate plant list for this room
            let plantItems = '';
            for (const plant of roomPlants) {
                const plantHealth = plant.getHealth();
                const plantHealthClass = this.getHealthClass(plantHealth);
                
                plantItems += `
                    <div class="small-plant-item">
                        <span class="plant-name">${plant.name}</span>
                        <span class="health-percentage ${plantHealthClass}">${plantHealth}%</span>
                    </div>
                `;
            }

            // Dynamic room URL
            const roomUrl = `room.html?id=${room.id}`;
            
            html += `
                <div class="col-md-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title">${room.name}</h5>
                            <div class="summary-stats mt-3 mb-3">
                                <div class="d-flex justify-content-between">
                                    <div>Plants: <strong>${roomPlants.length}</strong></div>
                                    <div>Status: <span class="health-percentage ${healthClass}">${room.averageHealth}%</span></div>
                                </div>
                            </div>
                            <div class="plant-list">
                                ${plantItems}
                            </div>
                            <a href="${roomUrl}" class="btn btn-outline-success w-100 mt-3">View Details</a>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Update environmental summary with averages
     */
    updateEnvironmentalSummary() {
        const metrics = ['temperature', 'humidity', 'moisture', 'light'];
        
        for (const metric of metrics) {
            const values = this.plants 
                .map(plant => plant.data[metric])
                .filter(v => v != null);
            
            if (values.length > 0) {
                const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                const element = document.getElementById(`${metric}-summary`);
                
                if (element) {
                    let displayText;
                    switch(metric) {
                        case 'temperature':
                            displayText = `Average: ${avg.toFixed(1)}°C`;
                            break;
                        case 'humidity':
                        case 'moisture':
                            displayText = `Average: ${avg.toFixed(0)}%`;
                            break;
                        case 'light':
                            displayText = `Average: ${avg.toFixed(0)} lux`;
                            break;
                    }
                    element.textContent = displayText;
                }
            }
        }
    }

    /**
     * Update system status timestamp
     */
    updateSystemStatus() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const now = new Date().toLocaleTimeString();
            lastUpdateElement.textContent = now;
        }
    }

    /**
     * Convert health percentage to CSS class
     */
    getHealthClass(health) {
        if (health >= 80) return 'optimal';
        if (health >= 40) return 'warning';
        return 'critical';
    }
}

// Export globally
window.SimpleOverviewHandler = SimpleOverviewHandler;