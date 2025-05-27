# ─── lightweight Python 3 base ─────────────────────────────────────────────
FROM python:3.11-slim

# install runtime deps (for native builds & GPIO access if needed)
RUN apt-get update && apt-get install -y \
    python3-dev gcc libgpiod-dev git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ─── force-install Adafruit_DHT with the --force-pi flag ─────────────────────
RUN pip install --no-cache-dir \
        --no-binary=:all: \
        --global-option="--force-pi" \
        Adafruit_DHT

# ─── install the rest of your Python libraries ───────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── copy your application code ──────────────────────────────────────────────
COPY . .

# ─── environment variables for configuration ───────────────────────────────────
ENV DEVICE_ID=""
ENV ROOM_ID=""
ENV LOG_LEVEL="INFO"
ENV READ_INTERVAL="10"
ENV READ_TIMEOUT="3"
ENV MAX_RETRIES="3"

# ─── healthcheck to ensure the application is running properly ─────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ps aux | grep python | grep main.py || exit 1

# ─── run your main script ───────────────────────────────────────────────────
CMD ["python", "main.py"]
