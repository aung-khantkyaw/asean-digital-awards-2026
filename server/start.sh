#!/bin/bash
# Production startup script for Myanmar Explorer API

echo "Starting Myanmar Explorer API in PRODUCTION mode..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set production environment
export FLASK_ENV=production

# Start with Gunicorn
echo "Starting Gunicorn server..."
gunicorn -c gunicorn.conf.py app:app
