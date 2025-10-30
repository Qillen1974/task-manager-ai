@echo off
REM This script creates the PostgreSQL database and user for TaskMaster

echo =========================================================
echo Setting up PostgreSQL Database for TaskMaster
echo =========================================================
echo.
echo This will create:
echo   - Database: taskmaster_dev
echo   - User: taskmaster
echo   - Password: taskmaster123
echo.
echo When prompted, enter PostgreSQL superuser password: postgres123
echo.
pause

REM Create database and user
psql -U postgres -c "CREATE DATABASE taskmaster_dev;" 2>nul
if errorlevel 1 (
    echo Note: Database taskmaster_dev may already exist
)

psql -U postgres -c "CREATE USER taskmaster WITH PASSWORD 'taskmaster123';" 2>nul
if errorlevel 1 (
    echo Note: User taskmaster may already exist
)

psql -U postgres -c "ALTER ROLE taskmaster SET client_encoding TO 'utf8';"
psql -U postgres -c "ALTER ROLE taskmaster SET default_transaction_isolation TO 'read committed';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE taskmaster_dev TO taskmaster;"

echo.
echo =========================================================
echo Database Setup Complete!
echo =========================================================
echo.
echo Testing connection...

REM Test connection
psql -U taskmaster -d taskmaster_dev -c "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Could not connect to database
    echo Make sure:
    echo   1. PostgreSQL is running
    echo   2. User taskmaster was created successfully
    echo   3. Password is taskmaster123
    pause
    exit /b 1
)

echo Successfully connected to taskmaster_dev!
echo.
echo You can now run: npx prisma migrate deploy
echo.
pause
