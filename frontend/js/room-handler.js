/**
 * Room Page Handler
 * Uses PlantManager for centralized data handling and health calculation
 */
class SimpleRoomHandler {
    constructor(roomId) { // takes roomId as parameter
        this.roomId = roomId;
        this.plantManager = window.plantManager || new PlantManager(); // uses PlantManager class for handling data
        this.plants = [];
        this.roomData = null;
    }

    async init() {
        console.log(`Loading ${this.roomId} page...`);
        
        try {
            // Show loading
            this.showLoading();
            
            // Initialize PlantManager if it hasn't been initialized
            if (!this.plantManager.isLoaded) {
                await this.plantManager.initialize();
            }
            
            // Get plants for this room
            this.plants = this.plantManager.getPlantsByRoom(this.roomId);
            this.roomData = this.plantManager.getRoom(this.roomId);
            
            console.log(`Found ${this.plants.length} plants for ${this.roomId}`);
            
            // Update UI
            this.updateRoomStatus();
            this.updateEnvironmentalSummary();
            this.renderPlants();
            
            // Hide loading
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to load room data:', error);
            this.showError(error);
        }
    }

    showLoading() {
        const loading = document.getElementById('loading-container');
        const container = document.getElementById('room-container');
        if (loading) loading.style.display = 'block';
        if (container) container.style.display = 'none';
    }

    //switch between (as in overview-handler.js)

    hideLoading() {
        const loading = document.getElementById('loading-container');
        const container = document.getElementById('room-container');
        if (loading) loading.style.display = 'none';
        if (container) container.style.display = 'block';
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

    updateRoomStatus() {
        if (!this.plants.length) return;
        
        // Get room health from Room object
        if (this.roomData) {
            this.roomData.updateFromPlants(this.plantManager);
            const avgHealth = this.roomData.averageHealth;
            
            // Update room status
            const statusEl = document.getElementById(`${this.roomId}-status`);
            if (statusEl) {
                statusEl.textContent = `Room Health: ${avgHealth}%`;
                statusEl.className = `room-status ${this.getHealthClass(avgHealth)}`;
            }
        }
    }

    updateEnvironmentalSummary() {
        if (!this.plants.length) return;
        
        const metrics = ['moisture', 'temperature', 'light', 'humidity'];
        
        for (const metric of metrics) {
            const values = this.plants.map(plant => plant.data[metric]).filter(v => v != null);
            
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

    renderPlants() {
        const plantSection = document.getElementById('plant-section');
        if (!plantSection) return;
        
        if (this.plants.length === 0) {
            plantSection.innerHTML = '<div class="col-12"><p>No plants found in this room</p></div>';
            return;
        }
        
        let html = '';
        
        for (const plant of this.plants) { //loop through every plant
            const health = plant.getHealth(); // gets health status and converts to css class
            const healthClass = this.getHealthClass(health);
            
            html += `
                <div class="card plant-card shadow-sm mb-4">
                    <div class="card-header plant-header" onclick="togglePlantPanel('${plant.id}')" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <h5 class="card-title mb-0">${plant.name}</h5> 
                            <div class="d-flex align-items-center">
                                <div class="plant-indicators me-3">
                                    <div class="indicator-item ${plant.getMetricStatus('moisture')}" title="Moisture">
                                        <span>💧</span>
                                    </div>
                                    <div class="indicator-item ${plant.getMetricStatus('temperature')}" title="Temperature">
                                        <span>🌡️</span>
                                    </div>
                                    <div class="indicator-item ${plant.getMetricStatus('light')}" title="Light">
                                        <span>☀️</span>
                                    </div>
                                    <div class="indicator-item ${plant.getMetricStatus('humidity')}" title="Humidity">
                                        <span>💦</span>
                                    </div>
                                </div>
                                <span class="toggle-icon"><span id="toggle-${plant.id}">⌄</span></span>
                            </div>
                        </div>
                    </div>
                    <div class="card-body collapse" id="panel-${plant.id}">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <h5 class="metric-title">Moisture Level</h5>
                                    <div class="chart-container">
                                        <iframe 
                                            src="${this.getGrafanaUrl(plant.id, plant.room, 'moisture')}"
                                            width="100%" 
                                            height="200" 
                                            frameborder="0">
                                        </iframe>
                                    </div>
                                    <div class="metric-status ${plant.getMetricStatus('moisture')}">
                                        <span class="status-icon">💧</span>
                                        <span class="metric-value">${plant.getFormattedValue('moisture')}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <h5 class="metric-title">Temperature</h5>
                                    <div class="chart-container">
                                        <iframe 
                                            src="${this.getGrafanaUrl(plant.id, plant.room, 'temperature')}"
                                            width="100%" 
                                            height="200" 
                                            frameborder="0">
                                        </iframe>
                                    </div>
                                    <div class="metric-status ${plant.getMetricStatus('temperature')}">
                                        <span class="status-icon">🌡️</span>
                                        <span class="metric-value">${plant.getFormattedValue('temperature')}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <h5 class="metric-title">Light Intensity</h5>
                                    <div class="chart-container">
                                        <iframe 
                                            src="${this.getGrafanaUrl(plant.id, plant.room, 'light')}"
                                            width="100%" 
                                            height="200" 
                                            frameborder="0">
                                        </iframe>
                                    </div>
                                    <div class="metric-status ${plant.getMetricStatus('light')}">
                                        <span class="status-icon">☀️</span>
                                        <span class="metric-value">${plant.getFormattedValue('light')}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <h5 class="metric-title">Humidity</h5>
                                    <div class="chart-container">
                                        <iframe 
                                            src="${this.getGrafanaUrl(plant.id, plant.room, 'humidity')}"
                                            width="100%" 
                                            height="200" 
                                            frameborder="0">
                                        </iframe>
                                    </div>
                                    <div class="metric-status ${plant.getMetricStatus('humidity')}">
                                        <span class="status-icon">💦</span>
                                        <span class="metric-value">${plant.getFormattedValue('humidity')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        plantSection.innerHTML = html;
    }

    getGrafanaUrl(plantId, roomId, metric) {
        // Get Grafana configuration from PlantConfig
        const baseUrl = window.PlantConfig.GRAFANA.BASE_URL;
        const dashboardSlug = window.PlantConfig.GRAFANA.DASHBOARD_UID;
        const dashboardTitle = 'dynamic-plant-monitoring-dashboard';
        const orgId = window.PlantConfig.GRAFANA.ORG_ID;
        const panelId = window.PlantConfig.GRAFANA.DEFAULT_PANELS[metric.toUpperCase()];
        
        if (!panelId) {
            console.warn(`No panel found for metric: ${metric}`);
            return '';
        }
        
        // Generate URL matching grafana format
        const url = `${baseUrl}/d-solo/${dashboardSlug}/${dashboardTitle}?` +
                   `orgId=${orgId}&` +
                   `timezone=browser&` +
                   `var-plantid=${plantId}&` +
                   `var-roomid=${roomId}&` +
                   `refresh=10s&` +
                   `theme=light&` +
                   `panelId=${panelId}&` +
                   `__feature.dashboardSceneSolo`;
        
        console.log(`Generated Grafana URL for ${plantId} ${metric}:`, url);
        return url;
    }

    getHealthClass(health) {
        if (health >= 80) return 'optimal';
        if (health >= 40) return 'warning';
        return 'critical';
    }
}

// Global toggle function for plant panels
function togglePlantPanel(plantId) {
    const panel = document.getElementById(`panel-${plantId}`);
    const icon = document.getElementById(`toggle-${plantId}`);
    
    if (!panel) return;
    
    if (panel.style.display === 'none' || panel.style.display === '') {
        $(panel).slideDown(200);
        if (icon) icon.textContent = '⌃';
    } else {
        $(panel).slideUp(200);
        if (icon) icon.textContent = '⌄';
    }
}

// Export for global use
window.SimpleRoomHandler = SimpleRoomHandler;