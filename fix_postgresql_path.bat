@echo off
REM This script adds PostgreSQL to your system PATH

echo =========================================================
echo Adding PostgreSQL to System PATH
echo =========================================================

REM Check if PostgreSQL is installed
if exist "C:\Program Files\PostgreSQL\18\bin" (
    echo Found PostgreSQL 18
    setx PATH "%PATH%;C:\Program Files\PostgreSQL\18\bin"
    echo Successfully added PostgreSQL 18 to PATH!
    goto success
)

if exist "C:\Program Files\PostgreSQL\17\bin" (
    echo Found PostgreSQL 17
    setx PATH "%PATH%;C:\Program Files\PostgreSQL\17\bin"
    echo Successfully added PostgreSQL 17 to PATH!
    goto success
)

if exist "C:\Program Files\PostgreSQL\16\bin" (
    echo Found PostgreSQL 16
    setx PATH "%PATH%;C:\Program Files\PostgreSQL\16\bin"
    echo Successfully added PostgreSQL 16 to PATH!
    goto success
)

if exist "C:\Program Files\PostgreSQL\15\bin" (
    echo Found PostgreSQL 15
    setx PATH "%PATH%;C:\Program Files\PostgreSQL\15\bin"
    echo Successfully added PostgreSQL 15 to PATH!
    goto success
)

echo ERROR: PostgreSQL not found in Program Files
echo Please check that PostgreSQL is installed
pause
exit /b 1

:success
echo =========================================================
echo SUCCESS! PostgreSQL added to PATH
echo =========================================================
echo.
echo Next steps:
echo 1. Close this Command Prompt window
echo 2. Open a NEW Command Prompt window
echo 3. Test: psql --version
echo 4. You should see: psql (PostgreSQL) XX.X
echo.
echo =========================================================
pause
