import random
import time
from .base_sensor import BaseSensor

class EmulatedSoilMoistureSensor(BaseSensor):
    def __init__(self, device_id):
        super().__init__("SoilMoisture_Emulator", device_id)
        self.logger.info("Initialized EMULATED Soil Moisture Sensor")

    def _read_sensor(self):

        raw = random.randint(13000, 28000)  
        voltage = round(3.3 * raw / 32767, 3)

       
        percent = 100 - ((raw - 13000) * 100 / (28000 - 13000))
        percent = max(0, min(100, percent))

      
        if raw >= 25000:
            status = "Dry"
        elif raw >= 15000:
            status = "Moist"
        else:
            status = "Wet"

        return {
            "moisture_value": raw,
            "voltage": voltage,
            "moisture_percentage": round(percent, 2),
            "moisture_status": status
        }