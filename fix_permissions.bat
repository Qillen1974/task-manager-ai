@echo off
REM Fix PostgreSQL permissions for taskmaster user

echo =========================================================
echo Fixing PostgreSQL Schema Permissions
echo =========================================================
echo.
echo This will grant permissions to taskmaster user...
echo.

REM Grant schema permissions
psql -U postgres -d taskmaster_dev -c "GRANT ALL PRIVILEGES ON SCHEMA public TO taskmaster;"
psql -U postgres -d taskmaster_dev -c "ALTER SCHEMA public OWNER TO taskmaster;"

echo.
echo =========================================================
echo Permissions Updated!
echo =========================================================
echo.
echo Now you can run: npx prisma migrate deploy
echo.
pause
