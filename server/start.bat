@echo off
REM Production startup script for Myanmar Explorer API (Windows)
REM Note: Gunicorn doesn't work on Windows - Deploy to Linux/Render for production

echo ========================================
echo Myanmar Explorer API
echo ========================================
echo.
echo WARNING: Gunicorn does not work on Windows!
echo.
echo For PRODUCTION deployment:
echo   1. Deploy to Render.com (Linux environment)
echo   2. Use WSL (Windows Subsystem for Linux)
echo   3. Use Docker with Linux container
echo.
echo For LOCAL DEVELOPMENT on Windows:
echo   Run: dev.bat
echo.
echo Gunicorn requires a Unix-based system.
echo.
pause
