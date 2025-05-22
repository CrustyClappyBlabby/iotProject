/**
 * InfluxDB Service
 * Handles database queries using Flux language
 */
const { InfluxDB } = require('@influxdata/influxdb-client');
const dbConfig = require('../config/db');

// Initialize InfluxDB client
const influxClient = new InfluxDB({
  url: dbConfig.url,
  token: dbConfig.token,
  timeout: dbConfig.timeout
});

const queryApi = influxClient.getQueryApi(dbConfig.org);

/**
 * Execute a Flux query and return results
 */
async function _executeFluxQuery(fluxQuery) {
  try {
    console.log('Executing Flux query:', fluxQuery);
    return await queryApi.collectRows(fluxQuery); // collectRows collects all query results to an array, influxdb js-client method
  } catch (error) {
    console.error('Flux Query Error:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  const query = `buckets() |> filter(fn: (r) => r.name == "${dbConfig.bucket}")`;
  
  try {
    const data = await _executeFluxQuery(query);
    return { 
      success: true, 
      bucket: dbConfig.bucket,
      bucketExists: data.length > 0
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
}

/**
 * Get all plant IDs from database
 */
async function getPlants() {
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "sensorData")
      |> group(columns: ["Plant_ID"])
      |> distinct(column: "Plant_ID")
  `;

  try {
    console.log('Getting all plants...');
    const data = await _executeFluxQuery(query);
    
    // Extract plant IDs from results
    const plantIds = data.map(row => row.Plant_ID).filter(Boolean);
    
    console.log('Found plant IDs:', plantIds);
    return plantIds;
  } catch (error) {
    console.error('Error getting plants:', error);
    return []; // Return empty array if error
  }
}

/**
 * Get latest sensor values for a specific plant
 */
async function getLatestPlantValues(plantId) {
  // Query to get latest data for plant (pivoted format)
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "sensorData")
      |> filter(fn: (r) => r.Plant_ID == "${plantId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)
  `;
  
  try {
    const data = await _executeFluxQuery(query);
    
    if (!data || data.length === 0) {
      console.log(`No data found for plant: ${plantId}`);
      return null;
    }
    
    // Return sensor values in standard format
    const result = data[0];
    return {
      humidity: result.humidity || null,
      light: result.light || null,
      moisture: result.moisture || null,
      temperature: result.temperature || null
    };
    
  } catch (error) {
    console.error(`Error getting data for ${plantId}:`, error);
    return null;
  }
}

/**
 * Get room ID for a specific plant
 */
async function getPlantRoom(plantId) {
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "sensorData")
      |> filter(fn: (r) => r.Plant_ID == "${plantId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> limit(n: 1)
  `;
  
  try {
    const data = await _executeFluxQuery(query);
    return data?.[0]?.room_ID || null;
  } catch (error) {
    console.error(`Error getting room for ${plantId}:`, error);
    return null;
  }
}

module.exports = {
  testConnection,
  getPlants,
  getLatestPlantValues,
  getPlantRoom
};