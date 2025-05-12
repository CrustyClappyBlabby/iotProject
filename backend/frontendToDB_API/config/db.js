/**
 * Database configuration
 */

// InfluxDB configuration from environment variables
const config = {
  // Connection details
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
  org: process.env.INFLUX_ORG,

  // Database name/bucket
  bucket: process.env.INFLUX_BUCKET,

  // Connection settings
  timeout: process.env.INFLUX_TIMEOUT ? parseInt(process.env.INFLUX_TIMEOUT, 10) : 30000, // Default: 30 seconds

  // Query defaults
  defaultTimeRange: process.env.DEFAULT_TIME_RANGE || '30d',
  maxResultLimit: process.env.MAX_RESULT_LIMIT ? parseInt(process.env.MAX_RESULT_LIMIT, 10) : 1000
};

module.exports = config;