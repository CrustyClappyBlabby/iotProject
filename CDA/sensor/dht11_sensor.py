import time
import board
import adafruit_dht
from .base_sensor import BaseSensor

class DHT11Sensor(BaseSensor):
    """DHT11 temperature and humidity sensor implementation"""
    
    def __init__(self, device_id, pin=board.D27):
        super().__init__("DHT11", device_id)
        self.logger.info(f"Initializing DHT11 sensor on pin {pin}")
        try:
            self.sensor = adafruit_dht.DHT11(pin, use_pulseio=False)
            # Wait for sensor to stabilize
            time.sleep(2)
            self.logger.info("DHT11 sensor initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize DHT11 sensor: {e}")
            raise

    def _read_sensor(self):
        """
        Read temperature and humidity from DHT11 sensor
        
        Returns:
            Dictionary with temperature and humidity values or None on failure
        """
        try:
            temperature = self.sensor.temperature
            humidity = self.sensor.humidity
            
            # Validate readings
            if temperature is None or humidity is None:
                self.logger.warning("DHT11 returned None values")
                return None
                
            if not (-40 <= temperature <= 80) or not (0 <= humidity <= 100):
                self.logger.warning(f"DHT11 readings out of range: temp={temperature}°C, humidity={humidity}%")
                return None
                
            self.logger.info(f"DHT11 reading: {temperature}°C, {humidity}%")
            return {
                "temperature": temperature,
                "humidity": humidity
            }
        except Exception as e:
            self.logger.error(f"DHT11 read error: {e}")
            return None

    def shutdown(self):
        """Clean up DHT11 sensor resources"""
        try:
            self.sensor.exit()
            self.logger.info("DHT11 sensor shutdown complete")
        except Exception as e:
            self.logger.error(f"Error during DHT11 shutdown: {e}")
        finally:
            super().shutdown()