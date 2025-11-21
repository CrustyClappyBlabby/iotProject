import random
import time
from .base_sensor import BaseSensor

class EmulatedLightSensor(BaseSensor):
    def __init__(self, device_id):
        super().__init__("LightSensor_Emulator", device_id)
        self.logger.info("Initialized EMULATED Light Sensor")

    def _read_sensor(self):

        if random.random() > 0.5:
            status = "Light"
        else:
            status = "Dark"

        return {"light_status": status}