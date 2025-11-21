# Quick Database Check

## Database Tables Check

Run this in your database client (like Neon, pgAdmin, or DBeaver):

```sql
-- Check if Notification table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'Notification'
);

-- Check if NotificationPreference table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'NotificationPreference'
);

-- List all tables to verify schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## If Tables Don't Exist

If the Notification and NotificationPreference tables don't exist, that's the problem. Run:

```bash
# Push schema changes to database
npx prisma db push

# Verify with:
npx prisma schema validate
```

## Check User Preferences

```sql
-- See if any notification preferences exist
SELECT * FROM "NotificationPreference" LIMIT 10;

-- If empty, users haven't been initialized yet
-- The system should auto-create them when notifications are sent
```

## Check Notification Data

```sql
-- See if any notifications were created
SELECT COUNT(*) as total_notifications FROM "Notification";

-- See sticky note notifications specifically
SELECT * FROM "Notification"
WHERE type = 'sticky_note_received'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Quick Test Steps

1. **Verify tables exist** - Run the schema check queries above
2. **Rebuild** - `npm run build`
3. **Start dev server** - `npm run dev`
4. **Create sticky note** - Send a message to a teammate
5. **Check console** - Look for `[StickyNotes POST]` logs
6. **Check database** - Run the notification queries above

If tables don't exist, that's the root cause and we need to run `npx prisma db push` or `npx prisma migrate dev`.
