# TaskMaster - Testing Guide

Complete testing checklist to verify all features are working correctly.

## Getting Started

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000` in your browser
3. Open Developer Tools (F12) and go to Application > Local Storage to monitor data changes

## Feature Testing Checklist

### Project Management

#### Create Projects
- [ ] Click "New Project" button
- [ ] Enter project name (e.g., "Work")
- [ ] Enter description (e.g., "All work-related tasks")
- [ ] Select a color (e.g., Blue)
- [ ] Click "Create Project"
- [ ] Verify project appears in Projects view
- [ ] Verify project appears in navigation tabs

#### Edit Projects
- [ ] Click the pencil icon on a project card
- [ ] Change the project name
- [ ] Change the description
- [ ] Change the color
- [ ] Click "Update Project"
- [ ] Verify changes appear immediately

#### Delete Projects
- [ ] Click the trash icon on a project card
- [ ] Confirm the deletion
- [ ] Verify project is removed from view
- [ ] **Note**: Associated tasks are NOT deleted (this is correct behavior)

#### Project Statistics
- [ ] Create a project with tasks
- [ ] Verify task count shows correctly
- [ ] Verify completion count shows correctly
- [ ] Verify progress bar fills based on completion percentage

### Task Management

#### Create Tasks
- [ ] Click "New Task" button
- [ ] Enter task title (required field): "Write report"
- [ ] Enter description (optional): "Q1 financial report"
- [ ] Select project from dropdown
- [ ] Select priority from 4 options
- [ ] Set deadline date (optional)
- [ ] Set deadline time (optional)
- [ ] Click "Add Task"
- [ ] Verify task appears in correct quadrant in dashboard

#### View Tasks in Different Views
- [ ] Dashboard view shows Eisenhower Matrix
- [ ] All Tasks view shows all pending tasks in a list
- [ ] Projects view shows all projects with task cards
- [ ] Individual project view shows only that project's tasks

#### Task Card Display
- [ ] Task title displays correctly
- [ ] Task description displays correctly (if provided)
- [ ] Priority badge shows correct quadrant label
- [ ] Project badge shows on applicable views
- [ ] Deadline shows in correct format (e.g., "Oct 28, 2025")
- [ ] "Soon" badge appears for deadlines within 3 days (yellow)
- [ ] "Overdue" badge appears for past deadlines (red)
- [ ] Completed tasks appear grayed out with line-through

#### Edit Tasks
- [ ] Click edit icon (pencil) on a task
- [ ] Modify task title
- [ ] Modify task description
- [ ] Change priority level
- [ ] Change deadline
- [ ] Click "Update Task"
- [ ] Verify task moves to new quadrant if priority changed
- [ ] Verify changes are reflected immediately

#### Complete Tasks
- [ ] Click checkbox on a task to mark complete
- [ ] Verify task is removed from active view (still shows in completed count)
- [ ] Click checkbox again to mark incomplete
- [ ] Verify task reappears in active view

#### Delete Tasks
- [ ] Click delete icon (trash) on a task
- [ ] Confirm deletion
- [ ] Verify task is removed immediately
- [ ] Verify task count decreases

### Dashboard Features

#### Eisenhower Matrix
- [ ] **Quadrant I (Red)**: "Urgent & Important"
  - [ ] Test with a task set to this priority
  - [ ] Verify task appears in correct quadrant

- [ ] **Quadrant II (Blue)**: "Not Urgent & Important"
  - [ ] Test with a task set to this priority
  - [ ] Verify task appears in correct quadrant

- [ ] **Quadrant III (Yellow)**: "Urgent & Not Important"
  - [ ] Test with a task set to this priority
  - [ ] Verify task appears in correct quadrant

- [ ] **Quadrant IV (Gray)**: "Not Urgent & Not Important"
  - [ ] Test with a task set to this priority
  - [ ] Verify task appears in correct quadrant

#### Statistics Section
- [ ] Total Tasks count is accurate
- [ ] Completed count is accurate
- [ ] Pending count is accurate
- [ ] Projects count is accurate
- [ ] Statistics update in real-time when tasks are added/completed

### Form Validation

#### Task Form Validation
- [ ] **Title field**:
  - [ ] Cannot submit without a title
  - [ ] Error message appears: "Task title is required"

- [ ] **Project field**:
  - [ ] Cannot submit without selecting a project
  - [ ] Error message appears: "Project is required"

- [ ] **Date field**:
  - [ ] Accepts valid dates
  - [ ] Rejects invalid dates

- [ ] **Time field**:
  - [ ] Accepts valid time format (HH:MM)
  - [ ] Rejects invalid time format

#### Project Form Validation
- [ ] **Name field**:
  - [ ] Cannot submit without a project name
  - [ ] Error message appears: "Project name is required"

- [ ] **Color selection**:
  - [ ] All 8 colors are selectable
  - [ ] Selected color is highlighted

### Deadline Features

#### Setting Deadlines
- [ ] Set a deadline for tomorrow
- [ ] Verify date displays correctly
- [ ] Verify "Soon" badge appears (within 3 days)
- [ ] Set a deadline for next month
- [ ] Verify no "Soon" badge appears

#### Overdue Deadlines
- [ ] Set a deadline for yesterday
- [ ] Verify "Overdue" badge appears in red
- [ ] Verify task is marked as urgent
- [ ] Edit the task to set a future deadline
- [ ] Verify "Overdue" badge is removed

### Navigation

#### View Switching
- [ ] Click "Dashboard" - matrix appears
- [ ] Click "Tasks" - list view appears
- [ ] Click "Projects" - project cards appear
- [ ] Click project name in tabs - single project view appears
- [ ] Verify active navigation is highlighted

#### Task Count Badge
- [ ] Verify pending task count shows in "Tasks" nav
- [ ] Count increases when new task is added
- [ ] Count decreases when task is completed
- [ ] Count goes to 0 when all tasks are completed

### Data Persistence

#### localStorage Testing
- [ ] Create a project
- [ ] Create several tasks
- [ ] Open browser DevTools (F12)
- [ ] Go to Application > Local Storage
- [ ] Verify `taskmaster_projects` key exists
- [ ] Verify `taskmaster_tasks` key exists
- [ ] Click "taskmaster_projects" and verify JSON contains your projects
- [ ] Click "taskmaster_tasks" and verify JSON contains your tasks

#### Session Persistence
- [ ] Create projects and tasks
- [ ] Refresh the page (Ctrl+R)
- [ ] Verify all data is still there
- [ ] Close the browser tab
- [ ] Open the browser again and navigate to localhost:3000
- [ ] Verify all data is still there

#### Data Modification
- [ ] Edit a task
- [ ] Check localStorage - verify data is updated
- [ ] Complete a task
- [ ] Check localStorage - verify `completed: true`
- [ ] Delete a task
- [ ] Check localStorage - verify task is removed

### Responsive Design

#### Desktop (1024px+)
- [ ] Navigation shows all items horizontally
- [ ] Matrix shows 2 quadrants per row
- [ ] Project cards show 3 per row
- [ ] All buttons are accessible
- [ ] Layout is clean and organized

#### Tablet (768px - 1023px)
- [ ] Navigation items stack properly
- [ ] Matrix shows 2 quadrants per row
- [ ] Project cards show 2 per row
- [ ] Forms are readable
- [ ] Touch targets are large enough

#### Mobile (< 768px)
- [ ] Navigation compresses to mobile menu (hamburger)
- [ ] Matrix shows 1 quadrant per row
- [ ] Project cards show 1 per row
- [ ] Forms are easy to fill on mobile
- [ ] All buttons are touch-friendly

### Browser Compatibility

- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Verify consistent behavior across browsers

### Error Handling

#### Empty States
- [ ] Dashboard with no tasks - quadrants show "No tasks in this quadrant"
- [ ] Projects view with no projects - shows "No projects yet" message
- [ ] Tasks view with no tasks - shows "No tasks yet" message
- [ ] Project view with no tasks - shows "No tasks in this project" message

#### Edge Cases
- [ ] Delete all tasks - verify quadrants show empty state
- [ ] Create task without optional fields - should work fine
- [ ] Edit task and keep all values same - should still update timestamp
- [ ] Create two tasks with same title - both should exist
- [ ] Create two projects with same name - both should exist

### Performance

- [ ] Page loads in under 2 seconds
- [ ] Adding a task is instantaneous
- [ ] Switching views is fast
- [ ] Scrolling is smooth
- [ ] No console errors (F12 > Console)

### UI/UX Features

#### Visual Feedback
- [ ] Hover effects on buttons work
- [ ] Hover effects on task cards work
- [ ] Focus states are visible (keyboard navigation)
- [ ] Completed tasks show visual distinction
- [ ] Active navigation shows blue highlight

#### Icons
- [ ] All icons display correctly
- [ ] Icons are intuitive (pencil = edit, trash = delete, etc.)
- [ ] Icons are properly sized
- [ ] Project color dots show correctly

#### Colors
- [ ] Red for Quadrant I
- [ ] Blue for Quadrant II
- [ ] Yellow for Quadrant III
- [ ] Gray for Quadrant IV
- [ ] Project colors match selection
- [ ] Overdue badges are red
- [ ] Soon badges are yellow
- [ ] Completed text is gray

## Test Scenarios

### Scenario 1: First-Time User
1. Open the app
2. See empty state
3. Click "New Project"
4. Create "Personal" project
5. Click "New Task"
6. Create "Learn Next.js" task - Quadrant II (Not Urgent, Important)
7. Create "Buy groceries" task - Quadrant III (Urgent, Not Important)
8. Create "Watch Netflix" task - Quadrant IV (Not Urgent, Not Important)
9. Verify all tasks appear in correct quadrants
10. Mark "Buy groceries" complete
11. Verify it disappears from active view

### Scenario 2: Project Manager
1. Create 3 projects: "Frontend", "Backend", "DevOps"
2. Create 10 tasks distributed across projects
3. Set various priorities and deadlines
4. Navigate to each project view
5. Verify only that project's tasks show
6. Edit a task and change its project
7. Verify it moves to new project
8. View statistics - all counts should be accurate

### Scenario 3: Deadline Management
1. Create task due tomorrow
2. Verify "Soon" badge appears
3. Edit to due 5 days from now
4. Verify "Soon" badge disappears
5. Create task with past deadline
6. Verify "Overdue" badge appears
7. Edit to future deadline
8. Verify "Overdue" badge disappears

### Scenario 4: Data Loss Prevention
1. Create several projects and tasks
2. Refresh browser
3. Verify all data intact
4. Open DevTools and view localStorage
5. Manually modify a task in localStorage (if comfortable)
6. Refresh page
7. Verify changes from localStorage appear
8. Close browser completely
9. Reopen browser and navigate to app
10. Verify all data is still there

## Known Limitations & Quirks

- Colors in project color picker may not render if not in Tailwind config (use basic Tailwind colors)
- localStorage has a ~5-10MB limit per domain
- No cloud backup - data is local only
- No user accounts or authentication
- No collaboration features

## Reporting Issues

If you find a bug:
1. Note the exact steps to reproduce
2. Check the browser console for errors (F12)
3. Try in a different browser
4. Clear localStorage and try again
5. Check that you're using a modern browser (Chrome 90+, Firefox 88+, etc.)

## Success Criteria

All items in the checklist should be ✓ checked for the application to be considered fully functional.

**Total Features to Test: 60+**
**Estimated Testing Time: 30-45 minutes**
