# Mobile App Deployment Guide

Complete guide for deploying TaskQuadrant mobile app to iPhone users.

## 📱 Deployment Options Overview

| Option | Cost | Time | Approval | Best For |
|--------|------|------|----------|----------|
| **Expo Go** (Current) | Free | Instant | None | Development/Testing |
| **Development Build** | Free | 30 min | None | Internal team/Beta users |
| **TestFlight** | $99/year | 1-2 days | Apple review | Beta testing (100 users) |
| **App Store** | $99/year | 1-2 weeks | Apple review | Public release |
| **Enterprise** | $299/year | 1 week | None | Companies (500+ employees) |

## 🚀 Option 1: Development Build (Recommended for Testing)

**Best for:** Internal testing, beta users, custom branding without App Store

### What You Get
- ✅ Your own app icon and name
- ✅ No Expo Go required
- ✅ Install via link or QR code
- ✅ Push notifications work fully
- ✅ No App Store approval needed
- ✅ Free (Expo account required)
- ❌ Max 100 devices
- ❌ Manual distribution

### Prerequisites
1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Required for iOS builds (even development builds)

2. **Expo Account** (Free)
   - Sign up at: https://expo.dev/signup

### Step-by-Step Process

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
```

#### 3. Configure Your App

Update `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "TaskQuadrant",
    "slug": "taskquadrant",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.taskquadrant",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.taskquadrant",
      "versionCode": 1
    }
  }
}
```

**Important:** Change `com.yourcompany.taskquadrant` to your own unique identifier (e.g., `com.johnsmith.taskquadrant`)

#### 4. Create App Icons

You need icons in these sizes for iOS:

| Size | File | Purpose |
|------|------|---------|
| 1024x1024 | icon.png | App Store |
| 180x180 | icon@3x.png | iPhone |
| 120x120 | icon@2x.png | iPhone |
| 167x167 | icon-ipad-pro.png | iPad Pro |

**Quick Icon Generation:**
1. Create one 1024x1024 PNG with your logo
2. Use: https://easyappicon.com/ or https://appicon.co/
3. Save all sizes to `mobile-app/assets/`

#### 5. Initialize EAS
```bash
cd mobile-app
eas build:configure
```

#### 6. Create Development Build
```bash
# For iOS (iPhone)
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android

# For both
eas build --profile development --platform all
```

This will:
- Upload your code to Expo servers
- Build the app in the cloud
- Generate an installable file
- Takes 15-30 minutes

#### 7. Install on iPhone

**Method A: Install via Link**
1. When build completes, you'll get a link
2. Open link on iPhone
3. Tap "Install"
4. Go to Settings > General > VPN & Device Management
5. Trust the developer certificate
6. App appears on home screen

**Method B: QR Code**
```bash
eas build:list
```
Scan the QR code with iPhone camera

### Update API URL

Before building, update `mobile-app/src/api/client.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000/api'  // Local dev
  : 'https://your-production-domain.com/api';  // ⬅️ Change this!
```

---

## 🍎 Option 2: Apple App Store (Public Release)

**Best for:** General public, maximum reach, professional launch

### What You Get
- ✅ Available to anyone with an iPhone
- ✅ App Store credibility
- ✅ Automatic updates
- ✅ App Store search/discovery
- ✅ Professional presence
- ⏱️ 1-2 week review process
- 💰 $99/year Apple Developer account

### Prerequisites
Same as Development Build, plus:
- App screenshots (various iPhone sizes)
- App description and keywords
- Privacy policy URL
- Support URL
- Promotional materials

### Step-by-Step Process

#### 1. Complete Development Build steps (above)

#### 2. Create Production Build
```bash
cd mobile-app
eas build --profile production --platform ios
```

#### 3. Prepare App Store Materials

**Required Screenshots:**
- iPhone 6.7" (iPhone 15 Pro Max): 1290 x 2796 pixels
- iPhone 6.5" (iPhone 14 Plus): 1284 x 2778 pixels
- iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 pixels

Take screenshots showing:
1. Login/Dashboard
2. Task list
3. Create task
4. Gantt chart
5. Offline mode

**Required Text:**
- App name: "TaskQuadrant" (or your choice)
- Subtitle: "Eisenhower Matrix Task Manager"
- Description: (see template below)
- Keywords: "tasks, productivity, eisenhower, gtd, project management"
- Privacy Policy: Required (see template below)
- Support URL: Your website or email

#### 4. Create App Store Connect Listing

1. Go to https://appstoreconnect.apple.com/
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: TaskQuadrant
   - Primary Language: English
   - Bundle ID: (select your bundle identifier)
   - SKU: taskquadrant-001
4. Upload screenshots and metadata
5. Upload build from EAS

#### 5. Submit for Review
```bash
eas submit --platform ios
```

Or manually:
1. In App Store Connect, select your app
2. Go to "TestFlight" or "App Store"
3. Select the build
4. Click "Submit for Review"

#### 6. Wait for Approval
- Initial review: 1-2 weeks
- Updates: 1-3 days
- Check status at: https://appstoreconnect.apple.com/

### App Description Template

```
TaskQuadrant - Master Your Tasks with the Eisenhower Matrix

Organize your life using the proven Eisenhower Matrix methodology. Separate urgent from important and focus on what truly matters.

KEY FEATURES:
• Eisenhower Matrix dashboard (4 quadrants)
• Offline mode - work anywhere
• Projects with sub-projects
• Gantt chart visualization
• Recurring tasks
• Due date reminders
• Progress tracking
• Mobile and web sync

WORKS OFFLINE:
Create, edit, and view tasks even without internet. Changes sync automatically when you're back online.

PERFECT FOR:
✓ Busy professionals
✓ Project managers
✓ Students
✓ Anyone seeking better productivity

Free to use with optional premium features.

Questions? Contact support@yourdomain.com
```

### Privacy Policy Template

You need a privacy policy URL. Simple template:

```
Privacy Policy for TaskQuadrant

Data We Collect:
- Email address and password (for account creation)
- Tasks and projects you create
- Usage analytics (anonymous)

How We Use Data:
- Provide and improve the service
- Sync data across your devices
- Send task notifications

Data Storage:
- Stored securely on our servers
- Encrypted in transit (HTTPS)
- Backed up regularly

Your Rights:
- Export your data anytime
- Delete your account anytime
- Contact us: support@yourdomain.com

Last updated: [Date]
```

Host this at: https://yourdomain.com/privacy

---

## 🧪 Option 3: TestFlight (Beta Testing)

**Best for:** Beta testing with real users before App Store release

### What You Get
- ✅ Up to 10,000 testers
- ✅ Automatic updates
- ✅ Feedback collection
- ✅ Crash reports
- ✅ No App Store approval (for internal)
- ⏱️ External testers require Apple review

### Process

#### 1. Create Production Build
```bash
eas build --profile production --platform ios
```

#### 2. Upload to TestFlight
```bash
eas submit --platform ios
```

#### 3. Add Testers in App Store Connect
1. Go to TestFlight tab
2. Click "Add Testers"
3. Enter email addresses
4. They receive install link via email

#### 4. Collect Feedback
- Testers can send feedback via TestFlight app
- View crash reports in App Store Connect
- Iterate and release updates

---

## 📦 App Icon Design Tips

### Design Guidelines
1. **Keep it simple** - Works at small sizes (60x60px)
2. **No text** - Icon should be recognizable without words
3. **Distinctive** - Stands out on home screen
4. **Brand colors** - Use your TaskQuadrant colors
5. **No transparency** - iOS requires opaque backgrounds

### Recommended Tools
- **Figma** (Free): https://figma.com
- **Canva** (Free): https://canva.com
- **Icon generators**:
  - https://appicon.co/
  - https://easyappicon.com/
  - https://makeappicon.com/

### TaskQuadrant Icon Ideas
1. **Quadrant Grid** - 2x2 grid representing Eisenhower Matrix
2. **Checkmark + Grid** - Combines task completion with quadrants
3. **TQ Letters** - Stylized "TQ" monogram
4. **Matrix** - Abstract representation of the 4 quadrants

---

## 💰 Cost Breakdown

### Development Build (Internal Use)
- Expo account: **Free**
- Apple Developer: **$99/year** (required for iOS)
- **Total: $99/year**

### App Store Release
- Expo account: **Free**
- Apple Developer: **$99/year**
- Optional: App icon design ($0-100)
- Optional: Privacy policy page ($0-50)
- **Total: $99-249/year**

### Android (Google Play)
- Google Play Console: **$25 one-time**
- (Much cheaper than Apple!)

---

## ⚡ Quick Start Commands

### Install Tools
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
cd mobile-app
eas build:configure
```

### Create Builds
```bash
# Development build (for testing)
eas build --profile development --platform ios

# Production build (for App Store)
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

### Monitor Builds
```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]
```

---

## 🔧 Troubleshooting

### "Apple Developer account required"
- You must enroll in Apple Developer Program ($99/year)
- Visit: https://developer.apple.com/programs/

### "Bundle identifier already in use"
- Change in `app.json`: `ios.bundleIdentifier`
- Must be unique (e.g., `com.yourname.taskquadrant`)

### "Build failed"
- Check build logs: `eas build:view [build-id]`
- Common issues:
  - Missing credentials
  - Invalid app.json
  - Native code errors

### "Can't install on iPhone"
- Trust certificate: Settings > General > VPN & Device Management
- Check device is registered in Apple Developer portal
- Verify bundle identifier matches

### "App Store rejection"
- Read rejection reason carefully
- Common issues:
  - Missing privacy policy
  - Incomplete metadata
  - Bugs or crashes
  - Missing required features
- Fix issues and resubmit

---

## 📊 Comparison: Native App vs PWA

You already have a PWA! Consider if you need a native app:

| Feature | Native App | PWA (Current) |
|---------|-----------|---------------|
| **Installation** | App Store | Add to Home Screen |
| **Cost** | $99/year | Free |
| **Approval** | 1-2 weeks | None |
| **Updates** | Slower | Instant |
| **Offline** | ✅ Full | ✅ Full |
| **Push Notifications** | ✅ Full | ⚠️ Limited on iOS |
| **Performance** | Faster | Very Good |
| **Discoverability** | App Store | Web/SEO |
| **Credibility** | High | Medium |

**Recommendation:**
- Start with **Development Build** for testing
- Use **PWA** for public users initially (it's free!)
- Launch **App Store** when you have active users

---

## 📝 Checklist for App Store Launch

### Pre-Launch
- [ ] Apple Developer account ($99/year)
- [ ] Expo account (free)
- [ ] EAS CLI installed
- [ ] App icons designed (1024x1024)
- [ ] Screenshots taken (all sizes)
- [ ] Privacy policy page created
- [ ] Support email/URL ready
- [ ] Production API URL configured
- [ ] App tested on real iPhone

### Build & Submit
- [ ] Update version in app.json
- [ ] Create production build
- [ ] Test build on device
- [ ] Upload to App Store Connect
- [ ] Fill in metadata
- [ ] Upload screenshots
- [ ] Submit for review

### Post-Launch
- [ ] Monitor reviews
- [ ] Respond to feedback
- [ ] Plan updates
- [ ] Track analytics
- [ ] Marketing/promotion

---

## 🎯 Recommended Path

For you, I recommend this approach:

### Phase 1: Internal Testing (Week 1)
```bash
# Create development build
eas build --profile development --platform ios

# Install on your iPhone
# Test all features thoroughly
```

### Phase 2: Beta Testing (Week 2-3)
```bash
# Create production build
eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios

# Invite 10-20 beta testers
# Gather feedback
# Fix bugs
```

### Phase 3: App Store (Week 4)
```bash
# Final production build
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios

# Wait for approval (7-14 days)
# Launch! 🎉
```

---

## 📚 Resources

### Official Documentation
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [App Store Connect](https://developer.apple.com/app-store-connect/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [TestFlight Guide](https://developer.apple.com/testflight/)

### Tools
- [App Icon Generator](https://appicon.co/)
- [Screenshot Maker](https://www.appstorescreenshot.com/)
- [App Preview](https://www.apple.com/app-store/app-previews/)

### Communities
- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)
- [Reddit r/ExpoJS](https://reddit.com/r/ExpoJS/)

---

## ✉️ Need Help?

- **Expo Support**: https://expo.dev/support
- **Apple Developer Support**: https://developer.apple.com/support/
- **Build Issues**: Check build logs with `eas build:view [build-id]`

---

**Ready to deploy?** Let me know which option you want to pursue and I can help you through each step!
