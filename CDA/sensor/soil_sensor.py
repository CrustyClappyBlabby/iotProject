import board
import busio
from adafruit_ads1x15.analog_in import AnalogIn
import adafruit_ads1x15.ads1115 as ADS
from .base_sensor import BaseSensor

class SoilMoistureSensor(BaseSensor):
    def __init__(self, device_id):
        super().__init__("SoilMoisture", device_id)
        self.logger.info("Initializing Soil Moisture sensor")
        try:
            i2c = busio.I2C(board.SCL, board.SDA)
            self.ads = ADS.ADS1115(i2c)
            self.channel = AnalogIn(self.ads, ADS.P0)
            self.AIR_VALUE = 28000
            self.WATER_VALUE = 13000
            self.logger.info("Soil Moisture sensor initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Soil Moisture sensor: {e}")
            raise

    def _read_sensor(self):
        """
        Read soil moisture from analog sensor
        
        Returns:
            Dictionary with moisture data or None on failure
        """
        try:
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

            self.logger.info(f"Soil moisture reading: {percent:.2f}% ({status})")
            return {
                "moisture_value": raw,
                "voltage": round(voltage, 3),
                "moisture_percentage": round(percent, 2),
                "moisture_status": status
            }
        except Exception as e:
            self.logger.error(f"Soil moisture read error: {e}")
            return None
            
    def shutdown(self):
        """Clean up resources"""
        try:
            self.logger.info("Soil moisture sensor shutdown complete")
        except Exception as e:
            self.logger.error(f"Error during soil moisture sensor shutdown: {e}")
        finally:
            super().shutdown()