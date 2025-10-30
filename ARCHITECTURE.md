# TaskMaster - Architecture & Implementation Details

This document provides technical details about the application architecture, design decisions, and implementation patterns.

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App                        │
├─────────────────────────────────────────────────────────┤
│  app/page.tsx (Main Application)                         │
│    ├─ Navigation Component                               │
│    ├─ View Controllers (Dashboard/Tasks/Projects)        │
│    ├─ Modal Forms (TaskForm/ProjectForm)                │
│    └─ State Management (useState + useLocalStorage)      │
├─────────────────────────────────────────────────────────┤
│  Components/                                             │
│    ├─ Navigation.tsx                                     │
│    ├─ TaskCard.tsx                                       │
│    ├─ TaskForm.tsx                                       │
│    ├─ ProjectForm.tsx                                    │
│    └─ EisenhowerMatrix.tsx                               │
├─────────────────────────────────────────────────────────┤
│  lib/                                                    │
│    ├─ types.ts (TypeScript Interfaces)                  │
│    ├─ utils.ts (Utility Functions)                      │
│    └─ useLocalStorage.ts (Custom Hook)                  │
├─────────────────────────────────────────────────────────┤
│  Browser API                                             │
│    ├─ localStorage (Data Persistence)                    │
│    └─ Date API (Deadline Management)                     │
└─────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Component-Based Architecture

Each component is focused and reusable:

**Navigation.tsx**
- Stateless presentation component
- Receives data and callbacks as props
- Handles navigation state through callbacks

**TaskCard.tsx**
- Reusable task display component
- Shows task details with visual indicators
- Provides action buttons (edit, delete, complete)
- Adapts display based on completion status

**EisenhowerMatrix.tsx**
- Organizes tasks into 4 quadrants
- Filters tasks by priority
- Uses TaskCard components for rendering
- Displays empty states

**TaskForm.tsx / ProjectForm.tsx**
- Modal forms with form validation
- Handles both create and update scenarios
- Provides error feedback
- Closes modal on success

### 2. State Management

The app uses React hooks for state management:

```typescript
// Main state
const [projects, setProjects] = useLocalStorage<Project[]>("taskmaster_projects", []);
const [tasks, setTasks] = useLocalStorage<Task[]>("taskmaster_tasks", []);

// UI state
const [activeView, setActiveView] = useState<string>("dashboard");
const [showTaskForm, setShowTaskForm] = useState(false);
const [editingTask, setEditingTask] = useState<Task | undefined>();
```

**Why not Redux/Context?**
- Application is relatively simple
- Direct state management is sufficient
- Reduces bundle size
- Easier to understand and maintain

### 3. Custom localStorage Hook

```typescript
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Manages client-side hydration
  // Handles localStorage read/write
  // Provides fallback to initialValue
  // Returns [storedValue, setValue]
}
```

**Benefits:**
- Automatic serialization/deserialization
- Handles hydration issues in Next.js
- Provides type safety with generics
- Error handling built-in

### 4. Type Safety

All entities are strongly typed:

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority: Priority; // Union type with 4 options
  deadline?: string;  // ISO date string
  deadlineTime?: string; // HH:MM format
  completed: boolean;
  createdAt: string;  // ISO timestamp
  updatedAt: string;  // ISO timestamp
}

type Priority =
  | "urgent-important"
  | "not-urgent-important"
  | "urgent-not-important"
  | "not-urgent-not-important";
```

### 5. Utility Functions

Located in `lib/utils.ts`:

**Priority Management**
- `getPriorityLabel()` - Display-friendly priority names
- `getPriorityColor()` - Tailwind CSS color classes
- `getPriorityBadgeColor()` - Badge styling
- `getPriorityQuadrant()` - Quadrant labeling

**Deadline Management**
- `isDeadlineSoon()` - Checks if within 3 days
- `isOverdue()` - Checks if past deadline
- `formatDate()` - Format date for display
- `formatDateTime()` - Format date and time together

**Data Operations**
- `filterTasksByPriority()` - Filter tasks by quadrant
- `getTasksByProject()` - Filter tasks by project
- `getCompletedTaskCount()` - Calculate completion stats
- `getPendingTaskCount()` - Calculate pending stats

**ID Generation**
- `generateId()` - Creates unique IDs using timestamp + random

## Data Flow

### Creating a Task

```
User clicks "New Task"
  ↓
setShowTaskForm(true)
  ↓
TaskForm opens with projects list
  ↓
User fills form and submits
  ↓
handleAddTask() called
  ↓
Task object created with:
  - Unique ID
  - Current timestamp (createdAt)
  - All form data
  - completed: false
  ↓
setTasks([...tasks, newTask])
  ↓
useLocalStorage updates browser localStorage
  ↓
Component re-renders
  ↓
Task appears in correct quadrant
```

### Completing a Task

```
User clicks checkbox on task
  ↓
handleCompleteTask(taskId)
  ↓
Map over tasks and toggle completed
  ↓
Update updatedAt timestamp
  ↓
setTasks() triggers re-render
  ↓
Component filters out completed tasks
  ↓
Task disappears from active view
  ↓
Completion count increases
```

### Editing a Task

```
User clicks edit icon
  ↓
setEditingTask(task)
setShowTaskForm(true)
  ↓
TaskForm opens with pre-filled data
  ↓
User modifies form and clicks "Update Task"
  ↓
handleUpdateTask() called
  ↓
Map over tasks and replace matching ID
  ↓
updateTask with new data + new updatedAt timestamp
  ↓
setTasks() triggers re-render
  ↓
Task updates in UI (potentially moves to new quadrant)
```

## Performance Optimizations

### 1. Memoization

```typescript
const projectsMap = useMemo(() => {
  const map = new Map<string, Project>();
  projects.forEach((p) => map.set(p.id, p));
  return map;
}, [projects]);
```

**Why:** Project lookups are O(1) instead of O(n)

### 2. Computed Values

```typescript
const pendingTaskCount = useMemo(() => getPendingTaskCount(tasks), [tasks]);

const filteredTasks = useMemo(() => {
  // Complex filtering logic only runs when dependencies change
  return tasks.filter(/* ... */);
}, [activeView, tasks]);
```

**Why:** Prevent unnecessary recalculations

### 3. Component Composition

- Small, focused components
- Each component handles one concern
- Easy to memoize with React.memo if needed
- Reduces re-render scope

## Styling Strategy

### Tailwind CSS

**Utility-First Approach:**
- All styling is inline with Tailwind classes
- Custom CSS is minimal (only globals.css)
- No CSS modules needed
- Smaller final bundle

**Color System:**
- Primary: Blue (actions, focus states)
- Quadrant I: Red (urgent-important)
- Quadrant II: Blue (not-urgent-important)
- Quadrant III: Yellow (urgent-not-important)
- Quadrant IV: Gray (not-urgent-not-important)
- Project colors: 8 different hues

**Responsive Design:**
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Navigation adapts at `md:` breakpoint
- Grid layouts use responsive columns

## Form Validation Strategy

### Client-Side Validation

**Location:** Inside form components (TaskForm.tsx, ProjectForm.tsx)

**Pattern:**
```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  // Required field validation
  if (!title.trim()) {
    newErrors.title = "Task title is required";
  }

  // Format validation
  if (deadline && !isValidDate(deadline)) {
    newErrors.deadline = "Invalid date format";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Benefits:**
- Instant user feedback
- Prevents invalid data submission
- Good UX (no page reload)
- Reduced server load (N/A since no server)

### Validation Types

1. **Required Fields**
   - Task title
   - Project selection
   - Project name

2. **Format Validation**
   - Date format (via HTML5 date input)
   - Time format (regex: HH:MM)

3. **Logical Validation**
   - N/A (could add: no duplicate task titles, etc.)

## Browser Storage Strategy

### localStorage Implementation

**Storage Keys:**
- `taskmaster_projects` - Array of Project objects
- `taskmaster_tasks` - Array of Task objects

**Data Format:**
- JSON serialized
- UTF-16 encoding
- ~5-10MB limit per domain

**Synchronization:**
- Writes are synchronous (not async)
- Data persists across browser sessions
- No cloud sync
- No conflict resolution needed (single user)

### Hydration Handling

```typescript
const [storedValue, setStoredValue] = useState<T>(initialValue);
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
  // Read from localStorage only on client
  const item = window.localStorage.getItem(key);
  if (item) {
    setStoredValue(JSON.parse(item));
  }
}, [key]);
```

**Why:** Prevents Next.js hydration mismatches

## View Architecture

### Dashboard View
- Displays Eisenhower Matrix
- 4 quadrants based on priority
- Shows statistics
- Entry point for most users

### All Tasks View
- List view of all pending tasks
- Filterable by project
- Shows task count badge
- Good for quick reviews

### Projects View
- Card-based layout
- Shows project progress
- Quick access to project details
- Allows project CRUD operations

### Individual Project View
- Tasks specific to a project
- Linear list layout
- Project metadata display
- Filtered task management

## Error Handling

### Application Errors
- Try/catch blocks in localStorage hook
- Console error logging
- Graceful fallbacks to initialValue
- No error boundary (could be added)

### User Errors
- Form validation with error messages
- Confirmation dialogs for destructive actions
- Empty state messages
- Clear visual feedback

### Edge Cases Handled
- Empty projects list
- Empty tasks list
- No deadline set
- No description provided
- Editing same values
- Rapid form submissions

## Testing Considerations

### Unit Test Candidates
- `utils.ts` functions (pure functions)
- `useLocalStorage` hook
- Priority categorization logic
- Date comparison logic
- Filter functions

### Integration Test Candidates
- Task creation flow
- Task editing flow
- Project management
- Data persistence
- View switching

### E2E Test Candidates
- Complete user workflow
- Cross-browser functionality
- localStorage functionality
- Form validation

## Extensibility Points

### Easy to Add
1. **Additional Priority Levels** - Modify Priority type, add colors in utils
2. **More Task Fields** - Add to Task interface, update forms
3. **Task Categories/Tags** - Add to Task interface
4. **Search/Filter** - Add filtering logic in utils
5. **Dark Mode** - Add CSS variables and toggle

### Moderate Effort
1. **Cloud Sync** - Replace localStorage with API calls
2. **Multi-User** - Add authentication and user ID to storage keys
3. **Export/Import** - Add JSON download functionality
4. **Calendar View** - New component to render calendar grid
5. **Recurring Tasks** - Add recurrence data and logic

### Large Effort
1. **Mobile App** - React Native rewrite
2. **Collaboration** - WebSocket real-time sync
3. **Advanced Analytics** - Time tracking, reports
4. **AI Integration** - Task suggestions, priority recommendations

## Bundle Size

**Current Breakdown:**
- Main JS: ~93 kB initial load
- CSS: Included in main
- Fonts: System fonts (no extra downloads)
- No external UI libraries
- No CSS-in-JS overhead

**Optimizations Applied:**
- Code splitting (automatic with Next.js)
- Tree shaking (unused code removed)
- Minification (production build)
- Image optimization (none needed - no images)

## Browser Compatibility

**Supported:**
- ES2020+ syntax
- localStorage API
- Fetch API (not used)
- Date API
- Modern CSS (Grid, Flexbox)

**Tested On:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Not Supported:**
- IE 11 (uses ES5, no async/await)
- Old mobile browsers without Web Storage

## Security Considerations

**Current Limitations:**
- Data stored in plaintext in localStorage
- No authentication
- No authorization
- No HTTPS (matters if deployed)
- No input sanitization (XSS risk if user adds malicious HTML)

**Recommendations for Production:**
1. Add input sanitization/DOMPurify
2. Implement user authentication
3. Move to server-side storage
4. Use HTTPS
5. Add encryption for sensitive data
6. Implement proper access controls
7. Add audit logging

## Monitoring & Debugging

### Developer Tools
- Chrome DevTools for React debugging
- localStorage viewer in Application tab
- Console for error messages
- Network tab (should be empty - no API calls)

### Logging
- Console.error in error handlers
- No remote logging (local only)

### Performance Monitoring
- React DevTools Profiler for render times
- No built-in performance tracking

## Future Roadmap

**Version 2.0 Ideas:**
- Cloud synchronization
- Team collaboration
- Recurring tasks
- Task dependencies
- Advanced filtering
- Custom themes
- Keyboard shortcuts
- Dark mode
- Mobile app

**Version 3.0 Ideas:**
- AI-powered task suggestions
- Integration with calendar
- Time tracking
- Advanced analytics
- Custom workflows
- Team management
- API for extensions

---

**This architecture is designed to be simple, maintainable, and extensible while providing all core functionality for personal task management.**
