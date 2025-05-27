import time
import logging
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor, TimeoutError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class BaseSensor(ABC):
    def __init__(self, sensor_type, device_id):
        self.sensor_type = sensor_type
        self.device_id = device_id
        self.logger = logging.getLogger(f"{sensor_type}_{device_id}")
        self.executor = ThreadPoolExecutor(max_workers=1)
        self.last_reading = None
        self.read_count = 0
        self.error_count = 0

    @abstractmethod
    def _read_sensor(self):
        """Actual sensor reading implementation to be overridden by subclasses"""
        pass

    def read(self, timeout=3, max_retries=3, retry_delay=1):
        """
        Read sensor data with timeout and retry logic
        
        Args:
            timeout: Maximum seconds to wait for sensor reading
            max_retries: Number of times to retry if reading fails
            retry_delay: Seconds to wait between retries
            
        Returns:
            Dictionary with sensor data or None if all attempts fail
        """
        self.read_count += 1
        retries = 0
        
        while retries <= max_retries:
            try:
                # Use ThreadPoolExecutor to implement timeout
                future = self.executor.submit(self._read_sensor)
                result = future.result(timeout=timeout)
                
                if result:
                    self.last_reading = result
                    if retries > 0:
                        self.logger.info(f"Successful read after {retries} retries")
                    return result
                    
            except TimeoutError:
                self.logger.warning(f"Sensor read timed out after {timeout}s")
                self.error_count += 1
            except Exception as e:
                self.logger.error(f"Error reading sensor: {str(e)}")
                self.error_count += 1
            
            retries += 1
            if retries <= max_retries:
                self.logger.info(f"Retrying in {retry_delay}s (attempt {retries}/{max_retries})")
                time.sleep(retry_delay)
        
        self.logger.error(f"Failed to read sensor after {max_retries} retries")
        # Return last successful reading if available, otherwise None
        return self.last_reading

    def format_data(self, data, timestamp):
        """
        Format sensor data for MQTT publishing
        
        Args:
            data: Dictionary with sensor readings
            timestamp: ISO format timestamp
            
        Returns:
            Formatted data dictionary
        """
        # Don't modify the original data
        formatted = data.copy()
        
        # Add metadata
        formatted["timestamp"] = timestamp
        formatted["sensor_type"] = self.sensor_type
        formatted["reading_id"] = f"{self.device_id}_{self.read_count}"
        
        # Add sensor stats
        formatted["stats"] = {
            "read_count": self.read_count,
            "error_count": self.error_count
        }
        
        return formatted

    def get_stats(self):
        """Return sensor statistics"""
        return {
            "sensor_type": self.sensor_type,
            "device_id": self.device_id,
            "read_count": self.read_count,
            "error_count": self.error_count,
            "success_rate": (self.read_count - self.error_count) / max(1, self.read_count) * 100
        }

    def shutdown(self):
        """Clean up resources"""
        self.logger.info(f"Shutting down {self.sensor_type} sensor")
        self.executor.shutdown(wait=False)