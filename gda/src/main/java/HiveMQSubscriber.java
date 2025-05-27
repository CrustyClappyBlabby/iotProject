// HiveMQSubscriber.java
// A HiveMQ MQTT subscriber that forwards parsed JSON sensorData into InfluxDB.

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import com.hivemq.client.mqtt.MqttClient;
import com.hivemq.client.mqtt.MqttGlobalPublishFilter;
import com.hivemq.client.mqtt.datatypes.MqttQos;
import com.hivemq.client.mqtt.mqtt5.Mqtt5AsyncClient;
import com.hivemq.client.mqtt.mqtt5.message.publish.Mqtt5Publish;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

public class HiveMQSubscriber {

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws InterruptedException {
        Mqtt5AsyncClient mqttClient = initializeAsyncMqttClient();
        WriteApiBlocking writeApi = initializeInfluxDBClient();

        // Subscribe to SensorData/#
        mqttClient.subscribeWith()
                .topicFilter("SensorData/#")
                .qos(MqttQos.AT_LEAST_ONCE)
                .callback(pub -> handlePublish(pub, writeApi))
                .send()
                .join();

        System.out.println("Subscribed to SensorData/#");

        Thread.currentThread().join();  // keep running
    }

    private static Mqtt5AsyncClient initializeAsyncMqttClient() {
        // Create a unique client identifier with timestamp to avoid connection conflicts
        String clientId = "GDA_" + System.currentTimeMillis();
        System.out.println("Initializing MQTT client with ID: " + clientId);
        
        // Build the MQTT client with automatic reconnect enabled
        Mqtt5AsyncClient client = MqttClient.builder()
                .useMqttVersion5()
                .identifier(clientId)
                .serverHost("5b3009ec3ac740e9bca14abfc408b9b2.s1.eu.hivemq.cloud")
                .serverPort(8883)
                .sslWithDefaultConfig()
                // Configure automatic reconnect manually for compatibility with 1.3.5
                .automaticReconnect()
                    .initialDelay(1, java.util.concurrent.TimeUnit.SECONDS)
                    .maxDelay(120, java.util.concurrent.TimeUnit.SECONDS)
                    .applyAutomaticReconnect()
                .buildAsync();
                
        // Set up connection listeners using the correct API for version 1.3.5
        client.toAsync().publishes(MqttGlobalPublishFilter.ALL, publish -> {
            // This is just to set up the client callback - actual message handling is done elsewhere
        });
        
        try {
            // Connect with authentication
            client.connectWith()
                    .simpleAuth()
                    .username("RustyHive")
                    .password("Jammerlap!234".getBytes(StandardCharsets.UTF_8))
                    .applySimpleAuth()
                    // Use compatible methods for 1.3.5
                    .keepAlive(60)
                    .cleanStart(true)
                    .send()
                    .join(); // Use join() instead of get() with timeout for compatibility
                    
            System.out.println("Connected to HiveMQ Cloud broker");
            System.out.println("Connection established successfully");
        } catch (Exception e) {
            System.err.println("Error connecting to MQTT broker: " + e.getMessage());
            System.err.println("Disconnected from HiveMQ Cloud broker");
            System.err.println("Reason: " + e.getMessage());
            e.printStackTrace();
            // Rethrow to signal failure to main
            throw new RuntimeException("Failed to connect to MQTT broker", e);
        }
        
        return client;
    }

    private static WriteApiBlocking initializeInfluxDBClient() {
        String influxUrl    = "https://eu-central-1-1.aws.cloud2.influxdata.com/";
        String influxToken  = "YVsVpURJ4btPoG4kk_fdL1VHjgKXazNw5EN798mKMDdQcxqBU6shSh0Qb4DHBtJAQEAjNdUx6fHFtREt9cQahQ==";
        String influxOrg    = "IoT";
        String influxBucket = "SensorData";

        InfluxDBClient influxDBClient = InfluxDBClientFactory
                .create(influxUrl, influxToken.toCharArray(), influxOrg, influxBucket);

        System.out.println("Connected to InfluxDB");
        return influxDBClient.getWriteApiBlocking();
    }

private static void handlePublish(Mqtt5Publish pub, WriteApiBlocking writeApi) {
    String topic = pub.getTopic().toString();
    String payload = new String(pub.getPayloadAsBytes(), StandardCharsets.UTF_8);

    System.out.println("Received message on topic: '" + topic + "'");
    
    try {
        // Extract device ID from topic (format: SensorData/{device_id})
        String topicDeviceId = null;
        if (topic.startsWith("SensorData/")) {
            topicDeviceId = topic.substring("SensorData/".length());
            System.out.println("Device ID from topic: " + topicDeviceId);
        } else {
            System.out.println("Unexpected topic format: " + topic);
        }
        
        // Parse JSON payload
        Map<String, Object> data = JSON.readValue(payload, new TypeReference<>() {});
        
        // Get device ID from payload or fallback to topic-derived ID
        String deviceId = (String) data.getOrDefault("device_id", topicDeviceId);
        if (deviceId == null) {
            System.err.println("Warning: No device ID found in message or topic");
            deviceId = "unknown_device";
        }
        
        // Parse timestamp or use current time
        Instant ts;
        try {
            String timestamp = (String) data.get("timestamp");
            ts = timestamp != null ? Instant.parse(timestamp) : Instant.now();
        } catch (Exception e) {
            System.err.println("Error parsing timestamp: " + e.getMessage());
            ts = Instant.now();
        }
        
        // Get room ID from payload or use default
        String roomId = (String) data.getOrDefault("room_id", "unknown_room");
        
        // Create a point with the exact field names from the database schema
        Point point = Point
            .measurement("sensorData")
            .addTag("Plant_ID", deviceId)
            .addTag("room_ID", roomId)
            .time(ts, WritePrecision.NS);
        
        boolean hasFields = false;
        
        // Handle new message format with nested readings
        @SuppressWarnings("unchecked")
        Map<String, Object> readings = (Map<String, Object>) data.get("readings");
        
        if (readings != null) {
            // Extract temperature and humidity from climate sensor
            @SuppressWarnings("unchecked")
            Map<String, Object> climateData = (Map<String, Object>) readings.get("climate");
            if (climateData != null) {
                // Extract temperature
                Object tempValue = climateData.get("temperature");
                if (tempValue != null) {
                    double temperature = tempValue instanceof Number ?
                        ((Number) tempValue).doubleValue() :
                        Double.parseDouble(tempValue.toString());
                    point.addField("temperature", temperature);
                    hasFields = true;
                }
                
                // Extract humidity
                Object humidityValue = climateData.get("humidity");
                if (humidityValue != null) {
                    double humidity = humidityValue instanceof Number ?
                        ((Number) humidityValue).doubleValue() :
                        Double.parseDouble(humidityValue.toString());
                    point.addField("humidity", humidity);
                    hasFields = true;
                }
            }
            
            // Extract light from light sensor
            @SuppressWarnings("unchecked")
            Map<String, Object> lightData = (Map<String, Object>) readings.get("light");
            if (lightData != null) {
                // For light sensor, we need to convert status to a numeric value
                Object lightStatus = lightData.get("light_status");
                if (lightStatus != null) {
                    // Convert light status to numeric value (0 for dark, 1 for light)
                    double lightValue = "Light".equalsIgnoreCase(lightStatus.toString()) ? 1.0 : 0.0;
                    point.addField("light", lightValue);
                    hasFields = true;
                }
            }
            
            // Extract moisture from soil sensor
            @SuppressWarnings("unchecked")
            Map<String, Object> soilData = (Map<String, Object>) readings.get("soil");
            if (soilData != null) {
                // Use moisture_percentage as the moisture value
                Object moistureValue = soilData.get("moisture_percentage");
                if (moistureValue != null) {
                    double moisture = moistureValue instanceof Number ?
                        ((Number) moistureValue).doubleValue() :
                        Double.parseDouble(moistureValue.toString());
                    point.addField("moisture", moisture);
                    hasFields = true;
                }
            }
        } else {
            System.out.println("Warning: Message does not contain 'readings' object. Skipping processing.");
        }
        
        // Only write point if it has fields
        if (hasFields) {
            writeApi.writePoint(point);
            System.out.println("Wrote point for Plant_ID: " + deviceId);
        } else {
            System.out.println("No fields found in message");
        }
    } catch (Exception e) {
        System.err.println("Error processing message: " + e.getMessage());
        e.printStackTrace();
        
        // Log the problematic payload for debugging
        System.err.println("Problematic payload: " + payload);
    }
}

// Helper method to check if a string is numeric
private static boolean isNumeric(String str) {
    if (str == null || str.isEmpty()) {
        return false;
    }
    try {
        Double.parseDouble(str);
        return true;
    } catch (NumberFormatException e) {
        return false;
    }
}
}
