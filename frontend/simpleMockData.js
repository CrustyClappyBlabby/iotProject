// simpleMockData.js - Simplified mock data for plant sensors

// Mock data - represents data from sensors via InfluxDB
const plantData = {
    ficus: {
        moisture: 45,  // %
        temperature: 21.5, // °C
        humidity: 35,  // %
        light: 850     // lux
    },
    lily: {
        moisture: 70,  // %
        temperature: 19, // °C
        humidity: 65,  // %
        light: 600     // lux
    },
    cactus: {
        moisture: 5,   // %
        temperature: 25, // °C
        humidity: 15,  // %
        light: 1200    // lux
    },
    herb: {
        moisture: 60,  // %
        temperature: 22, // °C
        humidity: 45,  // %
        light: 900     // lux
    },
    mint: {
        moisture: 65,  // %
        temperature: 20, // °C
        humidity: 50,  // %
        light: 700     // lux
    }
};

// Track statuses for each plant metric to calculate overall health
const plantStatuses = {};

// Update UI elements with data
function updateUI() {
    console.log("Updating UI with new data...");
    
    // Initialize plant statuses if needed
    for (const plantId of Object.keys(plantData)) {
        if (!plantStatuses[plantId]) {
            plantStatuses[plantId] = {
                moisture: 'neutral',
                temperature: 'neutral',
                humidity: 'neutral',
                light: 'neutral'
            };
        }
    }
    
    // Loop through all plants
    for (const [plantId, metrics] of Object.entries(plantData)) {
        // Update each metric for the plant
        for (const [metric, value] of Object.entries(metrics)) {
            // Get status based on thresholds
            const status = getMetricStatus(plantId, metric, value);
            
            // Store the status for overall calculation
            plantStatuses[plantId][metric] = status;
            
            // Update plant metric displays
            updatePlantMetric(plantId, metric, value, status);
        }
        
        // Calculate and update overall plant health
        updatePlantOverallHealth(plantId);
    }
    
    // Update room summaries based on plant statuses
    updateRoomSummaries();
    
    // Update date/time for last update
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleTimeString();
    }
}

// Calculate and update the overall health score for a plant
function updatePlantOverallHealth(plantId) {
    // Skip if no status data for this plant
    if (!plantStatuses[plantId]) return;
    
    // Calculate health score based on all metrics
    // good = 100, warning = 50, bad = 0, neutral = not counted
    let totalScore = 0;
    let metricCount = 0;
    
    for (const [metric, status] of Object.entries(plantStatuses[plantId])) {
        if (status === 'good') {
            totalScore += 100;
            metricCount++;
        } else if (status === 'warning') {
            totalScore += 50;
            metricCount++;
        } else if (status === 'bad') {
            totalScore += 0;
            metricCount++;
        }
        // Neutral values don't count
    }
    
    // Calculate average health score (0-100)
    const healthScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
    
    // Determine status based on health score
    let overallStatus = 'neutral';
    if (metricCount > 0) {
        if (healthScore >= 80) {
            overallStatus = 'good';
        } else if (healthScore >= 40) {
            overallStatus = 'warning';
        } else {
            overallStatus = 'bad';
        }
    }
    
    // Update plant overview status
    updatePlantOverviewDisplay(plantId, healthScore, overallStatus);
}

// Update the overview display with health score
function updatePlantOverviewDisplay(plantId, healthScore, status) {
    // Find the overview status element for this plant
    const overviewStatusElement = document.getElementById(`${plantId}-overview-status`);
    if (overviewStatusElement) {
        // Hide the status badge completely
        overviewStatusElement.style.display = 'none';
    }
    
    // Also hide bedroom status badges
    const bedroomStatusElement = document.getElementById(`${plantId}-bedroom-status`);
    if (bedroomStatusElement) {
        bedroomStatusElement.style.display = 'none';
    }
    
    // Find the health percentage element
    const healthElement = document.getElementById(`${plantId}-health`);
    if (healthElement) {
        // Update the health percentage text
        healthElement.textContent = `${healthScore}%`;
        
        // Update the status class for the health text
        healthElement.classList.remove('good', 'warning', 'bad', 'neutral');
        healthElement.classList.add(status);
    }
    
    // Also handle bedroom variants
    const bedroomHealthElement = document.getElementById(`${plantId}-bedroom-health`);
    if (bedroomHealthElement) {
        bedroomHealthElement.textContent = `${healthScore}%`;
        bedroomHealthElement.classList.remove('good', 'warning', 'bad', 'neutral');
        bedroomHealthElement.classList.add(status);
    }
}

// Update value and status for a specific plant metric
function updatePlantMetric(plantId, metricType, value, status) {
    // Find metric element if it exists
    const metricElement = document.getElementById(`${plantId}-${metricType}-metric`);
    if (!metricElement) return;
    
    // Update styling for the element
    metricElement.className = 'metric-status';
    metricElement.classList.add(status);
    
    // Also update indicators in the header if they exist
    updatePlantIndicator(plantId, metricType, status);
}

// Update room summaries based on plant statuses
function updateRoomSummaries() {
    // Living room plants
    const livingRoomPlants = ['ficus', 'lily', 'cactus'];
    updateRoomStatusSummary('livingroom', livingRoomPlants);
    
    // Kitchen plants
    const kitchenPlants = ['herb', 'mint'];
    updateRoomStatusSummary('kitchen', kitchenPlants);
    
    // Bedroom plants
    const bedroomPlants = ['ficus', 'lily'];
    updateRoomStatusSummary('bedroom', bedroomPlants);
}

// Update room status summary
function updateRoomStatusSummary(roomId, plantIds) {
    const roomHealthElement = document.getElementById(`${roomId}-health`);
    if (!roomHealthElement) return;
    
    // Collect health scores from all plants in this room
    let totalHealthScore = 0;
    let plantCount = 0;
    
    plantIds.forEach(plantId => {
        const healthElement = document.getElementById(`${plantId}-health`) || 
                               document.getElementById(`${plantId}-bedroom-health`);
        
        if (healthElement && healthElement.textContent) {
            // Parse the percentage value
            const healthScore = parseInt(healthElement.textContent.replace('%', ''));
            if (!isNaN(healthScore)) {
                totalHealthScore += healthScore;
                plantCount++;
            }
        }
    });
    
    // Calculate average health score for the room
    const avgHealthScore = plantCount > 0 ? Math.round(totalHealthScore / plantCount) : 0;
    
    // Determine room status based on average health score
    let overallStatus = 'neutral';
    if (plantCount > 0) {
        if (avgHealthScore >= 80) {
            overallStatus = 'good';
        } else if (avgHealthScore >= 40) {
            overallStatus = 'warning';
        } else {
            overallStatus = 'bad';
        }
    }
    
    // Update room health display
    roomHealthElement.textContent = `${avgHealthScore}%`;
    roomHealthElement.classList.remove('good', 'warning', 'bad', 'neutral');
    roomHealthElement.classList.add(overallStatus);
}

// Update indicator in plant header
function updatePlantIndicator(plantId, metricType, status) {
    // Find all plant headers that match this plant
    document.querySelectorAll('.plant-header').forEach(header => {
        const plantNameElement = header.querySelector('.plant-name');
        if (plantNameElement && plantNameElement.textContent.toLowerCase().includes(plantId.toLowerCase())) {
            // Find the indicator for this metric
            header.querySelectorAll('.indicator-item').forEach(indicator => {
                if (indicator.getAttribute('title') && 
                    indicator.getAttribute('title').toLowerCase() === metricType.toLowerCase()) {
                    // Update status class
                    indicator.classList.remove('good', 'warning', 'bad', 'neutral');
                    indicator.classList.add(status);
                    
                    // Remove emoji from indicator
                    const spanElement = indicator.querySelector('span');
                    if (spanElement) {
                        // Keep text based on metric type
                        if (metricType === 'moisture') {
                            spanElement.textContent = 'M';
                        } else if (metricType === 'temperature') {
                            spanElement.textContent = 'T';
                        } else if (metricType === 'humidity') {
                            spanElement.textContent = 'H';
                        } else if (metricType === 'light') {
                            spanElement.textContent = 'L';
                        }
                    }
                }
                
                // Remove happiness emoji and heart
                if (indicator.getAttribute('title') === 'Happiness' || 
                    indicator.getAttribute('title') === 'Overall Health') {
                    indicator.style.display = 'none';
                }
            });
            
            // Update health percentage in plant detail view
            if (plantId === 'ficus') {
                updateDetailHealth('ficus-detail-health', plantStatuses[plantId]);
                updateDetailHealth('ficus-detail-bedroom-health', plantStatuses[plantId]);
            } else if (plantId === 'lily') {
                updateDetailHealth('lily-detail-health', plantStatuses[plantId]);
                updateDetailHealth('lily-detail-bedroom-health', plantStatuses[plantId]);
            } else if (plantId === 'cactus') {
                updateDetailHealth('cactus-detail-health', plantStatuses[plantId]);
            } else if (plantId === 'herb') {
                updateDetailHealth('herb-detail-health', plantStatuses[plantId]);
            } else if (plantId === 'mint') {
                updateDetailHealth('mint-detail-health', plantStatuses[plantId]);
            }
        }
    });
}

// Update health percentage text in detail view
function updateDetailHealth(elementId, plantStatus) {
    const healthElement = document.getElementById(elementId);
    if (!healthElement) return;
    
    // Calculate health percentage
    let totalScore = 0;
    let metricCount = 0;
    
    for (const [metric, status] of Object.entries(plantStatus)) {
        if (status === 'good') {
            totalScore += 100;
            metricCount++;
        } else if (status === 'warning') {
            totalScore += 50;
            metricCount++;
        } else if (status === 'bad') {
            totalScore += 0;
            metricCount++;
        }
    }
    
    const healthScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
    
    // Determine status based on health score
    let overallStatus = 'neutral';
    if (metricCount > 0) {
        if (healthScore >= 80) {
            overallStatus = 'good';
        } else if (healthScore >= 40) {
            overallStatus = 'warning';
        } else {
            overallStatus = 'bad';
        }
    }
    
    // Update health text and status
    healthElement.textContent = `${healthScore}%`;
    healthElement.classList.remove('good', 'warning', 'bad', 'neutral');
    healthElement.classList.add(overallStatus);
}

// Find the correct status for a metric value based on plant thresholds
function getMetricStatus(plantId, metricType, value) {
    // Use simple threshold logic
    const thresholds = getThresholds(plantId, metricType);
    
    if (value < thresholds.min || value > thresholds.max) {
        return 'bad';  // Critical value
    } else if (value < thresholds.lowWarning || value > thresholds.highWarning) {
        return 'warning';  // Warning value
    } else {
        return 'good';  // Optimal value
    }
}

// Get thresholds for a specific plant type and metric
function getThresholds(plantId, metricType) {
    // Default values if not otherwise defined
    const defaultThresholds = {
        moisture: { min: 20, max: 80, lowWarning: 30, highWarning: 70 },
        temperature: { min: 15, max: 30, lowWarning: 18, highWarning: 26 },
        humidity: { min: 20, max: 80, lowWarning: 30, highWarning: 70 },
        light: { min: 300, max: 1500, lowWarning: 400, highWarning: 1200 }
    };
    
    // Plant-specific thresholds
    const plantThresholds = {
        ficus: {
            moisture: { min: 30, max: 70, lowWarning: 40, highWarning: 60 },
            humidity: { min: 30, max: 60, lowWarning: 40, highWarning: 50 }
        },
        lily: {
            moisture: { min: 50, max: 90, lowWarning: 60, highWarning: 80 },
            humidity: { min: 40, max: 80, lowWarning: 50, highWarning: 70 }
        },
        cactus: {
            moisture: { min: 0, max: 40, lowWarning: 5, highWarning: 30 },
            humidity: { min: 10, max: 50, lowWarning: 20, highWarning: 30 }
        }
    };
    
    // Return plant-specific values if they exist, otherwise default values
    if (plantThresholds[plantId] && plantThresholds[plantId][metricType]) {
        return plantThresholds[plantId][metricType];
    }
    
    return defaultThresholds[metricType] || { min: 0, max: 100, lowWarning: 20, highWarning: 80 };
}

// Simulate sensor changes with random values
function simulateRandomChanges() {
    // Choose a random plant
    const plants = Object.keys(plantData);
    const randomPlant = plants[Math.floor(Math.random() * plants.length)];
    
    // Choose a random metric
    const metrics = Object.keys(plantData[randomPlant]);
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    
    // Current value
    const currentValue = plantData[randomPlant][randomMetric];
    
    // Generate random change based on metric type
    let change;
    switch(randomMetric) {
        case 'moisture':
            change = Math.random() * 10 - 5; // -5 to +5
            break;
        case 'temperature':
            change = Math.random() * 2 - 1; // -1 to +1
            break;
        case 'humidity':
            change = Math.random() * 6 - 3; // -3 to +3
            break;
        case 'light':
            change = Math.random() * 200 - 100; // -100 to +100
            break;
        default:
            change = 0;
    }
    
    // Calculate new value and set bounds
    let newValue = currentValue + change;
    
    // Ensure values remain within reasonable limits
    switch(randomMetric) {
        case 'moisture':
            newValue = Math.max(0, Math.min(100, newValue));
            break;
        case 'temperature':
            newValue = Math.max(10, Math.min(35, newValue));
            break;
        case 'humidity':
            newValue = Math.max(5, Math.min(95, newValue));
            break;
        case 'light':
            newValue = Math.max(0, Math.min(2000, newValue));
            break;
    }
    
    // Update data
    plantData[randomPlant][randomMetric] = parseFloat(newValue.toFixed(1));
    
    console.log(`Updated ${randomPlant} ${randomMetric}: ${currentValue} -> ${plantData[randomPlant][randomMetric]}`);
    
    // Update UI
    updateUI();
}

// Initialize at page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing plant monitoring dashboard...");
    
    // First UI update
    updateUI();
    
    // Start periodic updates every 5 seconds
    setInterval(simulateRandomChanges, 5000);
    
    // Set toggle function for plant details if not already defined
    if (typeof toggleDetails !== 'function') {
        // Add click events to all toggleable panels
        document.querySelectorAll('.card-header[data-toggle-target]').forEach(header => {
            header.addEventListener('click', function() {
                const targetId = this.getAttribute('data-toggle-target');
                const target = document.querySelector(targetId);
                
                if (target) {
                    if (target.style.display === 'none' || target.style.display === '') {
                        target.style.display = 'block';
                        const icon = this.querySelector('.toggle-icon span');
                        if (icon) icon.textContent = '⌃';
                    } else {
                        target.style.display = 'none';
                        const icon = this.querySelector('.toggle-icon span');
                        if (icon) icon.textContent = '⌄';
                    }
                }
            });
        });
    }
    
    // Set initial state for collapsible panels
    document.querySelectorAll('.collapse').forEach(panel => {
        if (panel.id === 'ficusDetails' || panel.id === 'herbDetails') {
            panel.style.display = 'block'; // First panel open by default
        } else {
            panel.style.display = 'none';  // Other panels closed
        }
    });
});