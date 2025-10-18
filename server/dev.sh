#!/bin/bash
# Development startup script for Myanmar Explorer API

echo "Starting Myanmar Explorer API in DEVELOPMENT mode..."

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

# Set development environment
export FLASK_ENV=development

# Start with Flask development server
echo "Starting Flask development server..."
python app.py
