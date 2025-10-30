# TaskMaster Database Setup - Complete Instructions

## ✅ What's Been Done

I've prepared everything for you to set up PostgreSQL and connect it to your TaskMaster application. Here's what's ready:

### Configuration Complete
- ✅ `.env.local` updated with database credentials
- ✅ Prisma schema ready (8 database tables)
- ✅ API layer created and waiting for data
- ✅ All dependencies installed

### What You Need to Do (30-45 minutes)
1. Install PostgreSQL (15 minutes)
2. Create database and user (5 minutes)
3. Verify connection (5 minutes)
4. Run migrations (5 minutes)
5. Start application (5 minutes)

---

## 📚 Documentation Files Created

| File | Purpose | Time |
|------|---------|------|
| **QUICK_DATABASE_SETUP.txt** ⭐ | Copy-paste commands | 10 min |
| **SETUP_DATABASE_GUIDE.md** | Step-by-step guide | 30 min |
| **SETUP_POSTGRESQL_WINDOWS.md** | Detailed installation | 45 min |

---

## 🚀 Quick Start (Recommended)

### Option A: Fast Track (30 minutes)

1. **Read:** `QUICK_DATABASE_SETUP.txt` (5 minutes)
2. **Install:** PostgreSQL from https://www.postgresql.org/download/windows/
3. **Run:** Commands from the text file
4. **Done!** Your database is ready

### Option B: Detailed Guide (45 minutes)

1. **Read:** `SETUP_DATABASE_GUIDE.md` (30 minutes)
2. **Follow:** Step-by-step instructions
3. **Verify:** Test connection at each step
4. **Done!** Database is ready

---

## 📋 What You'll Do

### 1. Install PostgreSQL (15 min)
- Download installer
- Run it
- Set superuser password: `postgres123`
- Keep default port: `5432`

### 2. Create Database (5 min)
```bash
psql -U postgres
# Enter: postgres123

CREATE DATABASE taskmaster_dev;
CREATE USER taskmaster WITH PASSWORD 'taskmaster123';
GRANT ALL PRIVILEGES ON DATABASE taskmaster_dev TO taskmaster;
\q
```

### 3. Verify Connection (5 min)
```bash
psql -U taskmaster -d taskmaster_dev -c "SELECT 1"
# Should show: 1
```

### 4. Run Migrations (5 min)
```bash
cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai"
npx prisma generate
npx prisma migrate deploy
```

### 5. Restart Application (5 min)
```bash
npm run dev
```

---

## 🔧 Configuration Details

### Already Updated in .env.local
```
DATABASE_URL="postgresql://taskmaster:taskmaster123@localhost:5432/taskmaster_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NODE_ENV="development"
```

### Database Connection Info
- **Host:** localhost
- **Port:** 5432
- **Database:** taskmaster_dev
- **User:** taskmaster
- **Password:** taskmaster123

---

## ✅ Verification Steps

### After Installing PostgreSQL
```bash
psql --version
# Should show: psql (PostgreSQL) 16.0 (or newer)
```

### After Creating Database
```bash
psql -U taskmaster -d taskmaster_dev -c "SELECT 1"
# Should show: 1
```

### After Running Migrations
```bash
npx prisma studio
# Opens http://localhost:5555
# You can see all database tables
```

### After Restarting Application
1. Open http://localhost:3001
2. Create account
3. Create project
4. Create task
5. Refresh page
6. Data should still be there ✅

---

## 🆘 Troubleshooting

### Installation Issues

**"psql: command not found"**
- PostgreSQL not in system PATH
- Solution: Restart computer, try again
- Or: Add `C:\Program Files\PostgreSQL\XX\bin` to PATH

**Installation fails**
- Uninstall completely
- Restart computer
- Download fresh installer
- Install again

### Connection Issues

**"password authentication failed"**
- Wrong password
- Use `postgres123` for superuser
- Use `taskmaster123` for taskmaster user

**"Connection refused"**
- PostgreSQL not running
- Check Services: Windows+R → services.msc
- Find postgresql-x64-XX → Start service

**"Database does not exist"**
- Run CREATE DATABASE command again
- Or check database spelling in .env.local

### Port Issues

**"Port 5432 in use"**
- Another application using it
- Solution 1: Restart computer
- Solution 2: Use different port (e.g., 5433)
- Update .env.local if using different port

---

## 📊 Database Schema

Tables automatically created:
```
✅ User (user accounts)
✅ Session (login sessions)
✅ Subscription (subscription plans)
✅ Project (user projects)
✅ Task (tasks in projects)
✅ AuditLog (activity tracking)
✅ ApiKey (API key management)
✅ Feedback (user feedback)
```

---

## 🎯 Success Checklist

- [ ] PostgreSQL installed
- [ ] Database created (`taskmaster_dev`)
- [ ] User created (`taskmaster`)
- [ ] Connection verified (SELECT 1 works)
- [ ] .env.local updated (already done ✅)
- [ ] Prisma migrations ran
- [ ] Application started
- [ ] Created account and task
- [ ] Data persists after refresh

---

## 🚀 Next Steps After Setup

1. **Use the app!**
   - Create projects
   - Add tasks
   - Use Eisenhower Matrix
   - All data saved in PostgreSQL

2. **Optional: View database**
   ```bash
   npx prisma studio
   ```
   - Opens graphical database viewer
   - See all your data

3. **When ready for SaaS launch:**
   - Follow PRODUCTION_SETUP.md
   - Deploy to VPS
   - Set up payment (Stripe)
   - Launch to users

---

## 💡 Pro Tips

1. **Keep terminal running**
   - Application needs to stay running
   - Minimize terminal to taskbar

2. **Bookmark the URL**
   - Save http://localhost:3001
   - Quick access each morning

3. **Use strong passwords for personal data**
   - Database is on your computer
   - Still good practice

4. **Backup your database**
   ```bash
   pg_dump -U taskmaster taskmaster_dev > backup.sql
   ```

5. **Learn PostgreSQL commands**
   - Useful for understanding data
   - Check QUICK_REFERENCE section

---

## 📞 Getting Help

### If stuck on installation:
- Read: `SETUP_POSTGRESQL_WINDOWS.md` (detailed installation guide)
- Search: "PostgreSQL Windows installation" online
- Check: PostgreSQL official docs

### If stuck on setup:
- Read: `SETUP_DATABASE_GUIDE.md` (step-by-step guide)
- Check: Troubleshooting section above
- Verify: PostgreSQL is running

### If stuck on connection:
- Check: .env.local has correct credentials
- Verify: PostgreSQL is running
- Test: `psql -U taskmaster -d taskmaster_dev`
- Restart: Application and PostgreSQL service

---

## 🎓 Learning Resources

- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **SQL Basics:** https://www.w3schools.com/sql

---

## ⏱️ Time Estimate

- Installation: 15 minutes
- Database setup: 10 minutes
- Application restart: 5 minutes
- Verification: 5 minutes
- **Total: 35 minutes**

---

## 🎉 You're Ready!

Everything is prepared. Now you just need to:

1. **Install PostgreSQL** (follow the guide)
2. **Create the database** (copy-paste commands)
3. **Start using it!**

Your TaskMaster application will now:
- ✅ Store data in PostgreSQL
- ✅ Keep data across shutdowns
- ✅ Support multiple users
- ✅ Be production-ready

---

## 📝 Files to Reference

**For quick setup:**
- `QUICK_DATABASE_SETUP.txt` - Commands only

**For detailed help:**
- `SETUP_DATABASE_GUIDE.md` - Full walkthrough
- `SETUP_POSTGRESQL_WINDOWS.md` - Installation details

**For troubleshooting:**
- Check section above first
- Then read relevant guide
- Then search online

---

## 🚀 Ready to Begin?

**Start with:** `QUICK_DATABASE_SETUP.txt`

It has all commands you need, copy-paste style.

Estimated time: **35 minutes from now, you'll have a PostgreSQL database running!**

Good luck! You've got this! 💪

---

**Questions?** Each guide file has detailed troubleshooting sections.

**After setup is done?** Let me know and I can help with:
- Verifying everything works
- Creating API client for frontend
- Setting up payment system
- Deploying to production

**You're building something great!** 🎉
