import RPi.GPIO as GPIO
from .base_sensor import BaseSensor

class LightSensor(BaseSensor):
    def __init__(self, device_id, pin=17):
        super().__init__("LightSensor", device_id)
        self.pin = pin
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.IN)
        self.logger.info(f"Initializing Light sensor on pin {pin}")

    def _read_sensor(self):
        """
        Read light status from GPIO pin
        
        Returns:
            Dictionary with light status or None on failure
        """
        try:
            value = GPIO.input(self.pin)
            status = "Dark" if value == GPIO.HIGH else "Light"
            self.logger.info(f"Light sensor reading: {status}")
            return {"light_status": status}
        except Exception as e:
            self.logger.error(f"Light sensor read error: {e}")
            return None

    def shutdown(self):
        """Clean up GPIO resources"""
        try:
            GPIO.cleanup(self.pin)
            self.logger.info("Light sensor shutdown complete")
        except Exception as e:
            self.logger.error(f"Error during Light sensor shutdown: {e}")
        finally:
            super().shutdown()