/**
 * Room Page Handler - Manages individual room pages
 */
class SimpleRoomHandler {
    constructor(roomId) {
        this.roomId = roomId;
        this.plantManager = window.plantManager || new PlantManager();
        this.roomUtils = new RoomUtils();
        this.plants = [];
        this.roomData = null;
    }

    /**
     * Initialize room page
     */
    async init() {
        console.log(`Loading ${this.roomId} page...`);
        
        try {
            this.showLoading();
            
            // Initialize PlantManager if needed
            if (!this.plantManager.isLoaded) {
                await this.plantManager.initialize();
            }
            
            // Get room data
            this.plants = this.plantManager.getPlantsByRoom(this.roomId);
            this.roomData = this.plantManager.getRoom(this.roomId);
            
            console.log(`Found ${this.plants.length} plants for ${this.roomId}`);
            
            // Update page
            this.updateRoomInfo();
            this.updateEnvironmentalSummary();
            this.renderPlants();
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to load room:', error);
            this.showError(error);
        }
    }

    showLoading() {
        const loading = document.getElementById('loading-container');
        const container = document.getElementById('room-container');
        if (loading) loading.style.display = 'block';
        if (container) container.style.display = 'none';
    }

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

    /**
     * Update room status and title
     */
    updateRoomInfo() {
        if (!this.roomData || this.plants.length === 0) return;
        
        // Update room health
        this.roomData.updateFromPlants(this.plantManager);
        
        // Update room status display
        const statusEl = document.getElementById(`${this.roomId}-status`);
        if (statusEl) {
            statusEl.textContent = `Room Health: ${this.roomData.averageHealth}%`;
            statusEl.className = `room-status ${this.getHealthClass(this.roomData.averageHealth)}`;
        }
        
        // Update page title
        const titleEl = document.getElementById('room-title');
        if (titleEl) {
            titleEl.textContent = this.roomData.name || this.roomId;
        }
    }

    /**
     * Update environmental summary averages
     */
    updateEnvironmentalSummary() {
        if (this.plants.length === 0) return;
        
        const metrics = ['moisture', 'temperature', 'light', 'humidity'];
        
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
     * Render all plants in this room
     */
    renderPlants() {
        const plantSection = document.getElementById('plant-section');
        if (!plantSection) return;
        
        if (this.plants.length === 0) {
            plantSection.innerHTML = '<div class="col-12"><p>No plants found in this room</p></div>';
            return;
        }
        
        let html = '';
        
        for (const plant of this.plants) {
            const health = plant.getHealth();
            const healthClass = this.getHealthClass(health);
            
            html += `
                <div class="card plant-card shadow-sm mb-4">
                    <div class="card-header plant-header" onclick="togglePlantPanel('${plant.id}')" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <h5 class="card-title mb-0">${plant.name}</h5> 
                            <div class="d-flex align-items-center">
                                <div class="plant-indicators me-3">
                                    <div class="indicator-item ${plant.getMetricStatus('moisture')}" title="Moisture">💧</div>
                                    <div class="indicator-item ${plant.getMetricStatus('temperature')}" title="Temperature">🌡️</div>
                                    <div class="indicator-item ${plant.getMetricStatus('light')}" title="Light">☀️</div>
                                    <div class="indicator-item ${plant.getMetricStatus('humidity')}" title="Humidity">💦</div>
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

    /**
     * Generate Grafana chart URL
     */
    getGrafanaUrl(plantId, roomId, metric) {
        const baseUrl = window.PlantConfig.GRAFANA.BASE_URL;
        const dashboardSlug = window.PlantConfig.GRAFANA.DASHBOARD_UID;
        const panelId = window.PlantConfig.GRAFANA.DEFAULT_PANELS[metric.toUpperCase()];
        
        if (!panelId) {
            console.warn(`No panel found for metric: ${metric}`);
            return '';
        }
        
        const now = Date.now();
        const from = now - (7 * 24 * 60 * 60 * 1000); // 7 days back
        
        return `${baseUrl}/d-solo/${dashboardSlug}/dynamic-plant-monitoring-dashboard?` +
               `orgId=1&` +
               `from=${from}&` +
               `to=${now}&` +
               `var-plantid=${plantId}&` +
               `var-roomid=${roomId}&` +
               `panelId=${panelId}&` +
               `theme=light`;
    }

    getHealthClass(health) {
        if (health >= 80) return 'optimal';
        if (health >= 40) return 'warning';
        return 'critical';
    }
}

// Global function for plant panel toggling
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

// Export globally
window.SimpleRoomHandler = SimpleRoomHandler;