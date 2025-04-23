import board
import busio
from adafruit_ads1x15.analog_in import AnalogIn
import adafruit_ads1x15.ads1115 as ADS
from .base_sensor import BaseSensor

class SoilMoistureSensor(BaseSensor):
    def __init__(self, sensor_id):
        super().__init__(sensor_id)
        i2c = busio.I2C(board.SCL, board.SDA)
        self.ads = ADS.ADS1115(i2c)
        self.channel = AnalogIn(self.ads, ADS.P0)
        self.AIR_VALUE = 28000
        self.WATER_VALUE = 13000

    def read(self):
        raw = self.channel.value
        voltage = self.channel.voltage
        percent = 100 - ((raw - self.WATER_VALUE) * 100 / (self.AIR_VALUE - self.WATER_VALUE))
        percent = max(0, min(100, percent))

        if raw >= 25000:
            status = "Dry"
        elif raw >= 15000:
            status = "Moist"
        else:
            status = "Wet"

        return {
            "moisture_value": raw,
            "voltage": round(voltage, 3),
            "moisture_percentage": round(percent, 2),
            "moisture_status": status
        }