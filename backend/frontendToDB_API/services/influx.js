/**
 * InfluxDB Service
 * Handles all interactions with InfluxDB
 */
const { InfluxDB } = require('@influxdata/influxdb-client');
const dbConfig = require('../config/db');

// Create InfluxDB client
const influxClient = new InfluxDB({
  url: dbConfig.url,
  token: dbConfig.token,
  timeout: dbConfig.timeout
});

// Get InfluxDB query API
const queryApi = influxClient.getQueryApi(dbConfig.org);

/**
 * Execute a Flux query and return the results (Private method)
 */
async function _executeQuery(query) {
  try {
    return await queryApi.collectRows(query);
  } catch (error) {
    throw error;
  }
}

/**
 * Test database connection by listing buckets
 */
async function testConnection() {
  const query = 'buckets()';
  const data = await _executeQuery(query);
  return data.map(b => b.name);
}

/**
 * Get all plant IDs
 */
async function getPlants() {
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "plant_test")
      |> group(columns: ["Plant_ID"])
      |> distinct(column: "Plant_ID")
  `;

  const data = await _executeQuery(query);
  return data.map(row => row.Plant_ID).filter(Boolean);
}

/**
 * Get latest values for a specific plant
 */
async function getLatestPlantValues(plantId) {
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "plant_test")
      |> filter(fn: (r) => r.Plant_ID == "${plantId}")
      |> last()
      |> yield(name: "last")
  `;

  const data = await _executeQuery(query);

  // Process data to return latest values
  const results = {};
  data.forEach(row => {
    results[row._field] = row._value;
  });

  return results;
}

/**
 * Get all room IDs
 */
async function getRooms() {
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "plant_test")
      |> group(columns: ["room_ID"])
      |> distinct(column: "room_ID")
  `;

  const data = await _executeQuery(query);
  return data.map(row => row.room_ID).filter(Boolean);
}

/**
 * Get room summary (average of all metrics)
 */
async function getRoomSummary(roomId) {
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "plant_test")
      |> filter(fn: (r) => r.room_ID == "${roomId}")
      |> group(columns: ["_field"])
      |> mean()
      |> yield(name: "mean")
  `;

  const data = await _executeQuery(query);

  // Process data to return average values
  const results = {};
  data.forEach(row => {
    results[row._field] = row._value;
  });

  return results;
}

/**
 * Get debug data (sample of raw data)
 */
async function getDebugData() {
  const query = `
    from(bucket: "${dbConfig.bucket}")
      |> range(start: -30d)
      |> limit(n: 10)
  `;

  return await _executeQuery(query);
}

/**
 * Get complete schema information
 */
async function getSchemaInfo() {
  const measurementsQuery = `
    import "influxdata/influxdb/schema"
    schema.measurements(bucket: "${dbConfig.bucket}")
  `;

  const fieldKeysQuery = `
    import "influxdata/influxdb/schema"
    schema.fieldKeys(bucket: "${dbConfig.bucket}")
  `;

  const tagKeysQuery = `
    import "influxdata/influxdb/schema"
    schema.tagKeys(bucket: "${dbConfig.bucket}")
  `;

  const measurements = await _executeQuery(measurementsQuery);
  const fieldKeys = await _executeQuery(fieldKeysQuery);
  const tagKeys = await _executeQuery(tagKeysQuery);

  return {
    measurements: measurements.map(row => row._value),
    fieldKeys: fieldKeys.map(row => row._value),
    tagKeys: tagKeys.map(row => row._value)
  };
}

module.exports = {
  testConnection,
  getPlants,
  getLatestPlantValues,
  getRooms,
  getRoomSummary,
  getDebugData,
  getSchemaInfo
};