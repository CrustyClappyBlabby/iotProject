import random
import time
from .base_sensor import BaseSensor

class EmulatedDHT11Sensor(BaseSensor):
    def __init__(self, device_id):
        super().__init__("DHT11_Emulator", device_id)
        self.logger.info("Initialized EMULATED DHT11 sensor")

    def _read_sensor(self):
        temperature = round(random.uniform(20.0, 30.0), 1)

        humidity = round(random.uniform(40.0, 80.0), 1)

        return {
            "temperature": temperature,
            "humidity": humidity
        }