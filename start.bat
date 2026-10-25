@echo off
title DukaanAI - Voice-Led Shop Ledger
echo ========================================================
echo Starting DukaanAI Backend and Frontend...
echo ========================================================

:: Ensure node and npm paths are active
set "PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not recognized in PATH.
    echo Please install Node.js from https://nodejs.org or restart your PC.
    pause
    exit /b 1
)

echo [OK] Using Node.js:
node -v

cd /d "%~dp0backend"
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo.
echo ========================================================
echo DukaanAI server starting at http://localhost:8000
echo Opening web browser...
echo ========================================================
start "" "http://localhost:8000"

node server.js
pause
