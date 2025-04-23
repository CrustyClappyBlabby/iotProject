import json
import time
from config import CONFIG
from sensor.dht11_sensor import DHT11Sensor
from sensor.light_sensor import LightSensor
from sensor.soil_sensor import SoilMoistureSensor
from mqtt.mqtt_client import MqttPublisher

#Initialize sensors
sensors = [
    DHT11Sensor(CONFIG["sensor_id"]),
    LightSensor(CONFIG["sensor_id"]),
    SoilMoistureSensor(CONFIG["sensor_id"])
]

#Initialize publisher
publisher = MqttPublisher(
    CONFIG["broker"], CONFIG["port"], CONFIG["username"], CONFIG["password"], CONFIG["topic"]
)

#Run loop
try:
    while True:
        timestamp = time.strftime("%H:%M")
        for sensor in sensors:
            data = sensor.read()
            if data:
                payload = json.dumps(sensor.format_data(data, timestamp))
                print(f"[Publish] {payload}")
                publisher.publish(payload)
        time.sleep(3)
except KeyboardInterrupt:
    print("\n[System] Interrupted. Cleaning up...")
    for sensor in sensors:
        sensor.shutdown()
    publisher.shutdown()
    print("[System] Shutdown complete.")