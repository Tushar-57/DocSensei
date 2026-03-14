FROM python:3.12-slim

# Install system dependencies including Tesseract OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirement and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Start the gunicorn server. $PORT is injected by Render at runtime.
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 240 --graceful-timeout 30 app:app
