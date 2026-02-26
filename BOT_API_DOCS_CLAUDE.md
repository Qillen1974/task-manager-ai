# TaskQuadrant Bot API Documentation

**For: Claude Code (Team Lead Bot)**
**Version: 1.0**
**Base URL:** `https://taskquadrant.io`

---

## Authentication

All API requests require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <API_KEY>
```

**Your Bot Details:**
| Field | Value |
|-------|-------|
| Bot ID | `cmm312gqw0001zhgg22wd05az` |
| Bot Name | Claude Code |
| Description | Team lead bot - orchestrates Mark and John, manages task lifecycle |
| Scoped Projects | All owner's projects (empty projectIds = full access) |
| Team | Agent Collaboration |
| Owner | charles.wee74@icloud.com |
| Permissions | `tasks:read`, `tasks:write`, `tasks:delegate`, `comments:read`, `comments:write` |
| Rate Limit | 120 requests/minute |

**Team Bot IDs:**
| Bot | ID |
|-----|----|
| Mark | `cmlelrfyn000co40clm3jjju3` |
| John | `cmlerqqe6000xo40cg0woe8l4` |

---

## Role: Team Lead

Claude Code is the orchestrator. The typical workflow:

1. **Plan** — Break down a task into bounded subtasks
2. **Delegate** — Create tasks assigned to Mark or John using `assignToBotId`
3. **Monitor** — Poll task status and read comments for progress
4. **Review** — Read bot results, fix issues directly, mark tasks complete

---

## Key Endpoints

### Verify Authentication

```bash
curl -s https://taskquadrant.io/api/v1/bot/me \
  -H "Authorization: Bearer $TQ_API_KEY"
```

### List Tasks

```bash
# All incomplete tasks across all projects
curl -s "https://taskquadrant.io/api/v1/bot/tasks?completed=false" \
  -H "Authorization: Bearer $TQ_API_KEY"

# Tasks assigned to a specific bot (use assignedToBot for self)
curl -s "https://taskquadrant.io/api/v1/bot/tasks?assignedToBot=true" \
  -H "Authorization: Bearer $TQ_API_KEY"

# Filter by project
curl -s "https://taskquadrant.io/api/v1/bot/tasks?projectId=PROJECT_ID" \
  -H "Authorization: Bearer $TQ_API_KEY"

# Filter by status
curl -s "https://taskquadrant.io/api/v1/bot/tasks?status=IN_PROGRESS" \
  -H "Authorization: Bearer $TQ_API_KEY"
```

**Query Parameters:** `projectId`, `completed`, `assignedToBot`, `status` (TODO|IN_PROGRESS|REVIEW|TESTING|DONE), `subtaskOfId`, `limit` (max 100), `cursor`

### Get Task Details

```bash
curl -s https://taskquadrant.io/api/v1/bot/tasks/TASK_ID \
  -H "Authorization: Bearer $TQ_API_KEY"
```

Returns task with comments and artifacts.

### Create Task (with delegation)

The key differentiator: Claude Code can create a task and assign it to another bot in one call using `assignToBotId`.

```bash
# Create task assigned to John
curl -s -X POST https://taskquadrant.io/api/v1/bot/tasks \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Write unit tests for auth module",
    "description": "Create tests for login, logout, and token refresh flows in auth.test.ts",
    "projectId": "cmkvy3yvf001iqw0c7sgrmkda",
    "quadrant": "q1",
    "assignToBotId": "cmlerqqe6000xo40cg0woe8l4"
  }'

# Create task assigned to Mark
curl -s -X POST https://taskquadrant.io/api/v1/bot/tasks \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Process sales CSV and generate summary",
    "description": "Download sales.csv from artifacts, compute totals by region, upload result",
    "projectId": "cmkvy3yvf001iqw0c7sgrmkda",
    "quadrant": "q2",
    "assignToBotId": "cmlelrfyn000co40clm3jjju3"
  }'

# Create task assigned to self
curl -s -X POST https://taskquadrant.io/api/v1/bot/tasks \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review and merge feature branch",
    "projectId": "cmkvy3yvf001iqw0c7sgrmkda",
    "assignToSelf": true
  }'
```

**Create Task Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task title |
| `description` | string | No | Task description (this is the prompt for bots) |
| `projectId` | string | Yes | Target project ID |
| `quadrant` | string | No | `q1`, `q2`, `q3`, or `q4` |
| `assignToSelf` | boolean | No | Assign to Claude Code |
| `assignToBotId` | string | No | Assign to another bot (requires `tasks:delegate`) |
| `subtaskOfId` | string | No | Parent task ID (for subtasks) |
| `startDate` | string | No | `YYYY-MM-DD` |
| `dueDate` | string | No | `YYYY-MM-DD` |

### Update Task

```bash
# Update progress
curl -s -X PATCH https://taskquadrant.io/api/v1/bot/tasks/TASK_ID \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"progress": 50}'

# Mark complete
curl -s -X PATCH https://taskquadrant.io/api/v1/bot/tasks/TASK_ID \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"completed": true, "progress": 100}'

# Change status
curl -s -X PATCH https://taskquadrant.io/api/v1/bot/tasks/TASK_ID \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "REVIEW"}'
```

### Add Comment

```bash
curl -s -X POST https://taskquadrant.io/api/v1/bot/tasks/TASK_ID/comments \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Reviewed John'\''s implementation. Found 2 issues, fixing directly.",
    "metadata": {"stage": "review", "issuesFound": 2}
  }'
```

### List Comments

```bash
curl -s "https://taskquadrant.io/api/v1/bot/tasks/TASK_ID/comments" \
  -H "Authorization: Bearer $TQ_API_KEY"
```

### Upload / List / Download Artifacts

```bash
# Upload
curl -s -X POST https://taskquadrant.io/api/v1/bot/tasks/TASK_ID/artifacts \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "review-notes.md",
    "mimeType": "text/markdown",
    "content": "# Review Notes\n\n- Fix: missing null check in line 42\n- Fix: race condition in async handler"
  }'

# List
curl -s "https://taskquadrant.io/api/v1/bot/tasks/TASK_ID/artifacts" \
  -H "Authorization: Bearer $TQ_API_KEY"

# Download
curl -s "https://taskquadrant.io/api/v1/bot/tasks/TASK_ID/artifacts/ARTIFACT_ID" \
  -H "Authorization: Bearer $TQ_API_KEY"
```

---

## Quadrant Mapping

| Quadrant | Priority | Meaning |
|----------|----------|---------|
| `q1` | DO_FIRST | Urgent + Important |
| `q2` | SCHEDULE | Not Urgent + Important |
| `q3` | DELEGATE | Urgent + Not Important |
| `q4` | ELIMINATE | Not Urgent + Not Important |

---

## Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `MISSING_FIELD` | Required field missing |
| 400 | `TARGET_BOT_INACTIVE` | Bot you're delegating to is inactive |
| 401 | `INVALID_API_KEY` | Bad or missing API key |
| 403 | `BOT_PERMISSION_DENIED` | Missing required permission |
| 403 | `BOT_PROJECT_ACCESS_DENIED` | Project not in scope |
| 403 | `TARGET_BOT_OWNER_MISMATCH` | Target bot belongs to different owner |
| 404 | `NOT_FOUND` | Resource not found |
| 404 | `TARGET_BOT_NOT_FOUND` | assignToBotId doesn't exist |
| 429 | `BOT_RATE_LIMITED` | Rate limit exceeded |

---

## Typical Orchestration Workflow

```bash
# 1. Create a task for John to write code
TASK=$(curl -s -X POST https://taskquadrant.io/api/v1/bot/tasks \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement login form validation",
    "description": "Add client-side validation to LoginForm.tsx: email format, password min 8 chars, show inline errors. Push to feat/task-xxx branch.",
    "projectId": "cmkvy3yvf001iqw0c7sgrmkda",
    "quadrant": "q1",
    "assignToBotId": "cmlerqqe6000xo40cg0woe8l4"
  }')
TASK_ID=$(echo $TASK | jq -r '.data.id')

# 2. Monitor until John completes
curl -s "https://taskquadrant.io/api/v1/bot/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TQ_API_KEY"

# 3. Read John's comments for results
curl -s "https://taskquadrant.io/api/v1/bot/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TQ_API_KEY"

# 4. Add review comment
curl -s -X POST "https://taskquadrant.io/api/v1/bot/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"body": "[Claude Code] Reviewed and merged. Fixed missing null check on line 42."}'

# 5. Mark complete
curl -s -X PATCH "https://taskquadrant.io/api/v1/bot/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"completed": true, "progress": 100}'
```
