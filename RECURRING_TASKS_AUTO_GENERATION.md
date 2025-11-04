# Recurring Tasks Auto-Generation Service

## Overview

The auto-generation service automatically creates new task instances from recurring task templates on a scheduled basis. This completes the recurring tasks feature by providing automatic task generation.

## Architecture

### Components

1. **Generation Service** (`lib/recurringTaskGenerator.ts`)
   - Core logic for generating recurring task instances
   - Checks due dates and end conditions
   - Creates new task instances
   - Tracks generation history

2. **API Endpoint** (`app/api/tasks/generate-recurring/route.ts`)
   - Exposes generation functionality via HTTP
   - Supports manual triggering
   - Provides status monitoring
   - Requires authentication

3. **Database**
   - Uses existing Task model fields
   - Tracks `nextGenerationDate` and `lastGeneratedDate`
   - Maintains parent-child relationships

## How It Works

### Generation Flow

```
[Scheduler/Cron Job] (every hour)
    ↓
POST /api/tasks/generate-recurring
    ↓
generateRecurringTaskInstances()
    ↓
For each recurring task:
  1. Check: isRecurring = true AND parentTaskId = null?
  2. Check: nextGenerationDate <= now?
  3. Check: Has end date passed?
  4. If all pass → generateTaskInstance()
  5. Update lastGeneratedDate & nextGenerationDate
    ↓
Return result with count & errors
```

### Task Instance Creation

When a new instance is generated:

```javascript
Parent Task (Template)
├── id: "recurring-task-1"
├── title: "Weekly Meeting"
├── isRecurring: true
├── recurringPattern: "WEEKLY"
├── nextGenerationDate: 2024-01-22
├── lastGeneratedDate: 2024-01-15
└── ...

Created Instance
├── id: "instance-uuid-1"
├── title: "Weekly Meeting (1/15/2024)"
├── isRecurring: false
├── parentTaskId: "recurring-task-1"
├── dueDate: (adjusted from parent)
├── startDate: (adjusted from parent)
└── ...
```

## API Endpoints

### POST /api/tasks/generate-recurring

Triggers task generation with various actions.

**Query Parameters:**
- `action` (optional): "generate-all" | "generate-pending" | "count" | "generate-for-task"
- `taskId` (optional): Specific task ID when action is "generate-for-task"

**Default Action: "generate-all"**

Generates all due recurring task instances.

```bash
POST /api/tasks/generate-recurring
```

**Response:**
```json
{
  "success": true,
  "tasksGenerated": 5,
  "errors": [],
  "message": "Generated 5 task instances.",
  "action": "generate-all"
}
```

**Count Pending Generations**

Check how many recurring tasks are due for generation.

```bash
POST /api/tasks/generate-recurring?action=count
```

**Response:**
```json
{
  "action": "count",
  "pendingGenerations": 3,
  "message": "3 recurring tasks pending generation"
}
```

**Generate for Specific Task**

Generate instance for a specific recurring task.

```bash
POST /api/tasks/generate-recurring?action=generate-for-task&taskId=task-123
```

**Response:**
```json
{
  "message": "Generated new instance for task task-123",
  "generated": true,
  "action": "generate-for-task",
  "taskId": "task-123"
}
```

### GET /api/tasks/generate-recurring

Get current generation status.

**Query Parameters:**
- `action` (optional): "status" (default)

```bash
GET /api/tasks/generate-recurring
```

**Response:**
```json
{
  "action": "status",
  "pendingGenerations": 2,
  "ready": true
}
```

## Service Functions

### generateRecurringTaskInstances()

Main function to generate all due recurring task instances.

```typescript
const result = await generateRecurringTaskInstances();

// Returns
interface GenerationResult {
  success: boolean;
  tasksGenerated: number;
  errors: Array<{ taskId: string; error: string }>;
  message: string;
}
```

**Example:**
```typescript
const result = await generateRecurringTaskInstances();
if (result.success) {
  console.log(`Generated ${result.tasksGenerated} tasks`);
} else {
  console.error(`Errors: ${result.errors.length}`);
}
```

### generateInstanceIfDue(parentTask: Task)

Generate instance for a specific task if it's due.

```typescript
const task = await db.task.findUnique({ where: { id: "task-1" } });
const generated = await generateInstanceIfDue(task);
// Returns: true if generated, false if not due
```

### generateInstanceForTask(taskId: string)

Manual generation for a specific task.

```typescript
try {
  const generated = await generateInstanceForTask("task-123");
  console.log(generated ? "Generated" : "Not due");
} catch (error) {
  console.error(error.message);
}
```

### getGenerationStatus(taskId: string)

Get generation status for a specific task.

```typescript
const status = await getGenerationStatus("task-123");
// Returns
{
  isRecurring: true,
  nextGenerationDate: Date,
  lastGeneratedDate: Date,
  hasEnded: boolean,
  generationDueNow: boolean
}
```

### countPendingGenerations()

Count how many recurring tasks are due now.

```typescript
const pending = await countPendingGenerations();
console.log(`${pending} tasks are pending generation`);
```

## Setting Up Automatic Generation

### Option 1: Cron Job (Recommended)

Use a scheduled task to call the API periodically.

**Every Hour (using node-cron):**

```typescript
// lib/scheduler.ts
import cron from 'node-cron';
import { generateRecurringTaskInstances } from '@/lib/recurringTaskGenerator';

export function startRecurringTaskScheduler() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Running recurring task generation...');
    const result = await generateRecurringTaskInstances();
    console.log(`[Scheduler] ${result.message}`);
  });
}

// app/layout.tsx or server initialization
if (process.env.NODE_ENV === 'production') {
  startRecurringTaskScheduler();
}
```

**Install dependency:**
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

### Option 2: External Service (Advanced)

Use external scheduler like:
- **Railway Cron Jobs** - Built into Railway
- **GitHub Actions** - Scheduled workflows
- **AWS Lambda** - Scheduled triggers
- **Google Cloud Scheduler** - Cloud tasks

**Example: Railway Cron Job**

Add to `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyMaxRetries": 3
  },
  "jobs": [
    {
      "name": "recurring-task-generator",
      "command": "curl -X POST http://localhost:3000/api/tasks/generate-recurring -H 'Authorization: Bearer $GENERATION_TOKEN'",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Option 3: Webhook/Manual Trigger

Call the endpoint manually or via webhook:

```bash
# From your application
POST /api/tasks/generate-recurring

# From CLI
curl -X POST http://localhost:3000/api/tasks/generate-recurring \
  -H "Authorization: Bearer YOUR_TOKEN"

# From another service
fetch('/api/tasks/generate-recurring', { method: 'POST' })
```

## Example Scenarios

### Scenario 1: Daily Task Generation

```
Recurring Task:
- Title: "Daily Standup"
- Pattern: DAILY
- Interval: 1
- Start: Jan 15, 2024
- End: Dec 31, 2024
- Due Time: 09:00

When scheduler runs on Jan 15 at 10:00 AM:
✓ nextGenerationDate (Jan 15) <= now (10:00)
✓ not ended (end date is Dec 31)
→ Creates instance 1: "Daily Standup (1/15/2024)"
→ Sets nextGenerationDate to Jan 16

When scheduler runs on Jan 16:
✓ nextGenerationDate (Jan 16) <= now
→ Creates instance 2: "Daily Standup (1/16/2024)"
→ Sets nextGenerationDate to Jan 17

...continues daily until Dec 31
```

### Scenario 2: Weekly Task with Multiple Days

```
Recurring Task:
- Title: "Team Meeting"
- Pattern: WEEKLY
- Days: Mon, Wed, Fri
- Start: Jan 15, 2024 (Monday)

When scheduler runs on Jan 15:
✓ Monday - generates instance
✓ Sets nextGenerationDate to Jan 17 (Wednesday)

When scheduler runs on Jan 17:
✓ Wednesday - generates instance
✓ Sets nextGenerationDate to Jan 19 (Friday)

When scheduler runs on Jan 19:
✓ Friday - generates instance
✓ Sets nextGenerationDate to Jan 22 (next Monday)

Weekly cycle repeats...
```

### Scenario 3: Monthly Task with End Date

```
Recurring Task:
- Title: "Monthly Report"
- Pattern: MONTHLY
- Day: 28th
- Start: Jan 28, 2024
- End: Jun 28, 2024

Jan 28 → generates "Monthly Report (1/28/2024)"
Feb 28 → generates "Monthly Report (2/28/2024)"
Mar 28 → generates "Monthly Report (3/28/2024)"
Apr 28 → generates "Monthly Report (4/28/2024)"
May 28 → generates "Monthly Report (5/28/2024)"
Jun 28 → generates "Monthly Report (6/28/2024)"
Jul 28 → ✗ END DATE PASSED - no more instances
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Task not found | Invalid taskId | Check task exists |
| Task is not recurring | isRecurring = false | Use recurring task |
| Task is an instance | parentTaskId is set | Use parent template |
| Database error | Connection failed | Check database status |
| Invalid config | Bad JSON in recurringConfig | Check task configuration |

### Error Response Example

```json
{
  "success": false,
  "tasksGenerated": 2,
  "errors": [
    {
      "taskId": "task-123",
      "error": "Invalid recurring config"
    },
    {
      "taskId": "task-456",
      "error": "Database connection failed"
    }
  ],
  "message": "Generated 2 task instances. 2 errors occurred."
}
```

## Monitoring

### Check Generation Status

```bash
# Get pending generations count
GET /api/tasks/generate-recurring?action=count

# Response
{
  "action": "status",
  "pendingGenerations": 5,
  "ready": true
}
```

### Logging

The service logs all operations:

```
[Recurring Tasks] Found 10 recurring task templates
[Recurring Tasks] Generated instance for task task-123, next generation: 2024-01-22
[Recurring Tasks] Task task-456 has ended, skipping generation
[Recurring Tasks] Generation service error: Database error
```

## Performance Considerations

- **Frequency**: Run every 1-4 hours for best results
- **Scale**: Can handle hundreds of recurring tasks
- **Database**: Uses indexes on `isRecurring`, `parentTaskId`, `nextGenerationDate`
- **Batch**: Processes all due tasks in single run
- **Parallelization**: Can be enhanced with parallel processing if needed

## Security

- **Authentication**: Required for all endpoints
- **User Isolation**: Only generates tasks for authenticated user
- **Data Validation**: Checks all inputs before generation
- **Error Safety**: Errors don't stop entire batch

## Testing

Run the test suite:

```bash
npm test recurringTaskGenerator
```

**28 tests covering:**
- Generation logic
- Pattern calculations
- End date handling
- Error scenarios
- Edge cases

## Future Enhancements

- [ ] Parallel generation for better performance
- [ ] Batch generation optimization
- [ ] Webhook notifications on generation
- [ ] Generation history/audit log
- [ ] Retry logic for failed generations
- [ ] Generation statistics dashboard

## Troubleshooting

### Tasks Not Generating

1. **Check nextGenerationDate**
   ```bash
   GET /api/tasks/[id]
   # Check nextGenerationDate is not in future
   ```

2. **Check end date**
   ```bash
   # Verify recurringEndDate hasn't passed
   ```

3. **Check scheduler running**
   ```bash
   # Verify cron job is active
   ```

4. **Manually trigger**
   ```bash
   POST /api/tasks/generate-recurring?action=generate-for-task&taskId=task-123
   ```

### Generation Too Frequent

- Reduce scheduler frequency
- Check interval calculation
- Verify nextGenerationDate calculation

### Database Issues

- Check database connection
- Verify Prisma client is initialized
- Check user permissions

## References

- **Main Feature**: See `RECURRING_TASKS_FEATURE.md`
- **Implementation**: See `RECURRING_TASKS_IMPLEMENTATION.md`
- **Tests**: See `__tests__/lib/recurringTaskGenerator.test.ts`
- **Service Code**: See `lib/recurringTaskGenerator.ts`
- **API Code**: See `app/api/tasks/generate-recurring/route.ts`
