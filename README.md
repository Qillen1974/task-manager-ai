# TaskMaster - Professional Task Management SaaS

A modern, professional task management web application built with **Next.js 14**, **TypeScript**, **PostgreSQL**, and **Tailwind CSS**. Prioritize your tasks using the Eisenhower Matrix methodology for maximum productivity.

🚀 **Now with Production-Ready Backend!** Database, Authentication, Subscription System, and Payment Ready.

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Frontend** | ✅ Complete | React components, Eisenhower Matrix, responsive UI |
| **Backend API** | ✅ Complete | RESTful API with JWT auth, project/task CRUD |
| **Database** | ✅ Complete | PostgreSQL schema with Prisma ORM |
| **Authentication** | ✅ Complete | Bcrypt hashing, JWT tokens, refresh tokens |
| **Subscription System** | ✅ Complete | FREE/PRO/ENTERPRISE plans with limits |
| **Security** | ✅ Complete | Password validation, CORS, SQL injection prevention |
| **Documentation** | ✅ Complete | Production setup, migration guides, deployment instructions |
| **Stripe Payment** | 🚧 Next Phase | Ready for integration |
| **Frontend API Integration** | 🚧 Next Phase | Ready to connect frontend to backend |

⚠️ **Current Status**: Backend infrastructure complete. Ready for frontend integration to API endpoints.

## Features

### Core Functionality
- ✅ **Create Projects** - Organize tasks into multiple projects
- ✅ **Create Tasks** - Add tasks with title, description, priority, and deadlines
- ✅ **Eisenhower Matrix** - Visualize tasks in 4 quadrants:
  - Quadrant I: Urgent & Important (Do First)
  - Quadrant II: Not Urgent & Important (Schedule)
  - Quadrant III: Urgent & Not Important (Delegate)
  - Quadrant IV: Not Urgent & Not Important (Eliminate)
- ✅ **Task Management** - Complete, edit, and delete tasks
- ✅ **Project Management** - Edit and delete projects with progress tracking
- ✅ **Deadline Tracking** - Set dates and times for task deadlines
- ✅ **Data Persistence** - All data saved to browser localStorage
- ✅ **Responsive Design** - Works beautifully on desktop and mobile
- ✅ **Form Validation** - Complete input validation with error messages

### User Interface
- Clean, modern design with professional color scheme
- Intuitive navigation system
- Real-time task counts and statistics
- Visual feedback for all user actions
- Project color coding for easy identification
- Progress bars for project completion tracking
- Overdue and soon deadline indicators

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + localStorage
- **Package Manager**: npm

## Project Structure

```
task-manager-ai/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main application page
│   ├── globals.css          # Global styles
│   └── fonts/               # System fonts
├── components/
│   ├── Navigation.tsx       # Top navigation bar
│   ├── TaskForm.tsx         # Task creation/editing form
│   ├── ProjectForm.tsx      # Project creation/editing form
│   ├── TaskCard.tsx         # Individual task display
│   └── EisenhowerMatrix.tsx # 4-quadrant matrix view
├── lib/
│   ├── types.ts             # TypeScript type definitions
│   ├── utils.ts             # Utility functions
│   └── useLocalStorage.ts   # Custom localStorage hook
├── public/                  # Static assets
└── package.json             # Dependencies
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

1. **Navigate to project directory**
   ```bash
   cd "task-manager-ai"
   ```

2. **Install dependencies** (if not already installed)
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The application will automatically reload on code changes

## Usage Guide

### Getting Started

1. **Create Your First Project**
   - Click "New Project" button in the Dashboard
   - Enter project name and optional description
   - Choose a color for easy identification
   - Click "Create Project"

2. **Create Your First Task**
   - Click "New Task" button
   - Fill in the task title (required)
   - Add description (optional)
   - Select the project
   - Choose priority level (4 quadrants)
   - Set deadline date and time (optional)
   - Click "Add Task"

### Dashboard View

The dashboard displays the Eisenhower Matrix with 4 quadrants:

- **Quadrant I (Red)**: Urgent & Important
  - High-priority tasks that need immediate attention
  - Your focus area - handle these first

- **Quadrant II (Blue)**: Not Urgent & Important
  - Strategic tasks for long-term growth
  - Schedule time for these regularly

- **Quadrant III (Yellow)**: Urgent & Not Important
  - Interruptions and urgent but low-value tasks
  - Consider delegating these

- **Quadrant IV (Gray)**: Not Urgent & Not Important
  - Time-wasting activities
  - Minimize or eliminate these

### Navigation

- **Dashboard** - View Eisenhower Matrix with all tasks
- **Tasks** - See all pending tasks in a list view
- **Projects** - Manage all your projects
- **Project Tabs** - Quick access to individual projects

### Task Management

**Mark as Complete**
- Click the checkbox next to a task to toggle completion status
- Completed tasks appear grayed out

**Edit Task**
- Click the edit icon (pencil) on a task card
- Update any field and click "Update Task"

**Delete Task**
- Click the delete icon (trash) on a task card
- Confirm the deletion in the popup

### Project Management

**View Project Tasks**
- Click a project card's "View Tasks" button
- Or click the project name in the navigation tabs

**Edit Project**
- Click the edit icon on a project card
- Update name, description, or color
- Click "Update Project"

**Delete Project**
- Click the delete icon on a project card
- Note: Tasks in the project are not deleted
- Confirm the deletion in the popup

### Deadline Management

- Set deadline dates using the date picker
- Optionally add specific times
- Tasks with deadlines within 3 days show a "Soon" badge in yellow
- Overdue tasks show an "Overdue" badge in red
- Dates display in MM/DD/YYYY format

## Key Features Explained

### Eisenhower Matrix
The Eisenhower Matrix (also called Priority Matrix) helps you organize tasks based on two dimensions:

1. **Urgency**: How soon does this need to be done?
2. **Importance**: How much does this matter to your goals?

This framework was popularized by Stephen Covey and helps reduce stress by ensuring you work on what truly matters.

### Form Validation
- Task title is required
- Project selection is required
- Date format validation for deadline
- Real-time error messages

### Data Persistence
All data is saved to browser localStorage under these keys:
- `taskmaster_projects` - Project list
- `taskmaster_tasks` - Task list

Data persists across browser sessions until you clear local storage.

### Responsive Design
- Mobile-optimized navigation
- Flexible grid layouts
- Touch-friendly buttons
- Works on all screen sizes

## Building for Production

To create an optimized production build:

```bash
npm run build
```

This generates a `.next` folder with optimized static and dynamic assets.

To test the production build locally:

```bash
npm run build
npm run start
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers with ES2020 support.

## Tips for Productivity

1. **Use the Matrix Daily**: Check your dashboard each morning
2. **Schedule Q2 Time**: Block calendar time for important but not urgent tasks
3. **Delegate Q3**: Identify urgent-but-not-important tasks to delegate
4. **Review Weekly**: Spend 30 minutes reviewing and planning

5. **Set Real Deadlines**: Use realistic dates, not wishful thinking
6. **Color Code Projects**: Use colors to quickly visually scan projects
7. **Archive Completed Projects**: Delete old projects to keep dashboard clean

## Troubleshooting

### Application not starting?
- Make sure Node.js 18+ is installed
- Delete `node_modules` folder and run `npm install` again
- Check that port 3000 is not in use

### Data not persisting?
- Check browser's localStorage settings
- Try clearing browser cache
- Ensure cookies/storage are enabled
- Try a different browser to isolate the issue

### Form not submitting?
- Check browser console for errors (F12)
- Verify all required fields are filled
- Try refreshing the page
- Clear browser cache

### UI looks broken?
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`

## Performance Optimization

The application is optimized with:
- React Server Components (where applicable)
- Memoization for expensive calculations
- Efficient re-renders using useMemo
- Lightweight CSS with Tailwind
- Production-optimized build (93 kB initial load)

## Future Enhancement Ideas

- User authentication and cloud sync
- Task categories and tags
- Recurring tasks
- Task dependencies
- Calendar view integration
- Export to PDF or CSV
- Dark mode toggle
- Keyboard shortcuts
- Mobile app version
- Team collaboration features
- Integration with Google Calendar

## License

MIT License - Feel free to use this code for personal or commercial projects.

---

**Happy Task Managing! 🚀**

Remember: The key to productivity is not doing more, but doing what matters most.
