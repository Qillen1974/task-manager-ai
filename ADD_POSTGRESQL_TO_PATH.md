# Fix: PostgreSQL Not Recognized - Add to System PATH

## Problem
You installed PostgreSQL but `psql --version` says "psql is not a recognised command"

## Solution
PostgreSQL is installed but not in your system PATH. Here are two ways to fix it:

---

## Method 1: Automatic (Easier) ⭐

### Step 1: Run the Fix Script
1. Go to your project folder: `C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai\`
2. Find file: `fix_postgresql_path.bat`
3. **Right-click** → "Run as Administrator"
4. Wait for success message
5. Click the window when it says to continue

### Step 2: Test
1. **Close** the current Command Prompt
2. **Open NEW** Command Prompt (Windows Key + R → cmd)
3. Type: `psql --version`
4. Should show: `psql (PostgreSQL) 16.0` (or similar)

✅ **If you see the version, you're done!**

---

## Method 2: Manual (If Script Doesn't Work)

### Step 1: Open Environment Variables

1. Press **Windows Key + R**
2. Type: `sysdm.cpl`
3. Press **Enter**

System Properties window opens.

### Step 2: Go to Environment Variables

1. Click **"Environment Variables"** button (bottom right)
2. New window opens

### Step 3: Add PostgreSQL to PATH

**Upper section** (User variables):
1. Click **"New"** button
2. Variable name: `PATH`
3. Variable value:
   - If PostgreSQL 16: `C:\Program Files\PostgreSQL\16\bin`
   - If PostgreSQL 17: `C:\Program Files\PostgreSQL\17\bin`
   - If PostgreSQL 15: `C:\Program Files\PostgreSQL\15\bin`
4. Click **"OK"**

### Step 4: Apply Changes

1. Click **"OK"** on Environment Variables window
2. Click **"OK"** on System Properties window

### Step 5: Restart Command Prompt

1. **Close** current Command Prompt
2. **Open NEW** Command Prompt (Windows Key + R → cmd)
3. Type: `psql --version`

Should show PostgreSQL version now!

---

## Method 3: Manual - Edit Existing PATH (Advanced)

If you already have a PATH variable:

1. Open Environment Variables (Windows Key + R → sysdm.cpl)
2. Under "User variables", find **"PATH"**
3. Click **"Edit"**
4. Click **"New"**
5. Add: `C:\Program Files\PostgreSQL\16\bin` (adjust version as needed)
6. Click **"OK"** multiple times

---

## Verify PostgreSQL Version

After fixing PATH, test:

```bash
psql --version
```

Should output something like:
```
psql (PostgreSQL) 16.0
```

If you see this, **PostgreSQL is now in your PATH!** ✅

---

## What PostgreSQL Version Do I Have?

Check which version is installed:

**Look in:** `C:\Program Files\PostgreSQL\`

You should see a folder like:
- `PostgreSQL\16` or
- `PostgreSQL\17` or
- `PostgreSQL\15`

Whatever folder you see, use that version number in the PATH.

**Example:**
- If you see folder `PostgreSQL\16`, use: `C:\Program Files\PostgreSQL\16\bin`
- If you see folder `PostgreSQL\17`, use: `C:\Program Files\PostgreSQL\17\bin`

---

## Still Not Working?

### Check if PostgreSQL is Actually Installed

1. Open File Explorer
2. Go to: `C:\Program Files\PostgreSQL\`
3. Do you see a folder there?
   - **Yes** → PostgreSQL is installed (use Path methods above)
   - **No** → PostgreSQL not installed properly (reinstall)

### Restart Computer

PATH changes sometimes require restart:
1. Save all work
2. Restart your computer
3. Open new Command Prompt
4. Test: `psql --version`

### Reinstall PostgreSQL

If nothing works:
1. Uninstall PostgreSQL completely (Add/Remove Programs)
2. Restart computer
3. Download fresh installer: https://www.postgresql.org/download/windows/
4. Install again
5. Run `fix_postgresql_path.bat` script

---

## Next Steps (After Fixing PATH)

Once `psql --version` works:

1. Test database connection:
   ```bash
   psql -U postgres
   # Enter password: postgres123
   \q
   ```

2. Continue with database setup:
   - Follow: `SETUP_DATABASE_GUIDE.md`
   - Or: `QUICK_DATABASE_SETUP.txt`

---

## Common Mistakes

❌ **Mistake:** Copying path without `\bin`
- Wrong: `C:\Program Files\PostgreSQL\16`
- Right: `C:\Program Files\PostgreSQL\16\bin`

❌ **Mistake:** Not restarting Command Prompt
- You MUST close and open NEW Command Prompt
- PATH changes don't apply to already-open windows

❌ **Mistake:** Wrong PostgreSQL version
- Check which version in `C:\Program Files\PostgreSQL\`
- Use that version in PATH

---

## Quick Reference

**Add to PATH:**
```
C:\Program Files\PostgreSQL\16\bin
```

(Change 16 to your version: 15, 17, etc.)

**Test PATH:**
```bash
psql --version
```

**Connect to PostgreSQL:**
```bash
psql -U postgres
# Enter password when prompted
```

---

## Need Help?

If you're still stuck after trying both methods:

1. **Check PostgreSQL is installed:**
   - File Explorer → C:\Program Files\PostgreSQL\
   - Should have a folder with version number

2. **Check version number:**
   - What folder do you see? (16, 17, 15?)
   - Use that in the PATH

3. **Verify PATH edit:**
   - Windows Key + R → sysdm.cpl
   - Check PATH contains PostgreSQL bin folder
   - Restart computer if needed

4. **Try restart:**
   - Close all Command Prompts
   - Restart your computer
   - Open NEW Command Prompt
   - Test again

---

**Once PATH is fixed, you can proceed with database setup!** ✅

See: `QUICK_DATABASE_SETUP.txt` or `SETUP_DATABASE_GUIDE.md`
