@echo off
REM Development startup script for Myanmar Explorer API (Windows)

echo Starting Myanmar Explorer API in DEVELOPMENT mode...

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Set development environment
set FLASK_ENV=development

REM Start with Flask development server
echo Starting Flask development server...
python app.py
