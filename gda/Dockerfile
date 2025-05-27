# ─── STAGE 1: BUILD ─────────────────────────────────────────
FROM maven:3.8.7-eclipse-temurin-17 AS builder
WORKDIR /workspace

# copy pom and source
COPY pom.xml .
COPY src ./src

# build fat-jar
RUN mvn -B package -DskipTests

# ─── STAGE 2: RUNTIME ────────────────────────────────────────
FROM openjdk:17-jdk-slim
WORKDIR /app

# Install necessary tools for healthcheck
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

# copy the shaded JAR from the builder
COPY --from=builder /workspace/target/hivemq-subscriber-1.0.0.jar ./hivemq-subscriber-1.0.0.jar

# Environment variables for configuration
ENV LOG_LEVEL="INFO"
ENV MQTT_RECONNECT_DELAY="5"
ENV INFLUXDB_BATCH_SIZE="100"

# Healthcheck to ensure the application is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ps aux | grep java | grep hivemq-subscriber || exit 1

# run your subscriber in the foreground with configurable JVM options
CMD ["java", "-Xms256m", "-Xmx512m", "-jar", "hivemq-subscriber-1.0.0.jar"]

