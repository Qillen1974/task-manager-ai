# Recurring Task Scheduler Setup Guide

## Quick Start

The scheduler is **already installed and configured** in your application! Here's how to activate it:

### Option 1: Production Environment (Recommended)

The scheduler automatically starts when your app is in **production mode**.

**What happens:**
- App starts → Scheduler initializes
- Runs generation check every hour at the top of the hour (e.g., 1:00, 2:00, 3:00)
- Generates all due recurring task instances
- Logs results to console

**How to deploy:**
```bash
# Push to GitHub (already done)
git push origin main

# Railway auto-detects production and enables scheduler
# Scheduler starts automatically when app boots
```

### Option 2: Development Testing

Enable scheduler in development with an environment variable:

```bash
# .env.local
ENABLE_SCHEDULER=true
```

Or just run the API endpoint manually:

```bash
# Test generation
POST /api/tasks/generate-recurring

# Check status
GET /api/tasks/generate-recurring?action=count
```

---

## How the Scheduler Works

### Automatic Hourly Generation

```
App Startup
    ↓
Scheduler Initializes (in layout.tsx)
    ↓
Every hour at :00
    ↓
Check: Are there pending recurring tasks?
    ↓
YES → Generate all due instances
    ↓
Update nextGenerationDate & lastGeneratedDate
    ↓
Log results
```

### Example Timeline

```
1:00 AM → Check pending tasks → Generate 2 instances
2:00 AM → Check pending tasks → No pending tasks
3:00 AM → Check pending tasks → Generate 1 instance
4:00 AM → Check pending tasks → No pending tasks
5:00 AM → Check pending tasks → Generate 3 instances
...continues throughout the day
```

---

## Configuration Options

### Scheduler Schedule

The scheduler uses a **cron expression** to determine when to run:

**Current:** `0 * * * *` (Every hour)
- Runs at: 1:00, 2:00, 3:00, etc.

**To change the schedule**, edit `lib/scheduler.ts`:

```typescript
// Current: every hour
cron.schedule('0 * * * *', async () => { ... });

// Examples:
// Every 30 minutes
cron.schedule('*/30 * * * *', async () => { ... });

// Every 4 hours
cron.schedule('0 */4 * * *', async () => { ... });

// Daily at 9 AM
cron.schedule('0 9 * * *', async () => { ... });

// Every 6 hours
cron.schedule('0 */6 * * *', async () => { ... });

// Every Monday at 8 AM
cron.schedule('0 8 * * 1', async () => { ... });
```

### Cron Expression Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (0 = Sunday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Common Examples:**
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight
- `0 9 * * MON` - Every Monday at 9 AM
- `*/15 * * * *` - Every 15 minutes
- `0 */6 * * *` - Every 6 hours

---

## Scheduler Functions

### In Your Code

Use the scheduler functions in your application:

```typescript
// lib/scheduler.ts
import {
  startRecurringTaskScheduler,
  stopRecurringTaskScheduler,
  manuallyTriggerGeneration,
  getSchedulerStatus,
  scheduleGenerationTask
} from '@/lib/scheduler';

// Get current status
const status = getSchedulerStatus();
console.log(status);
// { started: true, tasksCount: 1, nextRuns: [...] }

// Manually trigger generation (useful for testing)
await manuallyTriggerGeneration();

// Add a custom schedule
scheduleGenerationTask('0 9 * * *'); // Daily at 9 AM

// Stop the scheduler (for testing)
stopRecurringTaskScheduler();
```

---

## Monitoring & Logs

### Console Output

The scheduler logs all activity:

```
[Scheduler] ✓ Recurring task scheduler started (every hour at :00)
[Scheduler] Running initial generation check...
[Scheduler] No pending generations

[Scheduler 2024-11-04T10:00:00.000Z] Running generation for 3 task(s)...
[Scheduler 2024-11-04T10:00:00.000Z] ✓ Generated 3 task instances.

[Scheduler 2024-11-04T11:00:00.000Z] No pending generations
```

### Check Status via API

```bash
# Get pending generations count
curl -X GET http://localhost:3000/api/tasks/generate-recurring?action=count

# Response
{
  "action": "status",
  "pendingGenerations": 5,
  "ready": true
}
```

---

## Testing the Scheduler

### Test 1: Check Scheduler is Running

```bash
# Look at server logs when app starts
# You should see:
# [Scheduler] ✓ Recurring task scheduler started (every hour at :00)
```

### Test 2: Create a Recurring Task

1. Create a new task with recurring enabled
2. Set pattern to DAILY
3. Set start date to today
4. Save task

### Test 3: Manually Trigger Generation

```bash
# Trigger generation immediately
POST /api/tasks/generate-recurring

# Response
{
  "success": true,
  "tasksGenerated": 1,
  "errors": [],
  "message": "Generated 1 task instance.",
  "action": "generate-all"
}
```

### Test 4: Verify Instance Was Created

```bash
# Get tasks and look for new instance
GET /api/tasks

# Should see new task with parentTaskId pointing to original
{
  "id": "new-instance-id",
  "title": "Daily Task (11/4/2024)",
  "parentTaskId": "original-recurring-task-id",
  "isRecurring": false
}
```

---

## Deployment

### On Railway

The scheduler automatically activates in production:

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Railway deploys**
   - Installs dependencies (node-cron)
   - Starts application
   - Scheduler initializes
   - Runs first generation check

3. **Verify in Railway logs**
   - Check Railway dashboard → Logs
   - Look for `[Scheduler]` messages

### Environment Variables

Add to Railway (if needed):

```
ENABLE_SCHEDULER=true  # Optional: enables in development too
NODE_ENV=production    # Automatically set by Railway
```

---

## Troubleshooting

### Scheduler Not Running

**Check 1: Environment**
```bash
# Verify you're in production
NODE_ENV=production npm start

# Or enable in dev
ENABLE_SCHEDULER=true npm run dev
```

**Check 2: Node-cron installed**
```bash
npm ls node-cron
# Should show: node-cron@3.0.x
```

**Check 3: Logs**
```bash
# Check for scheduler startup message
# Look for: "[Scheduler] ✓ Recurring task scheduler started"
```

### Tasks Not Generating

1. **Check pending count**
   ```bash
   GET /api/tasks/generate-recurring?action=count
   ```

2. **Verify next generation date**
   ```bash
   GET /api/tasks/[task-id]
   # Check nextGenerationDate is <= now
   ```

3. **Check end date**
   ```bash
   # Verify recurringEndDate hasn't passed
   ```

4. **Manually trigger**
   ```bash
   POST /api/tasks/generate-recurring
   ```

### Performance Issues

- Reduce check frequency (e.g., every 2-4 hours instead of every hour)
- Check database performance
- Monitor server logs for slow queries

---

## Advanced: Custom Schedules

### Multiple Schedules

```typescript
// lib/scheduler.ts - Add multiple schedules

// Default: every hour
cron.schedule('0 * * * *', async () => {
  await runGenerationTask();
});

// Bonus: every 4 hours for backup
cron.schedule('0 */4 * * *', async () => {
  console.log('[Scheduler] Running 4-hour backup check...');
  await runGenerationTask();
});
```

### Conditional Scheduling

```typescript
// Only run during business hours
cron.schedule('0 9-17 * * MON-FRI', async () => {
  await runGenerationTask();
});
```

---

## File Structure

```
app/
  layout.tsx                    # Initializes scheduler
lib/
  scheduler.ts                 # Scheduler implementation
  recurringTaskGenerator.ts    # Generation logic
app/api/tasks/
  generate-recurring/
    route.ts                   # API endpoints
```

---

## Summary

✅ **Scheduler is installed and ready**
- Node-cron installed
- Scheduler code added (`lib/scheduler.ts`)
- Layout updated to initialize scheduler

✅ **Activation**
- Automatically starts in production
- Optional: enable in development with `ENABLE_SCHEDULER=true`

✅ **How it works**
- Runs every hour at minute 0
- Checks for due recurring tasks
- Generates instances
- Updates next generation dates
- Logs all activity

✅ **Testing**
- Manual API triggers available
- Check status with API
- Monitor logs in console/Railway dashboard

✅ **Customization**
- Change schedule by editing cron expression
- Add multiple schedules if needed
- Fully extensible

---

## Next Steps

1. **Deploy to production**
   ```bash
   git push origin main
   ```

2. **Watch scheduler in action**
   - Check Railway logs
   - Look for `[Scheduler]` messages

3. **Test generation**
   - Create recurring task
   - Call API or wait for hourly check
   - Verify instances are created

4. **Monitor performance**
   - Watch logs for errors
   - Monitor database performance
   - Adjust schedule frequency if needed

---

## Questions?

**API Reference:** See `RECURRING_TASKS_AUTO_GENERATION.md`
**Feature Overview:** See `RECURRING_TASKS_FEATURE.md`
**Scheduler Code:** See `lib/scheduler.ts`
**Generation Logic:** See `lib/recurringTaskGenerator.ts`
