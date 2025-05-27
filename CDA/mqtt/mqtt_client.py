import ssl
import paho.mqtt.client as mqtt

class MqttPublisher:
    def __init__(self, broker, port, username, password, topic_prefix, device_id):
        self.topic_prefix = topic_prefix
        self.device_id = device_id
        self.full_topic = f"{topic_prefix}/{device_id}"
        
        # Create client with unique ID based on device_id
        self.client = mqtt.Client(client_id=f"CDA_{device_id}", protocol=mqtt.MQTTv5)
        self.client.username_pw_set(username, password)
        self.client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
        
        # Set up callbacks for connection monitoring
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
        
        # Connect with automatic reconnection
        self.client.connect_async(broker, port, keepalive=60)
        self.client.reconnect_delay_set(min_delay=1, max_delay=120)
        self.client.loop_start()
        
        # Message queue for handling temporary disconnections
        self.message_queue = []
        self.max_queue_size = 100
        self.connected = False

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print(f"[MQTT] Connected to broker (RC={rc})")
            self.connected = True
            # Send any queued messages
            self._process_message_queue()
        else:
            print(f"[MQTT] Failed to connect, return code {rc}")
            self.connected = False

    def _on_disconnect(self, client, userdata, rc, properties=None):
        print(f"[MQTT] Disconnected from broker (RC={rc})")
        self.connected = False

    def _on_publish(self, client, userdata, mid, properties=None):
        print(f"[MQTT] Message {mid} published successfully")

    def _process_message_queue(self):
        """Process any queued messages when connection is restored"""
        if not self.connected:
            return
            
        while self.message_queue and self.connected:
            topic, payload, qos = self.message_queue.pop(0)
            self.client.publish(topic, payload, qos=qos)
            print(f"[MQTT] Published queued message to {topic}")

    def publish(self, message, qos=1):
        """Publish a message with the specified QoS level"""
        if self.connected:
            result = self.client.publish(self.full_topic, message, qos=qos)
            if result.rc != mqtt.MQTT_ERR_SUCCESS:
                print(f"[MQTT] Error publishing message: {result.rc}")
                # Queue the message for later retry
                if len(self.message_queue) < self.max_queue_size:
                    self.message_queue.append((self.full_topic, message, qos))
                    print(f"[MQTT] Message queued for later delivery")
                else:
                    print(f"[MQTT] Message queue full, dropping oldest message")
                    self.message_queue.pop(0)  # Remove oldest message
                    self.message_queue.append((self.full_topic, message, qos))
        else:
            # Queue the message for when connection is restored
            if len(self.message_queue) < self.max_queue_size:
                self.message_queue.append((self.full_topic, message, qos))
                print(f"[MQTT] Not connected, message queued for later delivery")
            else:
                print(f"[MQTT] Message queue full, dropping oldest message")
                self.message_queue.pop(0)  # Remove oldest message
                self.message_queue.append((self.full_topic, message, qos))

    def shutdown(self):
        """Gracefully shutdown the MQTT client"""
        print("[MQTT] Shutting down MQTT publisher...")
        self.client.loop_stop()
        self.client.disconnect()