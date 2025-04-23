import ssl
import paho.mqtt.client as mqtt

class MqttPublisher:
    def __init__(self, broker, port, username, password, topic):
        self.topic = topic
        self.client = mqtt.Client(client_id="pythonPublisher", protocol=mqtt.MQTTv5)
        self.client.username_pw_set(username, password)
        self.client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
        self.client.tls_insecure_set(True)
        self.client.connect(broker, port, keepalive=60)
        self.client.loop_start()

    def publish(self, message):
        self.client.publish(self.topic, message, qos=1)

    def shutdown(self):
        self.client.loop_stop()
        self.client.disconnect()