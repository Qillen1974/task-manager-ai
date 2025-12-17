# 🔧 Mobile App Troubleshooting Guide

## Common Issues and Solutions

### ❌ Error: "Request Timed Out" or "Unknown Error" when scanning QR

This is usually caused by network or firewall issues. Try these solutions:

#### Solution 1: Check Network Connection (Most Common)
1. **Verify both devices are on the same Wi-Fi network**
   - Your phone AND computer must be on the SAME Wi-Fi
   - Don't use mobile data on your phone
   - Corporate/school WiFi may block device-to-device communication

2. **Find your computer's IP address:**
   - Open Command Prompt (Windows) or Terminal (Mac)
   - Run: `ipconfig` (Windows) or `ifconfig` (Mac)
   - Look for "IPv4 Address" (e.g., 192.168.1.4)
   - Make sure this matches the IP in the QR code/URL

#### Solution 2: Windows Firewall
**Windows is likely blocking the connection. Follow these steps:**

1. **Allow Node.js through firewall:**
   - Open "Windows Defender Firewall"
   - Click "Allow an app through firewall"
   - Click "Change settings" (needs admin)
   - Find "Node.js" or click "Allow another app"
   - Browse to: `C:\Program Files\nodejs\node.exe`
   - Check BOTH "Private" and "Public" boxes
   - Click OK

2. **Or temporarily disable firewall for testing:**
   - **⚠️ Only for testing, re-enable after!**
   - Open Windows Defender Firewall
   - Click "Turn Windows Defender Firewall on or off"
   - Select "Turn off" for Private networks
   - Try connecting again
   - **Remember to turn it back on!**

#### Solution 3: Use Expo Tunnel (Bypasses Local Network)
If firewall/network issues persist, use tunnel mode:

```bash
cd mobile-app
npx expo start --tunnel
```

**Note:** Tunnel is slower but works around network restrictions. You'll need an Expo account (free).

#### Solution 4: Enter URL Manually
Instead of scanning QR:
1. Look at your terminal for the connection URL
2. In Expo Go app, tap "Enter URL manually"
3. Type: `exp://192.168.1.4:8081` (use YOUR computer's IP)
4. Tap "Connect"

#### Solution 5: Restart Everything
Sometimes a clean restart fixes everything:

1. **Close Expo Go app** completely on your phone
2. **Stop Expo server:**
   ```bash
   # Press Ctrl+C in the terminal where Expo is running
   ```
3. **Clear Metro cache and restart:**
   ```bash
   cd mobile-app
   npx expo start --clear
   ```
4. **Reopen Expo Go** and scan the NEW QR code

---

### ❌ Error: "Port 8081 is already in use"

**Cause:** Another process (often your Next.js backend) is using the port.

**Solutions:**

1. **Stop the other process:**
   - Close your Next.js development server temporarily
   - Or kill the process:
     ```bash
     # Windows
     netstat -ano | findstr :8081
     taskkill //PID <PID_NUMBER> //F

     # Mac/Linux
     lsof -ti:8081 | xargs kill -9
     ```

2. **Use a different port for Expo:**
   ```bash
   npx expo start --port 8082
   ```
   Then connect to: `exp://YOUR_IP:8082`

---

### ❌ Error: "Unable to resolve module..."

**Cause:** Missing dependencies or cache issues.

**Solution:**
```bash
cd mobile-app
rm -rf node_modules
npm install
npx expo start --clear
```

---

### ❌ Error: "Cannot connect to API" or "Network Error"

**Cause:** API URL is incorrect or backend isn't running.

**Solutions:**

1. **Verify API URL in `src/api/client.ts`:**
   ```typescript
   export const API_BASE_URL = __DEV__
     ? 'http://192.168.1.4:3000/api'  // ⬅️ Must be YOUR computer's IP
     : 'https://your-production-url.com/api';
   ```

2. **Make sure your Next.js backend is running:**
   ```bash
   # In the main project directory (not mobile-app)
   npm run dev
   ```
   Backend should be on `http://localhost:3000`

3. **Test API manually:**
   - Open browser on your phone
   - Go to: `http://192.168.1.4:3000/api/auth/me` (use YOUR IP)
   - If you see "Unauthorized", API is working!
   - If timeout/error, check firewall or network

---

### ❌ Login/Register Not Working

1. **Check API URL** (see above)
2. **Check backend logs** for errors
3. **Try registering first** - you need an account
4. **Clear app data:**
   - Close Expo Go
   - Clear app data/cache
   - Reopen and try again

---

### ❌ App Crashes on Launch

1. **Clear cache:**
   ```bash
   npx expo start --clear
   ```

2. **Check for TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## ✅ How to Tell if It's Working

When Expo starts successfully, you should see:

```
› Metro waiting on exp://192.168.1.4:8081
› Scan the QR code above with Expo Go
```

And a QR code will appear in your terminal.

---

## 🆘 Still Having Issues?

### Quick Checklist:
- [ ] Phone and computer on same WiFi?
- [ ] Windows Firewall allows Node.js?
- [ ] Correct IP address in API client?
- [ ] Next.js backend running on port 3000?
- [ ] Used `npx expo start --clear`?
- [ ] Tried entering URL manually in Expo Go?

### Get More Help:
1. Check Expo Go app version (update if old)
2. Check Node.js version: `node --version` (should be 18+)
3. Try tunnel mode: `npx expo start --tunnel`
4. Check Expo documentation: https://docs.expo.dev/

---

## 📝 Working Configuration Example

**Computer IP:** `192.168.1.4`
**Expo URL:** `exp://192.168.1.4:8081`
**API URL:** `http://192.168.1.4:3000/api`

Replace `192.168.1.4` with YOUR computer's actual IP address!
