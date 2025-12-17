# 🔧 Backend Setup for Mobile App

## ⚠️ IMPORTANT: The Mobile App Needs the Backend Running!

The mobile app **cannot work** without the Next.js backend server running. Here's why:

- The mobile app is just a **frontend** (UI)
- All data (users, tasks, projects) is stored in the **backend database**
- Login, registration, and all API calls go to the **backend server**

---

## ✅ Starting the Backend Server

### **Option 1: Command Prompt / PowerShell**
1. Open a **new** terminal window (separate from Expo)
2. Run:
   ```cmd
   cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai"
   npm run dev
   ```
3. Wait for: `✓ Ready in X.Xs`
4. **Keep this window open!**

### **Option 2: Create a Batch File**
Create `start-backend.bat` in the main project folder:
```batch
@echo off
cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai"
npm run dev
pause
```

Double-click it to start the backend.

---

## 🔍 How to Tell if Backend is Running

You should see:
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
✓ Ready in X.Xs
```

**Test it in your browser:**
1. Open browser
2. Go to: `http://localhost:3000`
3. You should see the TaskQuadrant landing page

---

## 📱 Testing Mobile Connection

### **Test API from Your Phone's Browser:**
1. Open Safari/Chrome on your iPhone
2. Go to: `http://192.168.1.4:3000/api/auth/me`
3. Expected result: `{"message":"Unauthorized"}` (this is good!)
4. If you see **timeout or cannot connect**, check:
   - ✅ Backend is running (`npm run dev`)
   - ✅ Windows Firewall allows Node.js
   - ✅ Both devices on same WiFi
   - ✅ Correct IP address (192.168.1.4)

---

## ⚙️ Running Both Servers Together

You need **TWO terminal windows** open:

### **Terminal 1: Backend Server**
```cmd
cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai"
npm run dev
```
**Runs on:** `http://localhost:3000` (backend API)

### **Terminal 2: Expo Mobile Server**
```cmd
cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai\mobile-app"
npm start
```
**Runs on:** `http://localhost:8081` (mobile dev server)

**Both must stay running!**

---

## 🐛 Common Issues

### **"Registration Failed" with password requirements**
**Cause:** Password doesn't meet backend security requirements.

**Requirements:** Password must:
- Be at least 8 characters long
- Contain at least one uppercase letter (A-Z)
- Contain at least one special character (!@#$%^&*)

**Example valid password:** `MyPass123!`

**Solution:**
The app will now show you exactly which requirement is missing. Make sure your password meets all three requirements.

### **"Registration Failed" with no details**
**Cause:** Backend not running or not reachable.

**Solution:**
1. Check backend terminal - is it running?
2. Test in phone browser: `http://192.168.1.4:3000`
3. Check Expo logs for detailed error (it will now show!)

### **"Port 3000 is already in use"**
**Cause:** Backend already running elsewhere.

**Solution:**
```cmd
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with the number from above)
taskkill //PID <PID> //F

# Then start backend again
npm run dev
```

### **"Network Error" in mobile app**
**Cause:**
- Backend not running
- Firewall blocking
- Wrong IP address

**Solution:**
1. Start backend: `npm run dev`
2. Allow Node.js in Windows Firewall
3. Verify IP in `mobile-app/src/api/client.ts` matches your computer

---

## 🎯 Quick Checklist

Before testing the mobile app:
- [ ] Backend running (`npm run dev` in main folder)
- [ ] Can access `http://localhost:3000` in browser
- [ ] Can access `http://192.168.1.4:3000` from phone browser
- [ ] Expo running (`npm start` in mobile-app folder)
- [ ] Mobile app loaded in Expo Go

---

## 🆘 Still Having Issues?

### Check Backend Logs
When you try to register/login, watch the backend terminal for errors:
```
POST /api/auth/register 200 in 123ms
POST /api/auth/login 401 in 45ms
```

If you see **nothing** when you try to register, the request isn't reaching the backend!

### Check Mobile App Logs
The mobile app now has **detailed error logging**. Check:
1. Expo terminal for `console.error` messages
2. Error messages will now show:
   - Network errors vs server errors
   - Timeout issues
   - Exact URL being called

---

**Remember: The mobile app is useless without the backend running!** 🚀
