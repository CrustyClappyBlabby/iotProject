// simpleMockData.js - Basic mock data system for plant monitoring dashboard

/**
 * Mock data for plants
 */
const plantData = {
    ficus: {
        moisture: 72.5,
        temperature: 24.5,
        humidity: 66.7,
        light: 1250
    },
    lily: {
        moisture: 69,
        temperature: 22.6,
        humidity: 88.5,
        light: 305
    },
    cactus: {
        moisture: 70.2,
        temperature: 22.6,
        humidity: 88.5,
        light: 305
    },
    herb: {
        moisture: 70.2,
        temperature: 22.6,
        humidity: 88.5,
        light: 305
    },
    mint: {
        moisture: 72.5,
        temperature: 24.5,
        humidity: 66.7,
        light: 1250
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
    // Update the metric for this plant in ALL rooms
    // Find all rooms where this plant exists
    const roomsWithPlant = Object.entries(roomAssignments)
        .filter(([_, plants]) => plants.includes(plantId))
        .map(([roomId, _]) => roomId);
    
    // Update in each room
    for (const roomId of roomsWithPlant) {
        // First, try room-specific element (if it exists)
        const roomSpecificSelector = `[data-plant="${plantId}"][data-metric="${metric}"][data-room="${roomId}"]`;
        const roomSpecificIndicators = document.querySelectorAll(roomSpecificSelector);
        
        // Update room-specific indicators
        roomSpecificIndicators.forEach(indicator => {
            indicator.className = 'indicator-item';
            indicator.classList.add(status);
        });
        
        // Also update the metric display
        const metricElement = document.getElementById(`${plantId}-${metric}-metric`);
        if (metricElement) {
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
        }
    }
    
    // Update indicators in headers
    updatePlantHeaderIndicator(plantId, metric, status);
}

/**
 * Update plant header indicator
 */
function updatePlantHeaderIndicator(plantId, metric, status) {
    // Find all plant headers that match this plant
    const plantHeaders = [];
    
    // Find by direct plant name match
    document.querySelectorAll('.plant-header').forEach(header => {
        const plantNameElement = header.querySelector('.plant-name');
        if (plantNameElement) {
            // Check for exact plant ID match first
            if (plantNameElement.textContent.toLowerCase() === plantId) {
                plantHeaders.push(header);
            } 
            // Handle special cases for display names
            else if (plantId === 'lily' && plantNameElement.textContent.toLowerCase().includes('peace lily')) {
                plantHeaders.push(header);
            }
            // Handle other possible name variations
            else if (plantNameElement.textContent.toLowerCase().includes(plantId)) {
                plantHeaders.push(header);
            }
        }
    });
    
    // Find by data attributes (more reliable)
    document.querySelectorAll(`[data-plant="${plantId}"]`).forEach(element => {
        // Find the closest plant header
        const header = element.closest('.plant-header');
        if (header && !plantHeaders.includes(header)) {
            plantHeaders.push(header);
        }
    });
    
    // Update all found headers
    plantHeaders.forEach(header => {
        header.querySelectorAll('.indicator-item').forEach(indicator => {
            if (indicator.getAttribute('data-metric') === metric) {
                indicator.className = 'indicator-item';
                indicator.classList.add(status);
            }
        });
        
        // Update happiness indicator
        updatePlantHappinessIndicator(header, plantId);
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
    // Update overview in ALL rooms where this plant exists
    // Find all rooms with this plant
    const roomsWithPlant = Object.entries(roomAssignments)
        .filter(([_, plants]) => plants.includes(plantId))
        .map(([roomId, _]) => roomId);
    
    // Find all overview elements for this plant (may be in multiple rooms)
    document.querySelectorAll(`#${plantId}-overview, [id^="${plantId}-"][id$="-overview"]`).forEach(overviewElement => {
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
    });
    
    // Update status badges
    updatePlantOverviewStatusBadge(plantId, 
        plantStatuses[plantId] ? Object.values(plantStatuses[plantId]).filter(d => d.status === 'bad').length : 0,
        plantStatuses[plantId] ? Object.values(plantStatuses[plantId]).filter(d => d.status === 'warning').length : 0);
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
    
    // Update health displays - including room-specific ones
    updatePlantHealthDisplays(plantId, healthPercentage, statusClass);
}

/**
 * Update all health displays for a plant across rooms
 */
function updatePlantHealthDisplays(plantId, healthPercentage, statusClass) {
    // Find all rooms where this plant exists
    const roomsWithPlant = Object.entries(roomAssignments)
        .filter(([_, plants]) => plants.includes(plantId))
        .map(([roomId, _]) => roomId);
    
    // Standard health display format (used in most places)
    document.querySelectorAll(`[id^="${plantId}-health"]`).forEach(element => {
        element.textContent = `${healthPercentage}%`;
        element.className = 'health-percentage';
        element.classList.add(statusClass);
    });
    
    // Handle special case for bedroom elements in overview
    document.querySelectorAll(`[id="${plantId}-bedroom-health"]`).forEach(element => {
        element.textContent = `${healthPercentage}%`;
        element.className = 'health-percentage';
        element.classList.add(statusClass);
    });
    
    // Handle status badges in overview
    document.querySelectorAll(`[id^="${plantId}-"][id$="-status"]`).forEach(element => {
        element.className = 'status-badge';
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
    // Update detailed room status (used in room-specific pages)
    const roomStatusElement = document.getElementById(`${roomId}-status`);
    if (roomStatusElement) {
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
    
    // Update room health in overview page
    const roomHealthElement = document.getElementById(`${roomId}-health`);
    if (roomHealthElement) {
        // Calculate overall room health percentage
        let totalHealthScore = 0;
        let totalPlants = 0;
        
        plantIds.forEach(plantId => {
            if (plantStatuses[plantId]) {
                totalPlants++;
                
                let plantMetrics = 0;
                let plantScore = 0;
                
                // Calculate plant health score
                for (const [metric, data] of Object.entries(plantStatuses[plantId])) {
                    plantMetrics++;
                    
                    switch(data.status) {
                        case 'good': plantScore += 100; break;
                        case 'warning': plantScore += 50; break;
                        case 'bad': plantScore += 0; break;
                        default: plantMetrics--; break; // Don't count neutral
                    }
                }
                
                if (plantMetrics > 0) {
                    totalHealthScore += Math.round(plantScore / plantMetrics);
                }
            }
        });
        
        // Calculate room health percentage
        const healthPercentage = totalPlants > 0 ? Math.round(totalHealthScore / totalPlants) : 0;
        
        // Determine status class
        let statusClass;
        if (healthPercentage >= 80) {
            statusClass = 'good';
        } else if (healthPercentage >= 40) {
            statusClass = 'warning';
        } else {
            statusClass = 'bad';
        }
        
        // Update room health display
        roomHealthElement.textContent = `${healthPercentage}%`;
        roomHealthElement.className = 'health-percentage';
        roomHealthElement.classList.add(statusClass);
    }
}

/**
 * Update environmental summaries
 */
function updateEnvironmentalSummaries() {
    const metrics = ['temperature', 'humidity', 'moisture', 'light'];
    const rooms = Object.keys(roomAssignments);
    
    // Calculate global AND room-specific averages
    metrics.forEach(metric => {
        // For each room, calculate room-specific average
        rooms.forEach(roomId => {
            const plantsInRoom = roomAssignments[roomId] || [];
            const roomValues = [];
            
            // Collect values only from plants in this room
            plantsInRoom.forEach(plantId => {
                if (plantData[plantId] && plantData[plantId][metric] !== undefined) {
                    roomValues.push(plantData[plantId][metric]);
                }
            });
            
            // Calculate and update room-specific average
            if (roomValues.length > 0) {
                const roomAverage = roomValues.reduce((sum, val) => sum + val, 0) / roomValues.length;
                updateEnvironmentalSummary(metric, roomAverage, roomId);
            }
        });
        
        // Calculate global average (for backward compatibility)
        const globalValues = [];
        for (const plantId of Object.keys(plantData)) {
            if (plantData[plantId][metric] !== undefined) {
                globalValues.push(plantData[plantId][metric]);
            }
        }
        
        if (globalValues.length > 0) {
            const globalAverage = globalValues.reduce((sum, val) => sum + val, 0) / globalValues.length;
            updateEnvironmentalSummary(metric, globalAverage);
        }
    });
}

/**
 * Update specific environmental summary
 */
function updateEnvironmentalSummary(metric, value, roomId) {
    // Select the appropriate elements based on room
    const selector = roomId 
        ? `#${metric}-summary[data-room="${roomId}"]` 
        : `#${metric}-summary:not([data-room])`;
    
    document.querySelectorAll(selector).forEach(element => {
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