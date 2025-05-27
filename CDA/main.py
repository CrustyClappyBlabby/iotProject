import os
import time
import json
import signal
import logging
import threading
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import CONFIG
from sensor.dht11_sensor import DHT11Sensor
from sensor.light_sensor import LightSensor
from sensor.soil_sensor import SoilMoistureSensor
from mqtt.mqtt_client import MqttPublisher

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("CDA_Main")

# Get device ID and room ID from environment or config
DEVICE_ID = os.getenv("DEVICE_ID", CONFIG["device_id"])
ROOM_ID = os.getenv("ROOM_ID", CONFIG["room_id"])
logger.info(f"Starting CDA device: {DEVICE_ID} in room: {ROOM_ID}")

# Initialize MQTT publisher
publisher = MqttPublisher(
    CONFIG["broker"],
    CONFIG["port"],
    CONFIG["username"],
    CONFIG["password"],
    CONFIG["topic_prefix"],
    DEVICE_ID
)

# Initialize sensors with proper device ID
try:
    sensors = {
        "climate": DHT11Sensor(DEVICE_ID),
        "light": LightSensor(DEVICE_ID),
        "soil": SoilMoistureSensor(DEVICE_ID)
    }
    logger.info(f"Initialized {len(sensors)} sensors")
except Exception as e:
    logger.error(f"Error initializing sensors: {e}")
    publisher.shutdown()
    exit(1)

# Flags for graceful shutdown
running = True
executor = ThreadPoolExecutor(max_workers=len(sensors) + 1)

def read_sensor(sensor_name, sensor, timeout):
    """Read a sensor with timeout handling"""
    try:
        start_time = time.time()
        data = sensor.read(
            timeout=CONFIG["read_timeout"],
            max_retries=CONFIG["max_retries"],
            retry_delay=CONFIG["retry_delay"]
        )
        elapsed = time.time() - start_time
        
        if data:
            logger.info(f"Read {sensor_name} in {elapsed:.2f}s: {data}")
            return sensor_name, data
        else:
            logger.warning(f"No data from {sensor_name} after {elapsed:.2f}s")
            return sensor_name, None
    except Exception as e:
        logger.error(f"Error reading {sensor_name}: {e}")
        return sensor_name, None

def publish_data(sensor_readings):
    """Format and publish sensor data to MQTT"""
    try:
        # Get current timestamp in ISO format with timezone
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Create base payload with device metadata
        payload = {
            "device_id": DEVICE_ID,
            "room_id": ROOM_ID,
            "timestamp": now_iso,
            "readings": {}
        }
        
        # Add sensor readings
        for sensor_name, data in sensor_readings.items():
            if data:
                # Get formatted data from sensor
                sensor = sensors[sensor_name]
                formatted_data = sensor.format_data(data, now_iso)
                
                # Add to payload
                payload["readings"][sensor_name] = formatted_data
        
        # Add device stats
        payload["stats"] = {
            "sensor_count": len(sensors),
            "active_sensors": sum(1 for data in sensor_readings.values() if data is not None),
            "battery": 95  # Mock battery level - would be read from actual hardware
        }
        
        # Convert to JSON and publish
        json_payload = json.dumps(payload)
        logger.info(f"Publishing data: {len(json_payload)} bytes")
        publisher.publish(json_payload)
        
    except Exception as e:
        logger.error(f"Error publishing data: {e}")

def graceful_shutdown(signum=None, frame=None):
    """Handle graceful shutdown on signals"""
    global running
    logger.info("Shutdown signal received, cleaning up...")
    running = False

# Register signal handlers
signal.signal(signal.SIGINT, graceful_shutdown)
signal.signal(signal.SIGTERM, graceful_shutdown)

# Main loop
try:
    logger.info("Starting main loop")
    
    while running:
        start_time = time.time()
        sensor_readings = {}
        
        # Read all sensors in parallel
        futures = {
            executor.submit(read_sensor, name, sensor, CONFIG["read_timeout"]): name
            for name, sensor in sensors.items()
        }
        
        # Collect results as they complete
        for future in as_completed(futures):
            sensor_name, data = future.result()
            sensor_readings[sensor_name] = data
        
        # Publish collected data
        publish_data(sensor_readings)
        
        # Calculate sleep time to maintain consistent interval
        elapsed = time.time() - start_time
        sleep_time = max(0.1, CONFIG["read_interval"] - elapsed)
        
        logger.info(f"Cycle completed in {elapsed:.2f}s, sleeping for {sleep_time:.2f}s")
        
        # Sleep in small increments to respond quickly to shutdown signals
        sleep_start = time.time()
        while running and (time.time() - sleep_start) < sleep_time:
            time.sleep(0.1)
            
except Exception as e:
    logger.error(f"Unexpected error in main loop: {e}")
finally:
    # Clean shutdown
    logger.info("Shutting down...")
    running = False
    
    # Shutdown sensors
    for name, sensor in sensors.items():
        try:
            logger.info(f"Shutting down {name} sensor")
            sensor.shutdown()
        except Exception as e:
            logger.error(f"Error shutting down {name} sensor: {e}")
    
    # Shutdown MQTT and executor
    publisher.shutdown()
    executor.shutdown(wait=False)
    
    logger.info("Shutdown complete")
