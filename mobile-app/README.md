# TaskQuadrant Mobile App

A React Native mobile application for TaskQuadrant built with Expo. Manage your tasks on the go with the Eisenhower Matrix methodology.

## 🚀 Features

### ✅ Implemented (MVP)
- **Authentication** - Login and registration with secure token storage
- **Eisenhower Matrix Dashboard** - View tasks organized by priority (4 quadrants)
- **Offline-ready Architecture** - API client and state management setup for offline mode
- **Pull-to-refresh** - Refresh tasks and projects data
- **Secure Storage** - JWT tokens stored securely using Expo SecureStore

### 🚧 Coming Soon
- Task List view with filters
- Task creation and editing
- Project management
- Offline mode with sync queue
- Push notifications for urgent tasks
- Voice input for quick task creation

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn
- Expo Go app on your iOS or Android device (for testing)
- **For iOS testing**: iPhone with Expo Go installed
- **For Android testing**: Android phone with Expo Go installed

## 🛠️ Setup Instructions

### 1. Navigate to the mobile app directory

```bash
cd mobile-app
```

### 2. Install dependencies (if not already done)

```bash
npm install
```

### 3. Configure API Base URL

**IMPORTANT**: Update the API URL in `src/api/client.ts`

Open `src/api/client.ts` and change the `API_BASE_URL`:

```typescript
// For local development, use your computer's IP address (NOT localhost)
// Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000/api'  // ⬅️ Change this to YOUR IP address
  : 'https://your-production-url.com/api';  // ⬅️ Change for production
```

**How to find your IP address:**
- **Windows**: Open CMD and run `ipconfig`, look for "IPv4 Address"
- **Mac/Linux**: Open Terminal and run `ifconfig`, look for "inet"
- **Example**: If your IP is `192.168.1.50`, use `http://192.168.1.50:3000/api`

### 4. Make sure your Next.js backend is running

The mobile app connects to your existing TaskQuadrant API. Make sure it's running:

```bash
# In the main project directory (not mobile-app)
cd ..
npm run dev
```

The backend should be running on `http://localhost:3000`

### 5. Start the Expo development server

```bash
npm start
```

### 6. Test on your device

1. **Install Expo Go** on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scan the QR code**:
   - iOS: Open Camera app and scan the QR code
   - Android: Open Expo Go app and scan the QR code

3. **Make sure both devices are on the same Wi-Fi network**

## 📱 Testing the App

### First-time users:
1. Tap "Sign Up" on the login screen
2. Enter your email, password, and optional name
3. Tap "Sign Up" button
4. You'll be automatically logged in

### Existing users:
1. Enter your email and password
2. Tap "Sign In"
3. You'll see the Eisenhower Matrix dashboard

### Testing the Dashboard:
1. Pull down to refresh tasks and projects
2. View tasks organized by priority in 4 quadrants:
   - 🔴 **Do First** - Urgent & Important
   - 🔵 **Schedule** - Not Urgent & Important
   - 🟡 **Delegate** - Urgent & Not Important
   - ⚪ **Eliminate** - Not Urgent & Not Important

## 🗂️ Project Structure

```
mobile-app/
├── src/
│   ├── api/              # API client for backend communication
│   │   └── client.ts     # Axios setup with interceptors
│   ├── components/       # Reusable components (coming soon)
│   ├── constants/        # App constants (colors, etc.)
│   │   └── colors.ts     # Color palette and helpers
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx  # Main navigation structure
│   ├── screens/          # App screens
│   │   ├── auth/         # Login & Register
│   │   ├── dashboard/    # Eisenhower Matrix
│   │   ├── tasks/        # Task list and details
│   │   ├── projects/     # Projects view
│   │   └── profile/      # User profile
│   ├── store/            # State management (Zustand)
│   │   └── authStore.ts  # Authentication state
│   ├── types/            # TypeScript types (shared with web)
│   │   └── index.ts      # Task, Project, User types
│   └── utils/            # Utility functions (coming soon)
├── App.tsx               # Root component
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🔧 Development

### Common Commands

```bash
# Start development server
npm start

# Start with cleared cache
npm start --clear

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Debugging

- **View logs**: Logs appear in the terminal where you ran `npm start`
- **React Developer Tools**: Shake device → "Debug Remote JS"
- **Inspect Network**: Use React Native Debugger or Expo Dev Tools

## 🐛 Troubleshooting

### "Cannot connect to API"
- Verify your computer's IP address in `src/api/client.ts`
- Make sure Next.js backend is running (`npm run dev` in main project)
- Check that both devices are on the same Wi-Fi network
- Try disabling firewall temporarily

### "Login failed"
- Ensure you have an account (use Sign Up first)
- Check that the email/password are correct
- Verify backend is running and accessible

### "App crashes on start"
- Clear Expo cache: `npm start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Close and reopen Expo Go app

### "Tasks not loading"
- Pull down to refresh
- Check backend logs for errors
- Verify you have tasks created in the web app

## 🚀 Building for Production

### Prerequisites for Production Builds

1. **Create Expo account**: https://expo.dev/signup
2. **Install EAS CLI**: `npm install -g eas-cli`
3. **Login to Expo**: `eas login`

### Configure for App Stores

1. **Update app.json**:
   - Change `name`, `slug`, `bundleIdentifier` (iOS), `package` (Android)
   - Add app icons and splash screen

2. **Update API URL** in `src/api/client.ts`:
   ```typescript
   export const API_BASE_URL = 'https://your-production-api.com/api';
   ```

### Build Commands

```bash
# Build for iOS (requires Apple Developer account - $99/year)
eas build --platform ios

# Build for Android (Google Play requires $25 one-time fee)
eas build --platform android

# Build for both platforms
eas build --platform all
```

### Submit to App Stores

```bash
# Submit to Apple App Store
eas submit --platform ios

# Submit to Google Play Store
eas submit --platform android
```

## 📊 Next Steps

### Phase 1 (Current)
- [x] Authentication
- [x] Eisenhower Matrix dashboard
- [x] API integration
- [ ] Offline mode with AsyncStorage
- [ ] Push notifications setup

### Phase 2
- [ ] Task creation and editing
- [ ] Task list with filters
- [ ] Project management
- [ ] Voice input for tasks

### Phase 3
- [ ] Subtasks
- [ ] Task dependencies
- [ ] Calendar view
- [ ] Time tracking

## 🔐 Security Notes

- Tokens are stored using Expo SecureStore (encrypted storage)
- API requests use HTTPS in production
- Sensitive data is never logged in production builds
- Automatic token refresh on expiration

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [React Native Documentation](https://reactnative.dev/)

## 💬 Support

If you encounter issues:
1. Check this README's troubleshooting section
2. Review the main project's documentation
3. Check Expo documentation for platform-specific issues

## 📝 License

Same as the main TaskQuadrant project.

---

**Happy Task Managing on Mobile! 📱🚀**
