/**
 * Overview Handler
 * Listens for data updates and refreshes UI without page reload
 */
class SimpleOverviewHandler {
    constructor() {
        this.plantManager = window.plantManager || new PlantManager();
        this.plants = [];
        this.rooms = [];
        
        // Listen for data updates from PlantManager
        this.setupDataUpdateListener();
    }

    /**
     * Initialize overview page
     */
    async init() {
        console.log('Loading overview page...');
        
        try {
            this.showLoading();
            
            // Load plant data (PlantManager handles caching and refresh logic)
            if (!this.plantManager.isLoaded) {
                await this.plantManager.initialize();
            }
            
            // Update UI with current data
            this.updateWithCurrentData();
            this.showDashboard();
            
        } catch (error) {
            console.error('Failed to load overview:', error);
            this.showError(error);
        }
    }

    /**
     * Listen for real-time data updates from PlantManager
     * Updates UI smoothly without page reload when new data arrives
     */
    setupDataUpdateListener() {
        window.addEventListener('plantDataUpdated', (event) => {
            console.log('Received data update notification');
            this.updateWithCurrentData();
            this.updateLastRefreshTime();
        });
    }

    /**
     * Update UI with current data from PlantManager
     * Called both on initial load and on data refresh
     */
    updateWithCurrentData() {
        // Get fresh data from PlantManager
        this.plants = this.plantManager.getAllPlants();
        this.rooms = this.plantManager.getAllRooms();
        
        console.log(`Updating UI with ${this.plants.length} plants in ${this.rooms.length} rooms`);
        
        // Update room health calculations
        this.updateRoomHealth();
        
        // Refresh all UI components
        this.renderRoomCards();
        this.updateEnvironmentalSummary();
        this.updateSystemStatus();
    }

    /**
     * Update health calculations for all rooms
     */
    updateRoomHealth() {
        for (const room of this.rooms) {
            room.updateFromPlants(this.plantManager);
        }
    }

    /**
     * Update last refresh timestamp in UI
     */
    updateLastRefreshTime() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const now = new Date().toLocaleTimeString();
            lastUpdateElement.textContent = now;
            
            // Add visual feedback for refresh
            lastUpdateElement.style.color = '#28a745';
            setTimeout(() => {
                lastUpdateElement.style.color = '';
            }, 1000);
        }
    }

    /**
     * Show/hide loading states
     */
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
                    <button onclick="window.plantManager.forceRefresh()" class="btn btn-sm btn-primary ms-2">Retry</button>
                </div>
            `;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Render room summary cards with current data
     */
    renderRoomCards() {
        const container = document.getElementById('room-summary-cards');
        if (!container) return;

        let html = '';

        for (const room of this.rooms) {
            const roomPlants = this.plantManager.getPlantsByRoom(room.id);
            const healthClass = this.getHealthClass(room.averageHealth);
            
            // Calculate aggregated metrics
            const avgMoisture = this.calculateAverage(roomPlants, 'moisture');
            const avgTemp = this.calculateAverage(roomPlants, 'temperature');
            const avgLight = this.calculateAverage(roomPlants, 'light');
            const avgHumidity = this.calculateAverage(roomPlants, 'humidity');
            
            // Room summary card - matches Environmental Overview style
            html += `
                <div class="col-md-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title">${room.name}</h5>
                            <div class="room-metrics">
                                <div class="metric-summary">
                                    <strong>Plants:</strong> ${roomPlants.length}<br>
                                    <strong>Health:</strong> <span class="${healthClass}">${room.averageHealth}%</span>
                                </div>
                                <div class="environmental-summary mt-3">
                                    <div>💧 Moisture: ${avgMoisture}%</div>
                                    <div>🌡️ Temperature: ${avgTemp}°C</div>
                                    <div>☀️ Light: ${avgLight} lux</div>
                                    <div>💦 Humidity: ${avgHumidity}%</div>
                                </div>
                            </div>
                            <a href="room.html?id=${room.id}" class="btn btn-success w-100 mt-3">
                                View ${roomPlants.length} Plants →
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    calculateAverage(plants, metric) {
        const values = plants.map(p => p.data[metric]).filter(v => v != null);
        if (values.length === 0) return 'N/A';
        
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Format based on metric type (like Environmental Overview)
        switch(metric) {
            case 'temperature': return `${avg.toFixed(1)}`;
            case 'humidity':
            case 'moisture': return `${Math.round(avg)}`;
            case 'light': return `${Math.round(avg)}`;
            default: return avg.toString();
        }
    }

    /**
     * Update environmental summary with current averages
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
     * Update system status information
     */
    updateSystemStatus() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const now = new Date().toLocaleTimeString();
            lastUpdateElement.textContent = now;
        }
        
        // Update plant count in status
        const totalPlants = this.plants.length;
        const statusElement = document.querySelector('.card-text');
        if (statusElement && totalPlants > 0) {
            statusElement.innerHTML = `
                <span class="status-dot active"></span> 
                Monitoring ${totalPlants} plants across ${this.rooms.length} rooms
            `;
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

    /**
     * Manual refresh button handler
     */
    async refreshData() {
        try {
            this.showLoading();
            await this.plantManager.forceRefresh();
            this.showDashboard();
        } catch (error) {
            this.showError(error);
        }
    }
}

// Export globally
window.SimpleOverviewHandler = SimpleOverviewHandler;