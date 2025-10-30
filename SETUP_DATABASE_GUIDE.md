# TaskMaster - Database Setup Guide for Windows

This guide will walk you through setting up PostgreSQL and connecting it to your TaskMaster application.

**Estimated time: 30-45 minutes**

---

## What You'll Do

1. ✅ Install PostgreSQL (15 minutes)
2. ✅ Create database and user (5 minutes)
3. ✅ Verify connection (5 minutes)
4. ✅ Run Prisma migrations (5 minutes)
5. ✅ Start application with database (5 minutes)

---

## Step 1: Install PostgreSQL

### Download PostgreSQL Installer

1. **Open your browser** and go to:
   ```
   https://www.postgresql.org/download/windows/
   ```

2. **Click "Download the installer"**

3. **Choose version**: Select the latest version (16 or 17)

4. **Find the downloaded file**:
   - Look in `C:\Users\charl\Downloads\`
   - File name looks like: `postgresql-XX-windows-x64.exe`

### Run the Installer

1. **Right-click the installer** and select "Run as Administrator"

2. **Click "Yes"** if prompted by Windows security

3. **Follow the installation wizard:**

   **Step 1: Welcome**
   - Click "Next"

   **Step 2: Installation Directory**
   - Keep default: `C:\Program Files\PostgreSQL\XX`
   - Click "Next"

   **Step 3: Components to Install**
   - ✅ PostgreSQL Server (required)
   - ✅ pgAdmin 4 (optional, for GUI)
   - ✅ Command Line Tools (required)
   - Click "Next"

   **Step 4: Data Directory**
   - Keep default
   - Click "Next"

   **Step 5: Database Superuser Password** ⚠️ IMPORTANT
   - Set password to: `postgres123`
   - Confirm password: `postgres123`
   - ✍️ **Write this down!**
   - Click "Next"

   **Step 6: Port**
   - Keep default: `5432`
   - Click "Next"

   **Step 7: Locale**
   - Keep default
   - Click "Next"

   **Step 8: Ready to Install**
   - Click "Next"
   - **Wait for installation** (2-5 minutes)
   - ✅ Installation complete!

4. **Finish**
   - Click "Finish"
   - You can uncheck "Launch Stack Builder"

### Verify Installation

1. **Open Command Prompt:**
   - Press Windows Key + R
   - Type: `cmd`
   - Press Enter

2. **Test PostgreSQL:**
   ```bash
   psql --version
   ```

3. **Should see output like:**
   ```
   psql (PostgreSQL) 16.0
   ```

   ✅ If you see this, PostgreSQL is installed!

   ❌ If "psql: command not found":
   - Restart your computer
   - Try again

---

## Step 2: Create Database and User

### Open PostgreSQL Terminal

1. **Open Command Prompt** (Windows Key + R → cmd)

2. **Connect to PostgreSQL:**
   ```bash
   psql -U postgres
   ```

3. **Enter password:**
   - Type: `postgres123`
   - Press Enter

4. **You should see prompt:**
   ```
   postgres=#
   ```

   ✅ If you see this, you're connected!

### Create Database

**Copy and paste these commands one by one:**

```sql
CREATE DATABASE taskmaster_dev;
```

**Press Enter. Should see:**
```
CREATE DATABASE
```

```sql
CREATE USER taskmaster WITH PASSWORD 'taskmaster123';
```

**Should see:**
```
CREATE ROLE
```

```sql
ALTER ROLE taskmaster SET client_encoding TO 'utf8';
```

**Should see:**
```
ALTER ROLE
```

```sql
ALTER ROLE taskmaster SET default_transaction_isolation TO 'read committed';
```

**Should see:**
```
ALTER ROLE
```

```sql
GRANT ALL PRIVILEGES ON DATABASE taskmaster_dev TO taskmaster;
```

**Should see:**
```
GRANT
```

### Exit PostgreSQL

```sql
\q
```

**You should be back to regular command prompt.**

---

## Step 3: Verify Database Connection

### Test Connection

**In Command Prompt, type:**

```bash
psql -U taskmaster -d taskmaster_dev -c "SELECT 1"
```

**Enter password:**
- Type: `taskmaster123`
- Press Enter

**Should see:**
```
 ?column?
----------
        1
(1 row)
```

✅ **If you see this, database is working!**

---

## Step 4: Update Your Application

### Already Done! ✅

I've already updated your `.env.local` file with:
- Database: `taskmaster_dev`
- User: `taskmaster`
- Password: `taskmaster123`
- Host: `localhost`
- Port: `5432`

### Verify the Configuration

Open file: `C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai\.env.local`

Look for this line:
```
DATABASE_URL="postgresql://taskmaster:taskmaster123@localhost:5432/taskmaster_dev"
```

✅ Should be there!

---

## Step 5: Create Database Tables

### Stop the Running Application

1. **Find the terminal where the app is running** (where you see `http://localhost:3001`)
2. **Press Ctrl+C** to stop it

### Run Prisma Migrations

1. **Open Command Prompt**

2. **Navigate to your project:**
   ```bash
   cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai"
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

   **Wait for completion...**

4. **Create database tables:**
   ```bash
   npx prisma migrate deploy
   ```

   **Should see:**
   ```
   Applying migration `20240101000000_init`

   The following migration(s) have been applied:

   migrations/
     └─ 20240101000000_init/
       └─ migration.sql

   All migrations have been applied successfully.
   ```

   ✅ **If you see this, tables are created!**

### Optional: View Database Structure

**To see the database visually:**

```bash
npx prisma studio
```

- This opens a browser at `http://localhost:5555`
- Shows all your database tables
- You can browse the structure

---

## Step 6: Restart Your Application

### Start the Application

```bash
npm run dev
```

**Wait for it to compile...**

**Should see:**
```
✓ Ready in X seconds
http://localhost:3001
```

### Open Application

1. **Open browser:**
   ```
   http://localhost:3001
   ```

2. **Create a new account:**
   - Email: `yourname@example.com`
   - Password: `YourPassword123!`

3. **Create a project and task**

4. **Refresh the page** - Data should still be there!

   ✅ **Data now saved in PostgreSQL!**

---

## Troubleshooting

### Problem: "psql: command not found"

**Solution:**
1. Restart your computer
2. Try again
3. If still fails, add PostgreSQL to PATH:
   - Open System Properties
   - Advanced → Environment Variables
   - Add to PATH: `C:\Program Files\PostgreSQL\16\bin`
   - Restart Command Prompt

### Problem: "password authentication failed"

**Solution:**
- Double-check password: should be `postgres123`
- Check .env.local: should have `taskmaster123`

### Problem: "database 'taskmaster_dev' does not exist"

**Solution:**
1. Create the database again:
   ```bash
   psql -U postgres
   # Enter password: postgres123
   CREATE DATABASE taskmaster_dev;
   \q
   ```

### Problem: "Port 5432 in use"

**Solution:**
1. Kill the process using port 5432:
   ```bash
   netstat -ano | findstr :5432
   ```
2. Or use a different port:
   - During PostgreSQL installation, use port 5433
   - Update .env.local: `DATABASE_URL="postgresql://...@localhost:5433/..."`

### Problem: "Cannot connect to database"

**Solution:**
1. Check PostgreSQL is running:
   - Open Services (Windows+R → services.msc)
   - Find "postgresql-x64-XX"
   - Right-click → Start

2. Check .env.local has correct credentials

3. Restart application

---

## Verify Everything Works

### Quick Test

1. **Open browser:** `http://localhost:3001`

2. **Create account:**
   - Email: `test@example.com`
   - Password: `Test1234!@`

3. **Create project:**
   - Name: "Test Project"
   - Color: Blue

4. **Create task:**
   - Title: "Test Task"
   - Project: "Test Project"

5. **Refresh browser** (F5)

6. **Do you see the task?**
   - ✅ **YES** = Database working!
   - ❌ **NO** = Check troubleshooting above

---

## Command Reference

**Connect as superuser:**
```bash
psql -U postgres
```

**Connect as taskmaster:**
```bash
psql -U taskmaster -d taskmaster_dev
```

**List databases:**
```bash
psql -U postgres -l
```

**Run Prisma Studio:**
```bash
npx prisma studio
```

**Check PostgreSQL status:**
```bash
psql -U postgres -c "SELECT version();"
```

---

## Next Steps

Once database is working:

1. ✅ Database setup complete!
2. ⏭️ Application will continue to work
3. ⏭️ You can use API for advanced features later
4. ⏭️ When ready, deploy to VPS

---

## Need Help?

If you get stuck:
1. Read the error message carefully
2. Check troubleshooting section above
3. Verify PostgreSQL is running
4. Check .env.local has correct credentials
5. Restart application

---

## What's Next?

Your TaskMaster app now:
- ✅ Uses PostgreSQL database
- ✅ Stores all data persistently
- ✅ Ready for professional use
- ✅ Can scale to multiple users

**Congratulations! You've set up a professional database backend!** 🎉

---

**Questions?** Check the QUICK_START_PRODUCTION.md or PRODUCTION_SETUP.md files.
