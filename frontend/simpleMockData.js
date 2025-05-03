// simpleMockData.js - Basic mock data system for plant monitoring dashboard

/**
 * Mock data for plants
 */
const plantData = {
    ficus: {
        moisture: 45,
        temperature: 22,
        humidity: 35,
        light: 850
    },
    lily: {
        moisture: 70,
        temperature: 19,
        humidity: 65,
        light: 600
    },
    cactus: {
        moisture: 5,
        temperature: 25,
        humidity: 15,
        light: 1200
    },
    herb: {
        moisture: 60,
        temperature: 22,
        humidity: 45,
        light: 900
    },
    mint: {
        moisture: 65,
        temperature: 20,
        humidity: 50,
        light: 700
    }
};

/**
 * Thresholds for each plant type
 */
const thresholds = {
    ficus: {
        moisture: { min: 30, optimal: { min: 40, max: 60 }, max: 70 },
        temperature: { min: 18, optimal: { min: 20, max: 25 }, max: 28 },
        humidity: { min: 30, optimal: { min: 40, max: 50 }, max: 60 },
        light: { min: 400, optimal: { min: 600, max: 1000 }, max: 1200 }
    },
    lily: {
        moisture: { min: 50, optimal: { min: 60, max: 80 }, max: 90 },
        temperature: { min: 16, optimal: { min: 18, max: 22 }, max: 26 },
        humidity: { min: 40, optimal: { min: 50, max: 70 }, max: 80 },
        light: { min: 300, optimal: { min: 400, max: 800 }, max: 1000 }
    },
    cactus: {
        moisture: { min: 0, optimal: { min: 5, max: 30 }, max: 40 },
        temperature: { min: 15, optimal: { min: 20, max: 30 }, max: 35 },
        humidity: { min: 10, optimal: { min: 20, max: 30 }, max: 50 },
        light: { min: 800, optimal: { min: 1000, max: 1800 }, max: 2000 }
    },
    herb: {
        moisture: { min: 40, optimal: { min: 50, max: 70 }, max: 80 },
        temperature: { min: 18, optimal: { min: 20, max: 24 }, max: 28 },
        humidity: { min: 30, optimal: { min: 40, max: 60 }, max: 70 },
        light: { min: 600, optimal: { min: 800, max: 1200 }, max: 1400 }
    },
    mint: {
        moisture: { min: 50, optimal: { min: 60, max: 75 }, max: 85 },
        temperature: { min: 15, optimal: { min: 18, max: 22 }, max: 25 },
        humidity: { min: 40, optimal: { min: 50, max: 65 }, max: 75 },
        light: { min: 500, optimal: { min: 600, max: 900 }, max: 1100 }
    },
    default: {
        moisture: { min: 20, optimal: { min: 30, max: 70 }, max: 80 },
        temperature: { min: 15, optimal: { min: 18, max: 26 }, max: 30 },
        humidity: { min: 20, optimal: { min: 30, max: 70 }, max: 80 },
        light: { min: 300, optimal: { min: 400, max: 1200 }, max: 1500 }
    }
};

/**
 * Room assignments for plants
 */
const roomAssignments = {
    livingRoom: ['ficus', 'lily', 'cactus'],
    kitchen: ['herb', 'mint'],
    bedroom: ['ficus', 'lily']
};

/**
 * Storage for calculated statuses
 */
const plantStatuses = {};

/**
 * Main UI update function
 */
function updateUI() {
    // Process all plants
    for (const plantId of Object.keys(plantData)) {
        updatePlantStatus(plantId, plantData[plantId]);
    }
    
    // Update room summaries
    updateRoomSummaries();
    
    // Update timestamp
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleTimeString();
    }
}

/**
 * Update plant status based on thresholds
 */
function updatePlantStatus(plantId, sensorData) {
    if (!plantStatuses[plantId]) {
        plantStatuses[plantId] = {};
    }
    
    const plantThresholds = thresholds[plantId] || thresholds.default;
    
    for (const [metric, value] of Object.entries(sensorData)) {
        // Determine status
        let status;
        const limits = plantThresholds[metric];
        
        if (!limits) {
            status = 'neutral';
        } else if (value < limits.min || value > limits.max) {
            status = 'bad';
        } else if (value >= limits.optimal.min && value <= limits.optimal.max) {
            status = 'good';
        } else {
            status = 'warning';
        }
        
        plantStatuses[plantId][metric] = { value, status };
        
        // Update UI for this metric
        updateSingleMetricDisplay(plantId, metric, value, status);
    }
    
    // Update plant overview
    updatePlantOverview(plantId);
    
    // Update health percentage
    updatePlantHealthPercentage(plantId);
}

/**
 * Update a single metric display
 */
function updateSingleMetricDisplay(plantId, metric, value, status) {
    const metricElement = document.getElementById(`${plantId}-${metric}-metric`);
    if (!metricElement) return;
    
    // Update value display
    const valueDisplay = metricElement.querySelector('.metric-value');
    if (valueDisplay) {
        let displayValue;
        switch(metric) {
            case 'moisture':
            case 'humidity':
                displayValue = `${value}%`;
                break;
            case 'temperature':
                displayValue = `${value}°C`;
                break;
            case 'light':
                displayValue = `${value} lux`;
                break;
            default:
                displayValue = value;
        }
        valueDisplay.textContent = displayValue;
    }
    
    // Update status styling
    metricElement.className = 'metric-status';
    metricElement.classList.add(status);
    
    // Update status icon
    const statusIcon = metricElement.querySelector('.status-icon');
    if (statusIcon) {
        statusIcon.className = 'status-icon';
        statusIcon.classList.add(status);
    }
    
    // Update indicator in header
    updatePlantHeaderIndicator(plantId, metric, status);
}

/**
 * Update plant header indicator
 */
function updatePlantHeaderIndicator(plantId, metric, status) {
    document.querySelectorAll('.plant-header').forEach(header => {
        const plantNameElement = header.querySelector('.plant-name');
        if (plantNameElement && plantNameElement.textContent.toLowerCase().includes(plantId)) {
            header.querySelectorAll('.indicator-item').forEach(indicator => {
                if (indicator.getAttribute('data-metric') === metric) {
                    indicator.className = 'indicator-item';
                    indicator.classList.add(status);
                }
            });
            
            // Update happiness indicator
            updatePlantHappinessIndicator(header, plantId);
        }
    });
}

/**
 * Update happiness indicator
 */
function updatePlantHappinessIndicator(header, plantId) {
    if (!plantStatuses[plantId]) return;
    
    const happinessIndicator = Array.from(header.querySelectorAll('.indicator-item')).find(
        indicator => indicator.getAttribute('title') === 'Happiness'
    );
    
    if (!happinessIndicator) return;
    
    // Count issues
    let warningCount = 0;
    let badCount = 0;
    
    for (const [metric, data] of Object.entries(plantStatuses[plantId])) {
        if (data.status === 'warning') warningCount++;
        if (data.status === 'bad') badCount++;
    }
    
    // Set happiness
    const iconElement = happinessIndicator.querySelector('span');
    if (badCount > 0) {
        happinessIndicator.className = 'indicator-item bad';
        if (iconElement) iconElement.textContent = '😢';
    } else if (warningCount > 0) {
        happinessIndicator.className = 'indicator-item warning';
        if (iconElement) iconElement.textContent = '😐';
    } else {
        happinessIndicator.className = 'indicator-item good';
        if (iconElement) iconElement.textContent = '😊';
    }
}

/**
 * Update plant overview
 */
function updatePlantOverview(plantId) {
    const overviewElement = document.getElementById(`${plantId}-overview`);
    if (!overviewElement) return;
    
    const metrics = ['moisture', 'temperature', 'humidity', 'light'];
    let warningCount = 0;
    let badCount = 0;
    
    metrics.forEach(metric => {
        if (plantStatuses[plantId] && plantStatuses[plantId][metric]) {
            const { status } = plantStatuses[plantId][metric];
            
            if (status === 'warning') warningCount++;
            if (status === 'bad') badCount++;
            
            const indicatorElement = overviewElement.querySelector(`.plant-overview-${metric}`);
            if (indicatorElement) {
                indicatorElement.className = `plant-overview-${metric}`;
                indicatorElement.classList.add(status);
            }
        }
    });
    
    // Update overall status
    const statusTextElement = overviewElement.querySelector('.plant-status-text');
    if (statusTextElement) {
        if (badCount > 0) {
            statusTextElement.textContent = 'Needs immediate attention!';
            statusTextElement.className = 'plant-status-text bad';
        } else if (warningCount > 0) {
            statusTextElement.textContent = 'Needs attention soon';
            statusTextElement.className = 'plant-status-text warning';
        } else {
            statusTextElement.textContent = 'All metrics optimal';
            statusTextElement.className = 'plant-status-text good';
        }
    }
    
    // Update status badges
    updatePlantOverviewStatusBadge(plantId, badCount, warningCount);
}

/**
 * Update status badges in overview - badge display disabled
 */
function updatePlantOverviewStatusBadge(plantId, badCount, warningCount) {
    // Do nothing - badges are hidden via CSS
}

/**
 * Update plant health percentage
 */
function updatePlantHealthPercentage(plantId) {
    if (!plantStatuses[plantId]) return;
    
    let totalMetrics = 0;
    let healthScore = 0;
    
    for (const [metric, data] of Object.entries(plantStatuses[plantId])) {
        totalMetrics++;
        
        switch(data.status) {
            case 'good': healthScore += 100; break;
            case 'warning': healthScore += 50; break;
            case 'bad': healthScore += 0; break;
            default: totalMetrics--; break; // Don't count neutral
        }
    }
    
    const healthPercentage = totalMetrics > 0 ? Math.round(healthScore / totalMetrics) : 0;
    
    let statusClass;
    if (healthPercentage >= 80) {
        statusClass = 'good';
    } else if (healthPercentage >= 40) {
        statusClass = 'warning';
    } else {
        statusClass = 'bad';
    }
    
    // Update displays
    document.querySelectorAll(`[id^="${plantId}-health"]`).forEach(element => {
        element.textContent = `${healthPercentage}%`;
        element.className = 'health-percentage';
        element.classList.add(statusClass);
    });
}

/**
 * Update room summaries
 */
function updateRoomSummaries() {
    for (const [roomId, plants] of Object.entries(roomAssignments)) {
        updateRoomStatusSummary(roomId, plants);
    }
    
    updateEnvironmentalSummaries();
}

/**
 * Update room status summary
 */
function updateRoomStatusSummary(roomId, plantIds) {
    const roomStatusElement = document.getElementById(`${roomId}-status`);
    if (!roomStatusElement) return;
    
    let totalWarnings = 0;
    let totalCritical = 0;
    let plantsWithData = 0;
    
    plantIds.forEach(plantId => {
        if (plantStatuses[plantId]) {
            plantsWithData++;
            
            for (const [metric, data] of Object.entries(plantStatuses[plantId])) {
                if (data.status === 'warning') totalWarnings++;
                if (data.status === 'bad') totalCritical++;
            }
        }
    });
    
    let roomStatus = 'neutral';
    let statusText = 'No data available';
    
    if (plantsWithData > 0) {
        if (totalCritical > 0) {
            roomStatus = 'bad';
            statusText = 'Plants need immediate attention!';
        } else if (totalWarnings > 0) {
            roomStatus = 'warning';
            statusText = 'Some plants need attention soon';
        } else {
            roomStatus = 'good';
            statusText = 'All plants healthy';
        }
    }
    
    roomStatusElement.className = 'room-status';
    roomStatusElement.classList.add(roomStatus);
    roomStatusElement.textContent = statusText;
}

/**
 * Update environmental summaries
 */
function updateEnvironmentalSummaries() {
    const metrics = ['temperature', 'humidity', 'moisture', 'light'];
    
    metrics.forEach(metric => {
        const values = [];
        
        for (const plantId of Object.keys(plantData)) {
            if (plantData[plantId][metric]) {
                values.push(plantData[plantId][metric]);
            }
        }
        
        if (values.length > 0) {
            const average = values.reduce((sum, val) => sum + val, 0) / values.length;
            updateEnvironmentalSummary(metric, average);
        }
    });
}

/**
 * Update specific environmental summary
 */
function updateEnvironmentalSummary(metric, value) {
    document.querySelectorAll(`#${metric}-summary`).forEach(element => {
        let displayText;
        switch(metric) {
            case 'temperature':
                displayText = `Average: ${value.toFixed(1)}°C`;
                break;
            case 'humidity':
            case 'moisture':
                displayText = `Average: ${value.toFixed(0)}%`;
                break;
            case 'light':
                displayText = `Average: ${value.toFixed(0)} lux`;
                break;
            default:
                displayText = `Average: ${value}`;
        }
        
        element.textContent = displayText;
    });
}

/**
 * Toggle panel visibility - refined implementation
 */
function togglePanel(targetId, headerElement) {
    // Ensure headerElement is provided (the header that was clicked)
    if (!headerElement) {
        console.error("Header element not provided for toggle");
        return;
    }
    
    // Find the target panel
    const target = document.querySelector(targetId);
    if (!target) {
        console.error("Target panel not found:", targetId);
        return;
    }
    
    // Find the toggle icon
    const toggleIcon = headerElement.querySelector('.toggle-icon span');
    
    // Toggle display with animation
    if (target.style.display === 'none' || target.style.display === '') {
        // Show panel
        $(target).slideDown(200);
        if (toggleIcon) toggleIcon.textContent = '⌃';
    } else {
        // Hide panel
        $(target).slideUp(200);
        if (toggleIcon) toggleIcon.textContent = '⌄';
    }
    
    // Prevent event bubbling
    return false;
}

/**
 * Manual update function - call after changing plantData
 */
function updatePlantDataUI() {
    updateUI();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing plant monitoring dashboard...");
    
    // Update UI with initial data
    updateUI();
    
    // Add click handlers for expandable panels
    document.querySelectorAll('.plant-header[data-toggle-target]').forEach(header => {
        header.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle-target');
            togglePanel(targetId);
        });
    });
    
    // Set initial state for collapsible panels
    document.querySelectorAll('.collapse').forEach(panel => {
        if (panel.id === 'ficusDetails' || panel.id === 'herbDetails') {
            panel.style.display = 'block'; // First panels open by default
        } else {
            panel.style.display = 'none';  // Other panels closed by default
        }
    });
});