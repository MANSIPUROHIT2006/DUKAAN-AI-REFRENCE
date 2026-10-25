@echo off
title DukaanAI - Backend Server
echo ========================================================
echo Starting DukaanAI Backend Server...
echo ========================================================

set "PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not recognized.
    pause
    exit /b 1
)

cd /d "%~dp0"
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo DukaanAI Backend starting on port 8000...
node server.js
pause
