# TaskMaster - Quick Start Guide

Get up and running with TaskMaster in 5 minutes!

## 1. Start the Application

```bash
cd "task-manager-ai"
npm install  # Only needed first time
npm run dev
```

Open your browser to `http://localhost:3000`

## 2. Create Your First Project

1. Click **"New Project"** button (gray button in top right)
2. Enter a project name (e.g., "Work", "Personal", "Learning")
3. Add a description (optional)
4. Choose a color for the project
5. Click **"Create Project"**

## 3. Create Your First Task

1. Click **"New Task"** button (blue button in top right)
2. Fill in the following:
   - **Task Title** (required): What needs to be done?
   - **Description** (optional): More details about the task
   - **Project**: Select the project you just created
   - **Priority**: Choose one of the 4 quadrants:
     - Urgent & Important - Do these first
     - Not Urgent & Important - Schedule these
     - Urgent & Not Important - Delegate if possible
     - Not Urgent & Not Important - Eliminate/skip
   - **Deadline** (optional): When is it due?
   - **Time** (optional): What time is it due?
3. Click **"Add Task"**

## 4. View Your Tasks

Your tasks will appear in the **Eisenhower Matrix** on the dashboard:
- Each colored quadrant represents a priority level
- Tasks are organized automatically by priority
- You'll see task counts for each quadrant

## 5. Manage Your Tasks

### Complete a Task
- Click the ☑️ checkbox on a task
- It will turn gray and move out of active view

### Edit a Task
- Click the ✏️ edit icon on a task
- Update any field
- Click "Update Task"

### Delete a Task
- Click the 🗑️ delete icon on a task
- Confirm the deletion

## Navigation

- **Dashboard** - See all tasks in the Eisenhower Matrix
- **Tasks** - View all pending tasks in a list
- **Projects** - Manage and view all your projects
- **Project Tags** - Quick filter to see tasks by project

## Pro Tips

1. **Focus on Quadrant I & II** - These are where your real priorities should live
2. **Set Realistic Deadlines** - Be honest about when things need to be done
3. **Review Daily** - Check your dashboard each morning
4. **Color Code Wisely** - Use colors to visually group related project types
5. **Archive Old Projects** - Delete completed projects to keep things clean

## Key Concepts

### The Eisenhower Matrix
Named after President Dwight D. Eisenhower, this time management tool divides tasks into 4 categories:

| | Important | Not Important |
|---|-----------|--|
| **Urgent** | Do First (Q1) | Delegate (Q3) |
| **Not Urgent** | Schedule (Q2) | Eliminate (Q4) |

### Local Storage
Your data is saved in your browser's local storage, so:
- Your tasks persist between browser sessions
- Data is private and stays on your device
- If you clear browser data, your tasks will be deleted
- Back up important data to another system if needed

## Troubleshooting

**Tasks not showing up?**
- Make sure you selected a project when creating the task
- Refresh the page (Ctrl+R)

**Data disappeared?**
- Check if you cleared your browser's local storage
- Try a different browser to see if data appears there

**Form won't submit?**
- Make sure the task title is filled in
- Make sure you selected a project
- Check that the date format is valid

**App not starting?**
- Make sure Node.js 18+ is installed
- Try: `npm install && npm run dev`
- Check that nothing is running on port 3000

## Next Steps

- Explore the **Projects** view to manage all your work
- Check the **Tasks** view for a simple list of everything
- Read the full README.md for advanced features
- Customize the colors and project names to match your workflow

## That's It!

You now have a professional task management system. The key to productivity is using it consistently - check your dashboard daily and keep your tasks updated.

**Good luck! 🚀**
