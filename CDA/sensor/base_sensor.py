import time
from abc import ABC, abstractmethod

class BaseSensor(ABC):
    def __init__(self, sensor_id):
        self.sensor_id = sensor_id

    @abstractmethod
    def read(self):
        pass

    def format_data(self, data, timestamp):
        data["timestamp"] = timestamp
        data["sensor_id"] = self.sensor_id
        return data

    def shutdown(self):
        pass