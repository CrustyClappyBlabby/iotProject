/**
 * Plant Service
 * Handles data retrieval from InfluxDB using bulk queries
 */

const { InfluxDB } = require('@influxdata/influxdb-client');
const config = require('./db');

// Initialize InfluxDB client
const influxClient = new InfluxDB({
  url: config.url,
  token: config.token,
  timeout: config.timeout
});

const queryApi = influxClient.getQueryApi(config.org);

/**
 * Execute Flux query and return results
 * @param {string} fluxQuery - The Flux query to execute
 * @returns {Promise<Array>} Query results
 */
async function executeFluxQuery(fluxQuery) {
  try {
    console.log('Executing Flux query...');
    const results = await queryApi.collectRows(fluxQuery);
    console.log(`Query returned ${results.length} rows`);
    return results;
  } catch (error) {
    console.error('Flux query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Main discovery function - gets all plants and rooms in one query
 * @returns {Promise<Object>} Plants and rooms data for frontend
 */
async function discoverAllPlants() {
  try {
    console.log('Discovering all plants...');
    
    const query = `
      from(bucket: "${config.bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "sensorData")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 1)
    `;
    
    // Execute single query for all data
    const results = await executeFluxQuery(query);
    
    if (!results || results.length === 0) {
      console.log('No plant data found in database');
      return {
        plants: [],
        rooms: [],
        summary: {
          totalPlants: 0,
          totalRooms: 0,
          lastUpdate: new Date().toISOString()
        }
      };
    }
    
    // Transform raw database results to frontend format
    const plants = results.map(row => ({
      id: row.Plant_ID,
      name: row.Plant_ID,  // Use Plant_ID as display name
      room: row.room_ID || 'unknown_room',
      data: {
        temperature: row.temperature || null,
        humidity: row.humidity || null,
        moisture: row.moisture || null,
        light: row.light || null
      }
    }));
    
    // Create unique rooms array from plant data
    const uniqueRoomIds = [...new Set(plants.map(plant => plant.room))];
    const rooms = uniqueRoomIds.map(roomId => ({
      id: roomId,
      name: roomId
    }));
    
    const result = {
      plants,
      rooms,
      summary: {
        totalPlants: plants.length,
        totalRooms: rooms.length,
        lastUpdate: new Date().toISOString()
      }
    };
    
    console.log(`Successfully discovered ${plants.length} plants in ${rooms.length} rooms`);
    return result;
    
  } catch (error) {
    console.error('Error discovering plants:', error);
    throw error;
  }
}

module.exports = {
  discoverAllPlants
};