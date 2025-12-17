@echo off
echo ========================================
echo Starting TaskQuadrant Mobile App
echo ========================================
echo.
echo Please wait while Expo starts...
echo The QR code will appear in ~30-60 seconds
echo.
cd /d "%~dp0"
npx expo start --clear
pause
