# PostgreSQL Setup for Windows - Complete Guide

## Step 1: Download PostgreSQL Installer

1. Go to: https://www.postgresql.org/download/windows/
2. Click on **"Download the installer"** link
3. Choose the latest version (e.g., PostgreSQL 16 or 17)
4. The download will start automatically

## Step 2: Run the PostgreSQL Installer

1. Find the downloaded file (usually in `C:\Users\charl\Downloads\`)
2. Look for: `postgresql-XX-windows-x64.exe`
3. **Right-click** and select **"Run as Administrator"**
4. Click "Yes" if prompted by User Account Control

## Step 3: Installation Wizard - Follow These Steps

### Screen 1: Welcome
- Click **"Next"**

### Screen 2: Installation Directory
- Keep default: `C:\Program Files\PostgreSQL\16`
- Click **"Next"**

### Screen 3: Select Components
- ✅ PostgreSQL Server
- ✅ pgAdmin 4 (optional, for GUI management)
- ✅ Stack Builder
- ✅ Command Line Tools
- Click **"Next"**

### Screen 4: Data Directory
- Keep default: `C:\Program Files\PostgreSQL\16\data`
- Click **"Next"**

### Screen 5: Superuser Password (IMPORTANT!)
⚠️ **Remember this password!**

Set password: `postgres123`

(You can use any password, but remember it)

- Click **"Next"**

### Screen 6: Port
- Keep default: **5432**
- Click **"Next"**

### Screen 7: Locale
- Keep default: `[Default locale]`
- Click **"Next"**

### Screen 8: Ready to Install
- Click **"Next"** to start installation

### Installation Progress
- Wait for installation to complete (2-5 minutes)
- Don't close the window

### Screen 9: Stack Builder (Optional)
- You can uncheck "Launch Stack Builder at exit"
- Click **"Finish"**

## Step 4: Verify Installation

Open Command Prompt and test:

```bash
psql --version
```

Should show something like: `psql (PostgreSQL) 16.0`

## Step 5: Create Database and User

Open Command Prompt and run:

```bash
# Connect to PostgreSQL with superuser
psql -U postgres
```

Enter the password you set (`postgres123`)

You should see the `postgres=#` prompt.

**Now paste these commands:**

```sql
CREATE DATABASE taskmaster_dev;
CREATE USER taskmaster WITH PASSWORD 'taskmaster123';
ALTER ROLE taskmaster SET client_encoding TO 'utf8';
ALTER ROLE taskmaster SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE taskmaster_dev TO taskmaster;
\q
```

**You should see:**
```
CREATE DATABASE
CREATE ROLE
ALTER ROLE
ALTER ROLE
GRANT
```

Then back to regular command prompt.

## Step 6: Verify Database Creation

```bash
psql -U taskmaster -d taskmaster_dev -c "SELECT 1"
```

Should output:
```
 ?column?
----------
        1
(1 row)
```

If you see this, PostgreSQL is working! ✅

## Troubleshooting

### "psql: command not found"
- PostgreSQL not in PATH
- Solution: Use full path: `"C:\Program Files\PostgreSQL\16\bin\psql.exe"`
- Or restart Command Prompt after installation

### "password authentication failed"
- Wrong password
- Solution: Use the password you set during installation (`postgres123`)

### "Connection refused"
- PostgreSQL not running
- Solution:
  - Open "Services" (Windows+R → services.msc)
  - Find "postgresql-x64-16"
  - Right-click → "Start"

### Port already in use
- Port 5432 already taken
- Solution:
  - During installation, use a different port (e.g., 5433)
  - Update .env.local with new port

## Optional: pgAdmin 4 (GUI for Database Management)

If you installed pgAdmin 4:

1. It should open automatically after installation
2. Browser opens to http://localhost:5050
3. Create master password (remember it!)
4. Add server:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: postgres123

## Next Steps

After successful PostgreSQL installation:

1. Update .env.local (if not already done)
2. Run Prisma migrations
3. Restart application
4. Database will be used instead of localStorage

## Quick Reference

**PostgreSQL Connection Details:**
- Host: localhost
- Port: 5432
- Database: taskmaster_dev
- User: taskmaster
- Password: taskmaster123

**Useful Commands:**

```bash
# Connect as superuser
psql -U postgres

# Connect as taskmaster user
psql -U taskmaster -d taskmaster_dev

# List all databases
\l

# List all users
\du

# Connect to database
\c taskmaster_dev

# Show all tables
\dt

# Exit psql
\q
```

## Need Help?

If installation fails:
1. Uninstall PostgreSQL completely
2. Restart your computer
3. Download installer again
4. Try installation again

Common issues are usually resolved by restarting!

---

**Once PostgreSQL is installed and verified, let me know and I'll set up the database connection!**
