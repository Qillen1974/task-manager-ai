# Phase 2: Team Collaboration - Notifications System

## Overview

The Notifications System is Phase 2 of your team collaboration feature implementation. It provides both email and in-app notifications for team collaboration events with granular user control over notification preferences.

## Features Implemented

### 1. **Notification Types**
- ✅ **Team Invitations** - When a user is invited to join a team
- ✅ **Task Assignments** - When a task is assigned to a user
- ✅ **Document Uploads** - When a document is uploaded to team workspace
- ✅ **Sticky Notes** - When a user receives a message in workspace
- ✅ **Task Completions** - When a task is completed by a team member

### 2. **Notification Channels**
- **Email Notifications** - Via Resend email service
- **In-App Notifications** - Stored in database for quick access

### 3. **User Preferences**
Users can customize:
- Which notification types trigger emails
- Which notification types trigger in-app notifications
- Digest frequency (immediate, daily, weekly, or never)
- Mute all notifications option

## Database Schema

### Notification Model
```prisma
model Notification {
  id                  String   @id @default(cuid())
  userId              String   // Recipient
  type                String   // team_invitation, task_assigned, etc.
  title               String
  message             String
  relatedTaskId       String?
  relatedTeamId       String?
  relatedDocumentId   String?
  relatedUserId       String?  // User who triggered notification
  isRead              Boolean  @default(false)
  readAt              DateTime?
  sentViaEmail        Boolean  @default(false)
  emailSentAt         DateTime?
  metadata            Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### NotificationPreference Model
```prisma
model NotificationPreference {
  id                          String   @id @default(cuid())
  userId                      String   @unique

  // Email preferences (boolean flags for each notification type)
  emailTaskAssignments        Boolean @default(true)
  emailTeamInvitations        Boolean @default(true)
  emailDocumentUploads        Boolean @default(false)
  emailStickyNotes            Boolean @default(false)
  emailTaskCompletions        Boolean @default(false)

  // In-app preferences
  inAppTaskAssignments        Boolean @default(true)
  inAppTeamInvitations        Boolean @default(true)
  inAppDocumentUploads        Boolean @default(true)
  inAppStickyNotes            Boolean @default(true)
  inAppTaskCompletions        Boolean @default(true)

  // General preferences
  digestFrequency             String @default("immediate")
  notificationsMuted          Boolean @default(false)

  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
}
```

## API Endpoints

### Notifications Management

#### Get User Notifications
```
GET /api/notifications?limit=20&skip=0&unreadOnly=false

Query Parameters:
- limit: Number of notifications to fetch (default: 20)
- skip: Number of notifications to skip for pagination (default: 0)
- unreadOnly: Only return unread notifications (default: false)

Response:
{
  "notifications": [
    {
      "id": "notif_123",
      "userId": "user_456",
      "type": "task_assigned",
      "title": "Assigned to: Build Dashboard",
      "message": "John Doe assigned you to the task \"Build Dashboard\" in ProjectX.",
      "relatedTaskId": "task_789",
      "isRead": false,
      "sentViaEmail": true,
      "emailSentAt": "2024-11-20T10:00:00Z",
      "metadata": {
        "taskTitle": "Build Dashboard",
        "projectName": "ProjectX",
        "role": "OWNER"
      },
      "createdAt": "2024-11-20T10:00:00Z",
      "updatedAt": "2024-11-20T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

#### Get Single Notification
```
GET /api/notifications/[id]

Response: Returns the notification and marks it as read
```

#### Delete Notification
```
DELETE /api/notifications/[id]
```

#### Mark Notifications as Read/Unread
```
PATCH /api/notifications
Body:
{
  "notificationIds": ["notif_123", "notif_456"],
  "isRead": true
}

Response:
{
  "updatedCount": 2
}
```

### Notification Preferences

#### Get User Preferences
```
GET /api/notifications/preferences

Response:
{
  "id": "pref_123",
  "userId": "user_456",
  "emailTaskAssignments": true,
  "emailTeamInvitations": true,
  "emailDocumentUploads": false,
  "emailStickyNotes": false,
  "emailTaskCompletions": false,
  "inAppTaskAssignments": true,
  "inAppTeamInvitations": true,
  "inAppDocumentUploads": true,
  "inAppStickyNotes": true,
  "inAppTaskCompletions": true,
  "digestFrequency": "immediate",
  "notificationsMuted": false,
  "createdAt": "2024-11-20T10:00:00Z",
  "updatedAt": "2024-11-20T10:00:00Z"
}
```

#### Update Preferences
```
PATCH /api/notifications/preferences
Body: (Any combination of preference fields)
{
  "emailTaskAssignments": false,
  "inAppDocumentUploads": false,
  "digestFrequency": "daily"
}
```

#### Reset to Defaults
```
POST /api/notifications/preferences/reset

Returns all preferences reset to default values
```

## Implementation Details

### 1. Email Templates (`lib/emailTemplates.ts`)

Professional HTML email templates for each notification type with:
- Branded header with TaskQuadrant styling
- Clear information hierarchy
- Call-to-action buttons
- Plain text fallback for email clients
- Responsive design

#### Available Templates:
- `teamInvitationEmailTemplate()` - Team invitation emails
- `taskAssignmentEmailTemplate()` - Task assignment notifications
- `documentUploadEmailTemplate()` - Document upload notifications
- `stickyNoteEmailTemplate()` - Message/sticky note notifications
- `taskCompletionEmailTemplate()` - Task completion updates

### 2. Notification Service (`lib/notificationService.ts`)

Core service handling all notification logic:

#### Key Functions:
- `createNotification()` - Create in-app notification
- `getNotificationPreferences()` - Get or create user preferences
- `sendTeamInvitationNotification()` - Handle team invitation notifications
- `sendTaskAssignmentNotification()` - Handle task assignment notifications
- `sendDocumentUploadNotification()` - Notify team on document upload
- `sendStickyNoteNotification()` - Notify on message reception
- `sendTaskCompletionNotification()` - Notify collaborators on completion

#### Workflow:
1. Check user's notification preferences
2. Create in-app notification if enabled
3. Send email if enabled (respects user preferences)
4. Mark notification as email-sent if successful
5. Continue even if email fails (graceful degradation)

### 3. Integration Points

#### Team Invitations
**File:** `app/api/teams/[id]/invitations/route.ts`

When a team invitation is sent:
```typescript
await sendTeamInvitationNotification(
  invitedEmail,
  teamId,
  teamName,
  inviterName,
  role,
  invitationToken
);
```

#### Task Assignments
**File:** `app/api/tasks/[id]/assignments/route.ts`

When a task is assigned:
```typescript
await sendTaskAssignmentNotification(
  userId,
  assignerName,
  taskId,
  taskTitle,
  projectName,
  dueDate,
  role
);
```

#### Document Uploads
**File:** `app/api/teams/[id]/workspace/documents/route.ts`

When a document is uploaded:
```typescript
await sendDocumentUploadNotification(
  uploaderName,
  teamId,
  teamName,
  documentId,
  documentName,
  excludeUserId
);
```

## Configuration

### Environment Variables
Ensure these are set in `.env`:
```
# Resend Email Configuration
RESEND_API_KEY=your_api_key
SMTP_FROM=support@yourdomain.com  # or anything@resend.dev for testing

# Application URL (for notification links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # production
```

### Default Notification Preferences
Users get these defaults when first accessing notifications:

**Email Enabled (opt-in):**
- ✅ Team invitations
- ✅ Task assignments

**Email Disabled (opt-out available):**
- ❌ Document uploads
- ❌ Sticky notes
- ❌ Task completions

**In-App Always Enabled:**
- ✅ All notification types

**Digest:**
- Immediate delivery

## Usage Examples

### Frontend - Fetching Notifications

```typescript
// Get unread notifications
const response = await fetch('/api/notifications?unreadOnly=true');
const { notifications } = await response.json();

// Mark as read
await fetch('/api/notifications', {
  method: 'PATCH',
  body: JSON.stringify({
    notificationIds: [notif1.id, notif2.id],
    isRead: true
  })
});

// Delete notification
await fetch(`/api/notifications/${notifId}`, {
  method: 'DELETE'
});
```

### Frontend - Managing Preferences

```typescript
// Get current preferences
const prefs = await fetch('/api/notifications/preferences').then(r => r.json());

// Update preferences
await fetch('/api/notifications/preferences', {
  method: 'PATCH',
  body: JSON.stringify({
    emailDocumentUploads: true,
    digestFrequency: 'daily'
  })
});

// Reset to defaults
await fetch('/api/notifications/preferences/reset', {
  method: 'POST'
});
```

## Error Handling

The notification system is designed to be **non-blocking**:
- If email sending fails, the API call still succeeds
- Notifications are created even if email delivery fails
- Failed email attempts are logged for debugging

Example error handling in API endpoints:
```typescript
try {
  await sendNotification(...);
} catch (error) {
  console.error("[API] Failed to send notification:", error);
  // Don't fail the API call - invitation/assignment/upload still succeeded
}
```

## Future Enhancements

### Phase 3 Recommendations:
1. **Real-Time Notifications** - WebSocket integration for instant delivery
2. **Push Notifications** - Browser push and mobile app notifications
3. **Notification Digest** - Daily/weekly digest emails
4. **Notification Center UI** - Build dashboard components for notification management
5. **Notification History** - Archive and search past notifications
6. **Notification Rules** - Advanced filtering and custom rules
7. **Team Notification Settings** - Admin control over team-wide notification policies
8. **Read Receipts** - See who has read shared documents or messages

## Testing

### Manual Testing Checklist

1. **Team Invitations:**
   - [ ] Send team invitation
   - [ ] Verify in-app notification created
   - [ ] Verify email sent (check Resend logs)
   - [ ] Verify notification preferences respected
   - [ ] Test with emailTeamInvitations disabled

2. **Task Assignments:**
   - [ ] Assign task to team member
   - [ ] Verify in-app notification
   - [ ] Verify email sent
   - [ ] Verify link in email works
   - [ ] Test with different notification preferences

3. **Document Uploads:**
   - [ ] Upload document to workspace
   - [ ] Verify notifications sent to team members (excluding uploader)
   - [ ] Test with emailDocumentUploads disabled

4. **Preferences:**
   - [ ] Update notification preferences
   - [ ] Verify new preferences take effect
   - [ ] Test reset to defaults
   - [ ] Test mute all notifications

### Database Verification

```sql
-- Check notifications created
SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 10;

-- Check user preferences
SELECT * FROM "NotificationPreference" WHERE "userId" = 'user_id';

-- Count notifications by type
SELECT "type", COUNT(*) FROM "Notification" GROUP BY "type";
```

## File Structure

```
lib/
├── emailService.ts          # Resend email integration
├── emailTemplates.ts        # HTML email templates
└── notificationService.ts   # Notification business logic

app/api/
├── notifications/
│   ├── route.ts            # GET/PATCH notifications
│   ├── [id]/
│   │   └── route.ts        # GET/DELETE single notification
│   └── preferences/
│       └── route.ts        # GET/PATCH/POST preferences
├── teams/[id]/invitations/
│   └── route.ts            # Updated to send notifications
├── tasks/[id]/assignments/
│   └── route.ts            # Updated to send notifications
└── teams/[id]/workspace/documents/
    └── route.ts            # Updated to send notifications

prisma/
└── schema.prisma           # Added Notification & NotificationPreference models
```

## Summary

The Notifications System provides a robust, scalable foundation for team collaboration notifications. It respects user preferences, includes multiple delivery channels, and gracefully handles failures without blocking core functionality.

### Key Benefits:
- ✅ **User Control** - Granular preference management
- ✅ **Reliability** - Non-blocking architecture
- ✅ **Scalability** - Database-backed notifications with pagination
- ✅ **Flexibility** - Multiple notification types and channels
- ✅ **Integration** - Seamlessly integrated into existing APIs
- ✅ **Professional** - Beautiful HTML email templates

Next Steps:
1. Build UI components for notification center
2. Implement preference management UI
3. Add WebSocket support for real-time notifications (Phase 3)
4. Set up notification digest jobs
