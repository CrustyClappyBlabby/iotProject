import RPi.GPIO as GPIO
from .base_sensor import BaseSensor

class LightSensor(BaseSensor):
    def __init__(self, sensor_id, pin=17):
        super().__init__(sensor_id)
        self.pin = pin
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.IN)

    def read(self):
        value = GPIO.input(self.pin)
        status = "Dark" if value == GPIO.HIGH else "Light"
        return {"light_status": status}

    def shutdown(self):
        GPIO.cleanup()