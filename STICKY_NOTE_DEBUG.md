# Debugging Sticky Note Notifications

## Issue
When a sticky note is sent:
- ✅ Sticky note appears for both sender and recipient
- ❌ No in-app notification is created
- ❌ No email is sent

## Recent Changes
Added enhanced logging to track the notification flow. You'll see logs like:
```
[StickyNotes POST] Sending notification to: user_123
[StickyNotes POST] Team found: My Team
[Notification] Starting sticky note notification for: user_123
[Notification] Fetching preferences for recipient: user_123
[Notification] Preferences retrieved: { inAppStickyNotes: true, emailStickyNotes: false }
[Notification] Creating in-app notification
[Notification] Creating notification with payload: { userId: '...', type: 'sticky_note_received', ... }
[Notification] Notification created successfully with ID: notif_xyz
[StickyNotes POST] Notification sent successfully
```

## How to Debug

### Step 1: Check Application Logs
1. Start your development server: `npm run dev`
2. Open the console/terminal where the dev server is running
3. Create a sticky note between two users
4. Look for `[StickyNotes POST]` and `[Notification]` log messages

### Expected Logs When It Works:
```
[StickyNotes POST] Sending notification to: user_456
[StickyNotes POST] Team found: My Team Name
[Notification] Starting sticky note notification for: user_456
[Notification] Fetching preferences for recipient: user_456
[Notification] Preferences retrieved: { inAppStickyNotes: true, emailStickyNotes: false }
[Notification] Creating in-app notification
[Notification] Creating notification with payload: { userId: 'user_456', type: 'sticky_note_received', title: 'Message from John Doe' }
[Notification] Notification created successfully with ID: clx1y2z3a4b5c6d7
[StickyNotes POST] Notification sent successfully
```

### Step 2: Check Database Directly
Check if notifications are being created:

```sql
-- Count all notifications for a specific user
SELECT COUNT(*) FROM "Notification" WHERE "userId" = 'USER_ID_HERE';

-- See recent sticky note notifications
SELECT id, type, title, "userId", "createdAt"
FROM "Notification"
WHERE type = 'sticky_note_received'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check notification preferences
SELECT * FROM "NotificationPreference" WHERE "userId" = 'USER_ID_HERE';
```

### Step 3: API Testing
Test the notifications API directly:

```bash
# Get all notifications for logged-in user
curl -H "Cookie: token=YOUR_TOKEN" http://localhost:3000/api/notifications

# Get unread only
curl -H "Cookie: token=YOUR_TOKEN" "http://localhost:3000/api/notifications?unreadOnly=true"

# Get preferences
curl -H "Cookie: token=YOUR_TOKEN" http://localhost:3000/api/notifications/preferences
```

## Common Issues & Solutions

### Issue 1: Logs show "Team not found"
**Problem:** The `teamId` parameter isn't being passed correctly
**Solution:** Verify the URL structure when calling the API

### Issue 2: Logs show preference retrieval but no "Creating in-app notification"
**Problem:** `inAppStickyNotes` is `false`
**Solution:** User has disabled sticky note notifications
**Fix:** Reset preferences:
```bash
curl -X POST -H "Cookie: token=YOUR_TOKEN" \
  http://localhost:3000/api/notifications/preferences/reset
```

### Issue 3: Notification create fails
**Problem:** Database constraint or data validation error
**Solution:** Check the error message in logs for specific details

### Issue 4: No logs appear at all
**Problem:** The notification function isn't being called
**Solution:**
- Check that sticky note POST request returns 201
- Verify `toUserId` is correct
- Check browser network tab for any errors

## Manual API Test

Create a sticky note via API:
```bash
curl -X POST -H "Cookie: token=SENDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "RECIPIENT_ID",
    "content": "Test message",
    "color": "yellow"
  }' \
  http://localhost:3000/api/teams/TEAM_ID/workspace/sticky-notes
```

Then check logs and database:
```bash
# Check if notification was created
curl -H "Cookie: token=RECIPIENT_TOKEN" \
  http://localhost:3000/api/notifications
```

## Checking Prisma Schema

Verify the Notification and NotificationPreference models exist:
```bash
npx prisma schema validate
```

## Database Connection Test

Verify database is accessible:
```bash
npx prisma db seed
# or
npx prisma db execute --stdin <<'EOF'
SELECT 1;
EOF
```

## Next Steps

1. Run your dev server: `npm run dev`
2. Create a sticky note between two users
3. Check the console logs
4. Share the logs here for analysis
5. Also run these SQL queries:
   ```sql
   SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 1;
   SELECT * FROM "NotificationPreference" LIMIT 1;
   SELECT * FROM "StickyNote" ORDER BY "createdAt" DESC LIMIT 1;
   ```

## Key Files to Check

- `lib/notificationService.ts` - Notification creation logic
- `app/api/teams/[id]/workspace/sticky-notes/route.ts` - API endpoint
- `prisma/schema.prisma` - Database schema (Notification model)

## Questions to Answer

When providing logs/screenshots:
1. Did the sticky note appear on both sides? (Expected: yes)
2. What do the console logs show?
3. Did the API return 201?
4. Are there any error messages?
5. Can you access `/api/notifications/preferences`?
6. What does the preference API return?
