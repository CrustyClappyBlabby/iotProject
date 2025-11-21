CONFIG = {
    "device_id": "CDA_02",  # Unique identifier for this CDA device
    "room_id": "living_room",  # Default room identifier for this CDA device
    "broker": "884ce594917f4f0bb39af8bf2243097f.s1.eu.hivemq.cloud",
    "port": 8883,
    "username": "sunghyun",
    "password": "Hivemq2025",
    "topic_prefix": "SensorData",  # Will be used as SensorData/{device_id}
    
    # Sensor configuration
    "read_interval": 10,  # seconds between readings
    "read_timeout": 3,    # seconds to wait for a sensor reading before timing out
    
    # Error handling
    "max_retries": 3,     # Maximum number of retries for failed sensor readings
    "retry_delay": 1      # Seconds to wait between retries
}