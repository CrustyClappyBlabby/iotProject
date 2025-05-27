CONFIG = {
    "device_id": "CDA_02",  # Unique identifier for this CDA device
    "room_id": "living_room",  # Default room identifier for this CDA device
    "broker": "5b3009ec3ac740e9bca14abfc408b9b2.s1.eu.hivemq.cloud",
    "port": 8883,
    "username": "RustyHive",
    "password": "Jammerlap!234",
    "topic_prefix": "SensorData",  # Will be used as SensorData/{device_id}
    
    # Sensor configuration
    "read_interval": 10,  # seconds between readings
    "read_timeout": 3,    # seconds to wait for a sensor reading before timing out
    
    # Error handling
    "max_retries": 3,     # Maximum number of retries for failed sensor readings
    "retry_delay": 1      # Seconds to wait between retries
}