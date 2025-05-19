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
        },
        TIMEOUT: 10000, // 10 sec
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
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
        },
        DEFAULT_TIME_RANGE: {
            FROM: 'now-1h',
            TO: 'now'
        },
        THEME: 'light',
        ORG_ID: 1
    },

    // UI Configuration
    UI: {
        UPDATE_INTERVAL: 30000, // updates ui every 30 seconds
        CACHE_DURATION: 5 * 60 * 1000, // cache every 5 minutes
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500,
        AUTO_REFRESH: true,
        SHOW_DEBUG_INFO: false
    },

    // Error messages
    MESSAGES: {
        LOADING: 'Discovering plants from database...',
        ERROR_GENERIC: 'Failed to load plant data. Please try again.',
        ERROR_API: 'Unable to connect to the monitoring system.',
        ERROR_NO_DATA: 'No plant data available.',
        SUCCESS_REFRESH: 'Plant data updated successfully.',
        CONFIDENCE_LOW: 'Some plant information was auto-detected and may not be accurate.'
    },

    // Feature flags
    FEATURES: {
        DYNAMIC_DISCOVERY: true,
        CONFIDENCE_DISPLAY: true,
        ROOM_GROUPING: true,
        GRAFANA_INTEGRATION: true,
        AUTO_NAMING: true,
        HEALTH_PREDICTION: false,
        EXPORT_DATA: false
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(CONFIG);

// Export globally for frontend
window.PlantConfig = CONFIG;