# TaskMaster - Getting Started Guide

Welcome to TaskMaster! This guide will get you up and running in minutes.

## Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed ([Download](https://nodejs.org/))
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A terminal/command prompt
- Basic familiarity with the command line

### Check Your Node.js Version

```bash
node --version
npm --version
```

Both should show recent versions (node v18+, npm v9+).

## Installation (First Time Only)

### Step 1: Navigate to Project Directory

Open your terminal/command prompt and run:

```bash
cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai"
```

Or on Mac/Linux:
```bash
cd ~/Downloads/"Claude Code Coursera lesson"/task-manager-ai
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages. Takes about 1-2 minutes.

You should see output like:
```
added 376 packages in 41s
```

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
- Environments: .env.local
```

### Step 4: Open in Browser

Navigate to **http://localhost:3000** in your web browser.

You should see the TaskMaster dashboard with an empty Eisenhower Matrix.

## First Time Setup (5 Minutes)

### 1. Create Your First Project

1. Click the **"New Project"** button (gray button, top right)
2. Fill in the form:
   - **Project Name**: Enter something like "Personal" or "Work"
   - **Description**: Optional, e.g., "All personal tasks"
   - **Color**: Choose a color (e.g., Blue)
3. Click **"Create Project"**
4. You'll see it appears in the Projects view

### 2. Create Your First Task

1. Click the **"New Task"** button (blue button, top right)
2. Fill in the form:
   - **Task Title** (required): e.g., "Learn Next.js"
   - **Description** (optional): e.g., "Complete the tutorial"
   - **Project**: Select the project you just created
   - **Priority**: Choose one:
     - "Urgent & Important" = Do first (Red)
     - "Not Urgent & Important" = Schedule (Blue)
     - "Urgent & Not Important" = Delegate (Yellow)
     - "Not Urgent & Not Important" = Eliminate (Gray)
   - **Deadline** (optional): Pick a date
   - **Time** (optional): Pick a time
3. Click **"Add Task"**
4. Your task appears in the Eisenhower Matrix

### 3. Explore the Interface

- **Dashboard Tab** - See your Eisenhower Matrix
- **Tasks Tab** - See all your pending tasks in a list
- **Projects Tab** - Manage all your projects
- **Project Color Tags** - Quick navigation to specific projects

## Daily Usage

### Morning Routine (5 minutes)

1. Open `http://localhost:3000`
2. Check the Eisenhower Matrix
3. Focus on Quadrant I (Urgent & Important) tasks first
4. Add new tasks as they come up
5. Update task status as you work

### Using the Matrix

**Quadrant I (Red) - Do First**
- Urgent & Important
- Crisis management
- Deadlines tomorrow
- These need your attention NOW

**Quadrant II (Blue) - Schedule**
- Important but not urgent
- Strategic projects
- Personal development
- Schedule regular time for these

**Quadrant III (Yellow) - Delegate**
- Urgent but not important
- Interruptions
- Other people's priorities
- Delegate or decline these

**Quadrant IV (Gray) - Eliminate**
- Not urgent & not important
- Time wasters
- Busy work
- Minimize or eliminate these

## Common Tasks

### Mark a Task Complete
- Click the checkbox ☑️ next to the task
- Task disappears from active view
- Completion count increases

### Edit a Task
- Click the pencil ✏️ icon on a task
- Update any field
- Click "Update Task"
- Task moves to new quadrant if priority changed

### Delete a Task
- Click the trash 🗑️ icon on a task
- Confirm deletion
- Task is permanently removed

### View Project Tasks
- Click a project name in the navigation tabs, OR
- Go to Projects view and click "View Tasks"
- See all tasks in that project

### Edit a Project
- Go to Projects view
- Click the pencil ✏️ icon on a project
- Update name, description, or color
- Click "Update Project"

### Delete a Project
- Go to Projects view
- Click the trash 🗑️ icon on a project
- Confirm deletion
- **Note**: Tasks in the project are NOT deleted

## Tips for Success

### 1. Be Realistic with Priorities
Don't put everything in Quadrant I. Distinguish between:
- What's truly urgent (due today/tomorrow)
- What's important (matters long-term)

### 2. Use Quadrant II Strategically
These are your growth tasks:
- Learning and development
- Health and fitness
- Relationship building
- Long-term projects

Schedule specific time blocks for Quadrant II work.

### 3. Review Regularly
- **Daily**: Check your matrix each morning
- **Weekly**: 30-minute review of all tasks
- **Monthly**: Reflect on priorities and projects

### 4. Keep It Clean
- Delete completed projects to avoid clutter
- Archive old tasks
- Update task status as you work

### 5. Be Honest About Deadlines
Setting realistic deadlines:
- Don't be overly optimistic
- Factor in interruptions
- Add buffer time
- Update deadlines when needed

## Keyboard Shortcuts

Currently none implemented, but these are great candidates for future versions:
- `N` - New task
- `P` - New project
- `D` - Go to dashboard
- `/` - Search tasks
- `Esc` - Close modals

## Data Location

Your data is stored in your browser's local storage:

**To view your data:**
1. Open Developer Tools (F12)
2. Go to Application tab
3. Click Local Storage
4. Look for `taskmaster_projects` and `taskmaster_tasks`
5. You'll see your data in JSON format

**To backup your data:**
1. View your data in local storage (steps above)
2. Copy the JSON data
3. Paste into a text file
4. Save somewhere safe

## Troubleshooting

### "Application won't start"

**Error: Port 3000 is already in use**
- Close other Next.js apps
- Or use a different port: `npm run dev -- -p 3001`

**Error: Module not found**
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`

### "Tasks disappeared"

**Cause**: Browser local storage was cleared

**Prevention:**
- Don't clear browser data
- Backup important tasks
- Export data regularly (via local storage)

### "Form won't submit"

**Task form issues:**
- Task title is required - fill it in
- Project is required - select one
- Check for date format errors

**Project form issues:**
- Project name is required - fill it in
- Try refreshing the page

### "Data not saving"

**Check:**
1. Refresh the page - is data still there?
2. Check browser console (F12) for errors
3. Try a different browser
4. Ensure local storage is enabled

### "UI looks broken"

**Solution:**
1. Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear Next.js cache: `rm -rf .next`
3. Rebuild: `npm run build`

## Stopping the Server

To stop the development server:
- Press `Ctrl+C` in your terminal
- Close the terminal window

To restart:
- Run `npm run dev` again

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates optimized production files in the `.next` folder.

### Test Production Build Locally

```bash
npm run start
```

Then visit `http://localhost:3000` to test.

### Deploy to Vercel (Recommended)

Vercel is the platform made by the creators of Next.js:

1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Import this project
4. Click "Deploy"
5. Your app is live!

### Deploy to Other Platforms

- **Netlify**: Same as Vercel, connect and deploy
- **Docker**: Create a Dockerfile and containerize
- **Traditional Server**: Build and deploy the `.next` folder
- **GitHub Pages**: Requires static export

## Getting Help

### Included Documentation

1. **README.md** - Full documentation
2. **QUICKSTART.md** - Quick start guide (this file is more detailed)
3. **TESTING_GUIDE.md** - Testing checklist
4. **ARCHITECTURE.md** - Technical details
5. **PROJECT_SUMMARY.md** - Project overview

### Browser DevTools

Press `F12` to open:
- **Console** - See errors and logs
- **Elements** - Inspect HTML structure
- **Network** - Check API calls (none in this app)
- **Application** - View local storage data

### Common Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Next Steps

1. **Use TaskMaster daily** - This is the best way to learn
2. **Read QUICKSTART.md** - For a quick overview
3. **Check TESTING_GUIDE.md** - To verify all features work
4. **Explore the code** - Learn from well-structured examples
5. **Customize** - Add your own features or styling

## Productivity Tips

### The Eisenhower Matrix is Most Effective When:

1. **You use it consistently** - Check daily, update regularly
2. **You're honest** - Don't move everything to Quadrant I
3. **You take action** - Actually do the Q1 and Q2 tasks
4. **You plan weekly** - Set aside time for reflection
5. **You delegate Q3** - Don't do urgent-but-not-important tasks yourself

### Sample Weekly Routine:

**Monday Morning** (5 min)
- Review upcoming deadlines
- Reprioritize as needed

**Daily** (2 min)
- Check dashboard
- Mark completed tasks
- Add new tasks as they arise

**Friday Afternoon** (30 min)
- Full review of all projects
- Plan next week
- Archive completed items

## Success Metrics

You're using TaskMaster successfully when:
- ✅ You check your dashboard daily
- ✅ Most of your time is in Q1 and Q2
- ✅ You rarely see Q4 tasks
- ✅ Deadlines are mostly realistic
- ✅ Task count stays manageable (< 30 active)

## One More Thing

Remember: **The tool doesn't matter—consistent use does.**

TaskMaster is here to help you organize your thoughts and priorities. But the real productivity comes from:
1. **Decision-making** - Correctly prioritizing
2. **Action** - Actually doing the work
3. **Reflection** - Learning and adjusting

Start small. Add a few tasks. Get comfortable. Then expand.

## Ready to Begin?

1. Open your terminal
2. Navigate to the project directory
3. Run `npm run dev`
4. Open `http://localhost:3000`
5. Create your first project and task

**That's it! You're now ready to manage your tasks like a pro.** 🚀

---

**Happy tasking!**

For more detailed information, refer to the other documentation files included in this project.
