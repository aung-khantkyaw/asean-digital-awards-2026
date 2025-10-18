@echo off
REM Production startup script for Myanmar Explorer API (Windows)
REM Note: Gunicorn doesn't work on Windows. Using Waitress instead.

echo Starting Myanmar Explorer API in PRODUCTION mode (Windows)...

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt waitress

REM Set production environment
set FLASK_ENV=production

REM Start with Waitress (Windows-compatible production server)
echo Starting Waitress server...
echo.
echo Server will be available at: http://0.0.0.0:4000
echo Press Ctrl+C to stop
echo.
waitress-serve --host=0.0.0.0 --port=4000 --threads=8 --call app:app
