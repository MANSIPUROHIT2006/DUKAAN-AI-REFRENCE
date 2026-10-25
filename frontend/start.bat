@echo off
title DukaanAI - Frontend
echo ========================================================
echo Opening DukaanAI Frontend...
echo ========================================================

set "PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"

cd /d "%~dp0"
echo Opening frontend/index.html in default browser...
start "" "index.html"
echo.
echo Make sure your backend server is running on http://localhost:8000!
pause
