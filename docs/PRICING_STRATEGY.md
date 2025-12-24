# TaskQuadrant Pricing Strategy

*Last Updated: December 24, 2024*

## Overview

TaskQuadrant uses a hybrid pricing model:
- **Mobile App**: One-time purchase unlock
- **Web App**: Monthly subscription tiers (FREE / PRO / ENTERPRISE)

---

## Mobile App Pricing

### Philosophy
- Mobile app is a **companion app** (lite version of web)
- One-time payment preferred over subscription for mobile users
- Focus on quick task capture, viewing quadrants, and checking what's due

### Pricing Tiers

| Feature | Free | Unlocked ($4.99 USD) |
|---------|------|----------------------|
| Projects | 3 | Unlimited |
| Active Tasks | 15 | Unlimited |
| Recurring Tasks | No | Yes |
| View All Quadrants | Yes | Yes |
| AI Butler Queries | 5/day | 20/day |
| Sync with Web | Yes | Yes |

### Revenue
- Apple/Google take 30% commission
- Net revenue per sale: ~$3.49 USD

### Implementation Requirements
1. Create in-app purchase product in App Store Connect (non-consumable, $4.99)
2. Implement purchase flow using `expo-in-app-purchases` or `react-native-iap`
3. Add "Restore Purchases" functionality (required by Apple)
4. Server-side receipt validation
5. UI prompts when users hit free tier limits

---

## Web App Pricing

### Current Tiers

| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Projects | Limited | Unlimited | Unlimited |
| Tasks | Limited | Unlimited | Unlimited |
| Team Members | 1 | Up to 10 | Unlimited |
| Recurring Tasks | No | Yes | Yes |
| AI Features | Basic | Full | Full |
| Gantt Charts | Basic | Full | Full |
| Project Scheduling | No | Yes | Yes |
| Team Management | No | No | Yes |
| Priority Support | No | No | Yes |
| Completed Task Retention | 90 days | 365 days | 365 days |

---

## Platform Differentiation

### Mobile App Features (Companion)
- View tasks and quadrants
- Create/edit projects and tasks
- Complete tasks
- Receive notifications
- AI Butler (limited queries)
- Basic recurring tasks (paid)

### Web-Only Features (Full Experience)
- Team/Enterprise collaboration
- Project scheduling & Gantt charts
- Advanced AI features
- Calendar integrations
- Detailed analytics
- Admin & team management
- Full recurring task configuration

---

## Key Principles

1. **Sync is critical** - Mobile must sync seamlessly with web data
2. **Don't cripple viewing** - Free mobile users can VIEW all tasks created on web (even with PRO subscription), only limit CREATION on mobile
3. **Clear upgrade paths** - Users understand mobile unlock vs web subscription
4. **Value at every tier** - Free tier must be useful enough to demonstrate value

---

## Beta Testing Strategy

### Beta Phase
- **All limits removed** during beta testing
- Beta testers get full access to test all features
- Collect feedback on premium features before launch

### Beta Tester Rewards
- All beta participants receive **free unlock** after beta ends
- Implementation options:
  1. **Promo Codes**: Generate App Store promo codes for each beta tester
  2. **Database Flag**: Mark beta tester accounts as "unlocked" permanently
  3. **Redemption Code**: In-app code entry that grants unlock

### Tracking Beta Testers
- **Automatic tracking implemented**: Users are auto-marked as beta testers on first login
- Database fields added: `isBetaTester`, `betaJoinedAt`, `mobileUnlocked`
- TestFlight also tracks who installed during beta as backup

### Timeline
1. Beta phase: ~1 month
2. Collect feedback and fix issues
3. End beta, export tester list
4. Push production release with limits
5. Grant free unlock to all beta testers
6. Public launch on App Store

---

## Future Considerations

- [ ] Family/Team mobile unlock pricing?
- [ ] Annual web subscription discount?
- [ ] Bundle: Mobile + Web PRO discount?
- [ ] Regional pricing for different markets?
- [ ] Student/Education discounts?

---

---

## Implementation Details (Completed)

### Database Schema Changes
Added to `User` model in `prisma/schema.prisma`:
```prisma
isBetaTester    Boolean   @default(false)   // True if user participated in beta testing
betaJoinedAt    DateTime?                   // When user joined beta program
mobileUnlocked  Boolean   @default(false)   // True if user purchased mobile unlock ($4.99)
```

### Environment Variable
```bash
# In Railway/Vercel environment variables:
MOBILE_BETA_MODE=true   # Set to enable beta testing
```

### API Endpoint
`GET /api/mobile/subscription` - Returns mobile-specific limits and unlock status
`POST /api/mobile/subscription` - Auto-marks user as beta tester (called during login)

### Mobile App Changes
- `src/types/index.ts` - Added `MobileSubscription` and `MobileLimits` types
- `src/api/client.ts` - Added `getMobileSubscription()` and `markAsBetaTester()` methods
- `src/store/authStore.ts` - Auto-fetches mobile subscription on login/register, auto-marks beta testers

### How to Enable Beta Mode
1. Go to Railway dashboard
2. Add environment variable: `MOBILE_BETA_MODE=true`
3. Redeploy the app
4. All mobile users will now have unlimited access and be tracked as beta testers

### How to End Beta and Grant Rewards
1. Set `MOBILE_BETA_MODE=false` in Railway
2. All users with `isBetaTester=true` already have full access recorded
3. Run a database query to set `mobileUnlocked=true` for all beta testers:
   ```sql
   UPDATE "User" SET "mobileUnlocked" = true WHERE "isBetaTester" = true;
   ```
4. Redeploy - beta testers keep premium access, new users see free tier limits

---

## References

- App Store Connect: https://appstoreconnect.apple.com/apps/6756943665
- EAS Project: https://expo.dev/accounts/qillen2013/projects/taskquadrant-mobile
