@echo off
title Udemy Offline Player — Windows Launcher
echo =============================================
echo 🎓 Udemy Offline Player — Windows Startup Helper
echo =============================================
echo.

set "script_dir=%~dp0"

if exist "%script_dir%Udemy Offline Player.exe" (
    echo 🚀 Launching Udemy Offline Player...
    start "" "%script_dir%Udemy Offline Player.exe"
) else if exist "%ProgramFiles%\Udemy Offline Player\Udemy Offline Player.exe" (
    echo 🚀 Launching Udemy Offline Player...
    start "" "%ProgramFiles%\Udemy Offline Player\Udemy Offline Player.exe"
) else (
    echo ❌ Error: Could not find 'Udemy Offline Player.exe'.
    echo Please make sure this script is placed in the same folder as 'Udemy Offline Player.exe'.
    echo.
    pause
)
