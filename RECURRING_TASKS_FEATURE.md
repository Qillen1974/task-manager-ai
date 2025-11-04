# Recurring Tasks Feature Documentation

## Overview

The recurring tasks feature allows users on **PRO** and **ENTERPRISE** subscription plans to create tasks that automatically regenerate on a specified schedule. This automates repetitive task management and helps users maintain consistency in their workflows.

## Features

### 1. **Recurring Patterns**
Users can set recurring tasks with the following patterns:

- **DAILY**: Task repeats every X days
- **WEEKLY**: Task repeats every X weeks on specified days of the week
- **MONTHLY**: Task repeats every X months on a specific day
- **CUSTOM**: Flexible pattern for specific recurrence needs (yearly, bi-weekly, etc.)

### 2. **Subscription Restrictions**

| Plan | Recurring Tasks | Recurring Task Templates |
|------|-----------------|------------------------|
| FREE | ❌ Not available | 0 |
| PRO | ✅ Available | Up to 5 templates |
| ENTERPRISE | ✅ Available | Unlimited |

### 3. **Core Functionality**

- **Create recurring tasks** with customizable schedules
- **Visual indicators** showing which tasks are recurring (🔄 badge)
- **Automatic date calculation** for next occurrences
- **Parent-child relationship** tracking between templates and generated instances
- **End conditions** support (end date or after N occurrences)

## Database Schema

### Task Model Updates

The `Task` model includes the following new fields for recurring tasks:

```prisma
// Recurring task fields
isRecurring: Boolean          // Whether this is a recurring task template
recurringPattern: String?     // Pattern type: DAILY, WEEKLY, MONTHLY, CUSTOM
recurringConfig: String?      // JSON string with pattern configuration
recurringStartDate: DateTime? // When recurrence should start
recurringEndDate: DateTime?   // When recurrence should stop (optional)
nextGenerationDate: DateTime? // When next instance should be generated
lastGeneratedDate: DateTime?  // When last instance was generated
parentTaskId: String?         // Reference to parent recurring task (null for parent/one-off)
parentTask: Task?             // Navigation to parent recurring task
childTasks: Task[]            // Generated instances of this recurring task
```

### Subscription Model Updates

```prisma
recurringTaskLimit: Int  // Limit based on subscription plan
// FREE: 0 (disabled), PRO: 5, ENTERPRISE: unlimited
```

## Type Definitions

### RecurringPattern
```typescript
type RecurringPattern = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
```

### RecurringConfig
```typescript
interface RecurringConfig {
  pattern: RecurringPattern;
  interval: number;              // Every X days/weeks/months
  daysOfWeek?: number[];         // For WEEKLY: 0-6 (Sunday=0, Saturday=6)
  dayOfMonth?: number;           // For MONTHLY: 1-31
  customType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; // For CUSTOM
  endAfterOccurrences?: number;  // Stop after N occurrences
  endDate?: string;              // Stop on specific date (YYYY-MM-DD)
}
```

## API Endpoints

### POST /api/tasks
Creates a new task, optionally with recurring configuration.

**Request Body:**
```json
{
  "title": "Weekly Team Standup",
  "description": "Team synchronization meeting",
  "projectId": "project-123",
  "dueDate": "2024-01-15",
  "dueTime": "10:00",
  "isRecurring": true,
  "recurringPattern": "WEEKLY",
  "recurringConfig": {
    "pattern": "WEEKLY",
    "interval": 1,
    "daysOfWeek": [1, 3, 5]  // Mon, Wed, Fri
  },
  "recurringStartDate": "2024-01-15",
  "recurringEndDate": "2024-12-31"
}
```

**Response includes:**
- All recurring fields for tracking template and generated instances
- `nextGenerationDate`: When the next instance will be auto-generated
- `isRecurring`: True for template, false for individual instances

### PATCH /api/tasks/[id]
Updates a task, including recurring configuration. For recurring templates, you can update:
- Recurrence pattern
- Recurrence interval
- Days/dates for specific patterns
- End date

## Frontend Components

### TaskForm Component

The `TaskForm` component includes a new section for recurring task configuration:

**New Props:**
```typescript
canCreateRecurringTasks?: boolean;  // Whether user can create recurring tasks
```

**Features:**
- Toggle to enable/disable recurring for a task
- Pattern selection (DAILY, WEEKLY, MONTHLY, CUSTOM)
- Interval input
- Pattern-specific options:
  - Weekly: Day of week selector (Sunday-Saturday)
  - Monthly: Day of month input
- Start date and optional end date
- Live preview of recurrence pattern

### TaskCard Component

Updated to display recurring task indicators:
- **Purple badge** with 🔄 icon showing "Recurring"
- **Hover tooltip** showing the recurrence pattern description
- Example: "Every week on Mon, Wed, Fri"

## Utility Functions

### Core Recurring Functions (lib/utils.ts)

#### `getRecurringPatternLabel(pattern: RecurringPattern): string`
Returns human-readable label for a pattern.

#### `parseRecurringConfig(config: RecurringConfig | string | null): RecurringConfig | null`
Parses JSON string config or returns object as-is.

#### `formatRecurringDescription(pattern: RecurringPattern, config: RecurringConfig | string | null): string`
Generates human-readable description of recurrence.
- Example output: "Every week on Mon, Wed, Fri"
- Example output: "Every month on the 15th"

#### `calculateNextOccurrenceDate(lastOccurrenceDate: string | Date, config: RecurringConfig | string | null): Date | null`
Calculates the next occurrence date based on the config.

#### `shouldGenerateRecurringTask(lastGeneratedDate: Date | null, nextGenerationDate: Date | null): boolean`
Checks if a new instance should be generated now.

#### `isRecurringTaskEnded(lastGeneratedDate: Date | null, config: RecurringConfig | string | null, recurringEndDate: Date | null): boolean`
Checks if a recurring task has reached its end condition.

### Subscription Limits Functions (lib/projectLimits.ts)

#### `getRecurringTaskLimit(plan: SubscriptionPlan)`
Returns recurring task limits for a subscription plan.

#### `canCreateRecurringTask(plan: SubscriptionPlan, currentRecurringTaskCount: number)`
Validates if user can create a new recurring task.

Returns:
```typescript
{
  allowed: boolean;
  message?: string;  // Error message if not allowed
}
```

## Examples

### Example 1: Daily Standup
```typescript
const dailyStandup = {
  title: "Daily Standup",
  projectId: "project-123",
  isRecurring: true,
  recurringPattern: "DAILY",
  recurringConfig: {
    pattern: "DAILY",
    interval: 1,
  },
  recurringStartDate: "2024-01-15",
  recurringEndDate: "2024-12-31"
};
```

### Example 2: Weekly Team Meeting
```typescript
const weeklyMeeting = {
  title: "Weekly Team Meeting",
  projectId: "project-123",
  dueTime: "14:00",
  isRecurring: true,
  recurringPattern: "WEEKLY",
  recurringConfig: {
    pattern: "WEEKLY",
    interval: 1,
    daysOfWeek: [1, 4]  // Monday and Thursday
  },
  recurringStartDate: "2024-01-15"
};
```

### Example 3: Monthly Report
```typescript
const monthlyReport = {
  title: "Monthly Status Report",
  projectId: "project-123",
  isRecurring: true,
  recurringPattern: "MONTHLY",
  recurringConfig: {
    pattern: "MONTHLY",
    interval: 1,
    dayOfMonth: 28  // Last business day of month (approximately)
  },
  recurringStartDate: "2024-01-28"
};
```

## Testing

### Unit Tests

The feature includes comprehensive test coverage:

1. **lib/recurringTasks.test.ts** - Utility function tests
   - Pattern label formatting
   - Config parsing
   - Description formatting
   - Date calculations
   - Generation checks

2. **lib/projectLimits.test.ts** - Limit validation tests
   - Plan limit retrieval
   - Recurring task creation validation
   - Upgrade messages

### Running Tests
```bash
npm test
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

## Future Enhancements

### Planned Features

1. **Automatic Task Generation**
   - Background job to generate new task instances at scheduled times
   - Webhook support for external systems

2. **Instance Management**
   - Edit single instance vs. all future instances
   - Skip specific occurrences
   - Break recurrence from a specific instance

3. **Advanced Patterns**
   - Bi-weekly patterns
   - Custom weekday patterns (every 2nd Monday)
   - Business day only recurrence

4. **Analytics**
   - Recurring task completion rate
   - Pattern effectiveness tracking
   - User engagement metrics

5. **Notifications**
   - Upcoming recurring task reminders
   - Recurrence schedule changes
   - Generated instance notifications

## Migration Guide

### For Developers

If you're updating existing code to use recurring tasks:

1. **Update form props**: Pass `canCreateRecurringTasks` to TaskForm
2. **Handle recurring fields**: Include recurring fields in task creation/update
3. **Display indicators**: Task cards now show 🔄 badge for recurring tasks
4. **Update queries**: API routes now include recurring fields in responses

### For Database

When deploying this feature:

1. Run Prisma migration to add recurring fields to Task table
2. Add `recurringTaskLimit` field to Subscription table
3. Set limits based on plan:
   - FREE: 0
   - PRO: 5
   - ENTERPRISE: unlimited

```bash
npx prisma migrate dev --name add_recurring_tasks
```

## Troubleshooting

### Common Issues

**Issue**: "Recurring tasks not available on your plan"
- **Solution**: Check subscription plan. Recurring tasks are PRO+ only.

**Issue**: Can't create more than 5 recurring tasks on PRO
- **Solution**: Delete existing recurring tasks or upgrade to ENTERPRISE.

**Issue**: Dates not calculating correctly
- **Solution**: Ensure `recurringStartDate` is set before creating recurring task.

## Support

For questions or issues related to recurring tasks, contact:
- Development: Check RECURRING_TASKS_FEATURE.md
- Testing: See __tests__/lib/recurringTasks.test.ts
- Components: See components/TaskForm.tsx
