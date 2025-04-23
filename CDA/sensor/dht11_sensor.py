import board
import adafruit_dht
from .base_sensor import BaseSensor

class DHT11Sensor(BaseSensor):
    def __init__(self, sensor_id):
        super().__init__(sensor_id)
        self.sensor = adafruit_dht.DHT11(board.D27, use_pulseio=False)

    def read(self):
        try:
            return {
                "temperature": self.sensor.temperature,
                "humidity": self.sensor.humidity
            }
        except Exception as e:
            print(f"[DHT11] Error: {e}")
            return None

    def shutdown(self):
        self.sensor.exit()