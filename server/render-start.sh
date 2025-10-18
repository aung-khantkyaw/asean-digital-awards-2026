#!/bin/bash

echo "Starting Myanmar Explorer API on Render..."

# Run database migrations if needed
if [ -f "migrations/migrate.py" ]; then
    echo "Running database migrations..."
    python migrations/migrate.py
fi

# Start the production server with Gunicorn
echo "Starting Gunicorn production server..."
exec gunicorn -c gunicorn.conf.py app:app
