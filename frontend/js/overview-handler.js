/**
 * Simple Overview Handler - main logic for overview page
 * Uses PlantManager for centralised data handling and health calculation
 */
class SimpleOverviewHandler {
    constructor() {
        this.plantManager = window.plantManager || new PlantManager();
        this.plants = [];
        this.rooms = [];
        this.summary = {};
    }

    async init() {
        console.log('Loading overview page...');
        
        try {
            // Show loading for spinner
            this.showLoading();
            
            // Initialize PlantManager if it hasn't been initialized
            if (!this.plantManager.isLoaded) {
                await this.plantManager.initialize();
            }
            
            // Get data from plantManager
            this.plants = this.plantManager.getAllPlants();
            this.rooms = this.plantManager.getAllRooms();
            this.summary = this.plantManager.discovery?.summary || {};
            
            console.log(`Found ${this.plants.length} plants in ${this.rooms.length} rooms`);
            
            // Update room health calculations
            this.updateRoomHealth();
            
            // Update UI
            this.renderRoomCards();
            this.updateEnvironmentalSummary();
            this.updateSystemStatus();
            
            // Hide loading and show dashboard
            this.showDashboard();
            
        } catch (error) {
            console.error('Failed to load overview data:', error);
            this.showError(error);
        }
    }

    updateRoomHealth() {
        // Update health for all rooms
        for (const room of this.rooms) {
            room.updateFromPlants(this.plantManager);
        }
    }

    showLoading() {
        const loading = document.getElementById('loading-container');
        const dashboard = document.getElementById('dashboard-container');
        if (loading) loading.style.display = 'block'; // show block (css display property)
        if (dashboard) dashboard.style.display = 'none'; // hide element (css display property)
    }

    // switching between showloading and showdashboard

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

    renderRoomCards() {
        const container = document.getElementById('room-summary-cards'); // find html element where room cards will be inserted
        if (!container) return;

        let html = ''; // empty string to gather html build

        for (const room of this.rooms) { // loop through all rooms 
            const roomPlants = this.plantManager.getPlantsByRoom(room.id); // get plants for specific rooms
            const healthClass = this.getHealthClass(room.averageHealth); // css class based on room health (optimal/warning/critical)

            // Generate plant items for every plant in the room (nested loop)
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

            // Room page links (used for dynamic link in View Details button)
            const roomPages = {
                'livingRoom': 'livingRoom.html',
                'kitchen': 'kitchen.html',
                'bedroom': 'bedroom.html'
            };
            // Build room card html with bootstrap styles
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
                            <a href="${roomPages[room.id] || '#'}" class="btn btn-outline-success w-100 mt-3">View Details</a>
                        </div>
                    </div>
                </div>
            `; //template literals
        }

        container.innerHTML = html; //replace initial content of container with all the new room cards
    }

    updateEnvironmentalSummary() {
        const metrics = ['temperature', 'humidity', 'moisture', 'light']; // metric array defined
        
        for (const metric of metrics) { //loops through each individual metric
            const values = this.plants 
                .map(plant => plant.data[metric]) //extract specific metric from each plant
                .filter(v => v != null); //removes any(v) null or undefined values
            
            if (values.length > 0) {
                const avg = values.reduce((sum, val) => sum + val, 0) / values.length; // calculated average
                const element = document.getElementById(`${metric}-summary`); // find specifc html element
                
                if (element) {
                    let displayText;
                    switch(metric) {
                        case 'temperature':
                            displayText = `Average: ${avg.toFixed(1)}°C`; //fixed to 1 decimal
                            break;
                        case 'humidity':
                        case 'moisture':
                            displayText = `Average: ${avg.toFixed(0)}%`; //fixed to 0 decimal
                            break;
                        case 'light':
                            displayText = `Average: ${avg.toFixed(0)} lux`;
                            break;
                    }
                    element.textContent = displayText; //update html
                }
            }
        }
    }

    updateSystemStatus() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const now = new Date().toLocaleTimeString();
            lastUpdateElement.textContent = now;
        }
    }

    getHealthClass(health) { // convert health percent to css
        if (health >= 80) return 'optimal'; // green
        if (health >= 40) return 'warning'; // yellow
        return 'critical'; // red
    }
}

// Export to global
window.SimpleOverviewHandler = SimpleOverviewHandler;