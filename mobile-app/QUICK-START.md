# 🚀 Quick Start Guide - Mobile App

## Step 1: Start the Expo Server

You have **3 ways** to start the server:

### **Option A: Double-click the batch file** (Easiest)
1. Navigate to the `mobile-app` folder
2. **Double-click** `start-expo.bat`
3. A terminal window will open
4. Wait 30-60 seconds for the **QR code** to appear
5. **Keep this window open!**

### **Option B: Use Command Prompt**
1. Open **Command Prompt** (cmd)
2. Navigate to mobile-app:
   ```cmd
   cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai\mobile-app"
   ```
3. Run:
   ```cmd
   npm start
   ```
4. Wait for the QR code to appear

### **Option C: Use VS Code Terminal**
1. Open the project in VS Code
2. Open Terminal (Ctrl + `)
3. Run:
   ```bash
   cd mobile-app
   npm start
   ```
4. Wait for the QR code to appear

---

## Step 2: Connect Your Phone

### **Before You Start:**
- ✅ Install **Expo Go** app on your phone (App Store or Play Store)
- ✅ Make sure phone and computer are on the **SAME Wi-Fi network**
- ✅ **Allow Node.js through Windows Firewall** (see TROUBLESHOOTING.md)

### **Method 1: Scan QR Code** (Recommended)
1. When Expo finishes starting, you'll see a **QR code** in the terminal
2. Open **Expo Go** app on your phone
3. Tap **"Scan QR code"**
4. Point camera at the QR code in your terminal
5. Wait 30-60 seconds for app to load (first time is slow)

### **Method 2: Manual URL**
If QR code doesn't work:
1. Look at the terminal output for something like:
   ```
   › Metro waiting on exp://192.168.1.4:8081
   ```
2. Open **Expo Go** app
3. Tap **"Enter URL manually"**
4. Type the URL exactly: **`exp://192.168.1.4:8081`**
5. Tap **"Connect"**

---

## Step 3: Test the App

Once the app loads on your phone:

1. **You'll see the Login screen**
   - If you don't have an account, tap "Sign Up"
   - Create a new account

2. **After login, you'll see the Dashboard**
   - Eisenhower Matrix with 4 quadrants
   - Pull down to refresh

3. **Try the navigation**
   - Bottom tabs: Dashboard, Tasks, Projects, Profile

---

## 📍 What You Should See

### **In Your Terminal:**
```
Starting project at C:\Users\charl\...\mobile-app
Starting Metro Bundler

› Metro waiting on exp://192.168.1.4:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

[QR CODE APPEARS HERE]

› Press s │ switch to Expo Go
› Press a │ open Android
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to stop the server.
```

### **On Your Phone:**
- Login screen with TaskQuadrant logo
- Email and password fields
- Sign In / Sign Up buttons

---

## ⚠️ Common Issues

### **No QR Code Appears**
The terminal might still be building. Look for:
- "Starting Metro Bundler" - wait 30-60 seconds
- "Metro waiting on..." - QR should be above this

If it says "Port is already in use":
- Close any running Expo servers (Ctrl+C)
- Close your Next.js dev server temporarily
- Try again

### **"Request Timed Out" Error**
This is usually **Windows Firewall**. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for the fix.

Most common solution:
1. Search for "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Find "Node.js" and check BOTH Private and Public
4. Click OK and try again

### **"Cannot Connect to API"**
1. Check that `src/api/client.ts` has your correct IP address
2. Make sure your Next.js backend is running on port 3000
3. Test in browser: `http://192.168.1.4:3000/api/auth/me`

---

## 🎯 Quick Checklist

Before testing, verify:
- [ ] Expo Go app installed on phone
- [ ] Phone and computer on same WiFi
- [ ] Windows Firewall allows Node.js
- [ ] IP address correct in `src/api/client.ts` (192.168.1.4)
- [ ] Next.js backend running (`npm run dev` in main folder)
- [ ] Started Expo with `start-expo.bat` or `npm start`
- [ ] Can see QR code in terminal

---

## 🆘 Need Help?

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions
2. Make sure you completed the firewall setup (most common issue!)
3. Try tunnel mode: `npx expo start --tunnel` (slower but bypasses network issues)

---

**That's it! You should now see the app running on your phone!** 📱✨
