@echo off
setlocal enabledelayedexpansion

:: Ensure script always runs in its own directory
cd /d "%~dp0"

title Process Synchronization and Memory Management Visualizer

echo =====================================================================
echo    PROCESS SYNCHRONIZATION AND MEMORY MANAGEMENT VISUALIZER
echo    Operating Systems Interactive Learning Platform
echo =====================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js LTS version from:
    echo https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: 2. Check if node_modules folder exists
if not exist "node_modules\" (
    echo [INFO] Dependencies not detected. Running npm install...
    echo Please wait while dependencies are being installed...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed. Please check your internet connection or permissions.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

:: 3. Check if .env exists, if not copy from .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env file from .env.example...
        copy .env.example .env >nul
    )
)

:: 4. Launch the application
echo [INFO] Starting Node.js backend server...
echo Server running at: http://localhost:3000
echo.

:: Launch browser in background after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul 2>nul & start http://localhost:3000"

:: Start the server in foreground so logs are visible
node server.js

pause
