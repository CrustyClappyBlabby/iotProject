/**
 * Configuration file frontend
 */
const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'http://localhost:3001/api',
        ENDPOINTS: {
            DISCOVER: '/discover',
            PLANT_DATA: '/plants',
            HEALTH: '/health'
        }
    },

    // Grafana Configuration
    GRAFANA: {
        BASE_URL: 'http://172.24.234.88:3000',
        DASHBOARD_UID: 'dynamic-plants-dashboard',
        DEFAULT_PANELS: {
            TEMPERATURE: 1,
            HUMIDITY: 2,
            MOISTURE: 3,
            LIGHT: 4
        }
    },

    // UI Configuration
    UI: {
        UPDATE_INTERVAL: 30000 // updates every 30 seconds
    },

    // Error messages
    MESSAGES: {
        LOADING: 'Discovering plants from database...',
        ERROR_GENERIC: 'Failed to load plant data. Please try again.',
        ERROR_API: 'Unable to connect to the monitoring system.',
        ERROR_NO_DATA: 'No plant data available.'
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(CONFIG);

// Export globally for frontend
window.PlantConfig = CONFIG;