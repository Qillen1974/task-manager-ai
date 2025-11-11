import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const KNOWLEDGE_BASE_ARTICLES = [
  {
    category: "user-guide",
    title: "Getting Started with TaskQuadrant",
    content: `# Getting Started with TaskQuadrant

Welcome to TaskQuadrant! Here's how to get started:

## Creating Your First Project
1. Click "New Project" in the Projects section
2. Enter a project name and description
3. Choose a color for easy identification
4. Click Create

## Adding Tasks
1. Select a project
2. Click "Add Task"
3. Fill in the task details:
   - Title (required)
   - Description (optional)
   - Due date (optional)
   - Priority using Eisenhower Matrix
4. Click Create Task

## Using the Eisenhower Matrix
The Eisenhower Matrix helps you prioritize tasks:
- **Important & Urgent**: Critical tasks that need immediate attention
- **Important & Not Urgent**: Strategic tasks for long-term goals
- **Not Important & Urgent**: Delegate if possible
- **Not Important & Not Urgent**: Consider removing or scheduling later

## Tracking Progress
- Set task progress from 0-100%
- Mark tasks as complete
- View completion statistics in the dashboard`,
    keywords: "start, begin, first, new project, task, create",
    priority: 10,
    isActive: true,
  },
  {
    category: "faq",
    title: "How do I upgrade my subscription?",
    content: `# Upgrading Your Subscription

## Available Plans

### FREE Plan
- 3 projects
- 50 tasks
- Basic features
- Perfect for individuals starting out

### PRO Plan
- 5 projects
- Unlimited tasks
- Advanced features:
  - Recurring tasks
  - Subprojects
  - Task dependencies
  - Team collaboration (up to 5 members)

### ENTERPRISE Plan
- Unlimited projects
- Unlimited tasks
- All features included
- Dedicated support
- Custom integrations

## How to Upgrade
1. Click your profile menu
2. Select "Upgrade Plan"
3. Choose your desired plan
4. Enter payment information
5. Confirm upgrade

Your plan will be activated immediately after payment is processed.

## Can I downgrade?
Yes! You can downgrade at any time. Your current data will remain accessible for 30 days after downgrade.`,
    keywords: "upgrade, plan, subscription, pricing, pro, enterprise",
    priority: 8,
    isActive: true,
  },
  {
    category: "feature-doc",
    title: "Understanding Recurring Tasks",
    content: `# Recurring Tasks Feature

Recurring tasks automatically create new instances on a schedule. This feature is available on PRO and ENTERPRISE plans.

## Creating a Recurring Task

1. Create a new task
2. Enable "Make this a recurring task"
3. Choose a pattern:
   - **Daily**: Every day
   - **Weekly**: Select specific days of the week
   - **Monthly**: On specific dates
   - **Custom**: Define your own pattern

4. Set start and end dates (optional)
5. Configure task details
6. Save

## How It Works

- The first instance is created immediately
- Subsequent instances are auto-generated on schedule
- You can customize each instance independently
- Completing the parent task doesn't affect instances
- Stop recurring by setting an end date

## Example Use Cases

- Daily standup meetings
- Weekly team reviews
- Monthly billing reminders
- Quarterly project reviews
- Custom business processes`,
    keywords: "recurring, repeat, pattern, daily, weekly, monthly, schedule",
    priority: 7,
    isActive: true,
  },
  {
    category: "feature-doc",
    title: "Working with Mind Maps",
    content: `# Mind Maps Guide

Mind Maps are a visual way to brainstorm and plan. Convert them directly into projects and tasks!

## Creating a Mind Map

1. Go to "Mind Maps" section
2. Click "New Mind Map"
3. Start with a central idea (the main topic)
4. Add branches for related concepts
5. Add sub-branches for details
6. Customize colors and labels

## Converting to Projects

Once your mind map is complete:
1. Click "Convert to Project"
2. Choose conversion settings:
   - Root project name (from center)
   - Hierarchy depth
   - Task template settings

3. Preview the structure
4. Click "Convert"

TaskQuadrant will automatically create:
- A project for each main branch
- Subprojects for secondary branches
- Tasks for leaf nodes

## Tips

- Color code by priority or type
- Use descriptive labels
- Keep connections simple for clarity
- Review the preview before converting
- You can edit after conversion`,
    keywords: "mind map, brainstorm, visualize, plan, convert, project",
    priority: 6,
    isActive: true,
  },
  {
    category: "troubleshooting",
    title: "Task Not Saving - Common Fixes",
    content: `# Troubleshooting: Task Not Saving

If your task isn't saving, try these solutions:

## Step 1: Check Your Connection
- Ensure you have a stable internet connection
- Try refreshing the page
- Check your browser's network tab for errors

## Step 2: Validate Your Input
- Ensure you've entered a task title
- Check that the title is at least 1 character
- Verify the project is still selected

## Step 3: Clear Browser Cache
- Clear your browser cache and cookies
- Close and reopen TaskQuadrant
- Try a different browser

## Step 4: Check Subscription Limits
Your subscription has limits:
- FREE: 50 tasks maximum
- PRO: Unlimited tasks
- ENTERPRISE: Unlimited tasks

If you're at the limit, upgrade your plan or complete existing tasks.

## Step 5: Still Not Working?

Contact our support team:
- Click the "Report Bug" button in the AI Butler chat
- Provide:
  - What you were trying to do
  - What error you saw
  - Your browser and OS information
  - Screenshots if possible

Our team will investigate and help resolve the issue.`,
    keywords: "bug, error, not saving, problem, issue, fix, solution",
    priority: 9,
    isActive: true,
  },
  {
    category: "user-guide",
    title: "Team Collaboration Setup",
    content: `# Setting Up Team Collaboration

Team features are available on PRO and ENTERPRISE plans.

## Creating a Team

1. Click "Create Team" in the Teams section
2. Enter team name and description
3. Choose privacy settings (Public/Private)
4. Click Create

## Inviting Team Members

1. Go to your team
2. Click "Manage Members"
3. Click "Invite Member"
4. Enter email addresses
5. Choose their role:
   - **ADMIN**: Full access, can manage team
   - **EDITOR**: Can edit projects and tasks
   - **VIEWER**: Read-only access

6. Send invitations

## Managing Roles

- ADMIN: Can add/remove members and change roles
- EDITOR: Can create and edit tasks
- VIEWER: Can view but not modify

## Tips for Successful Collaboration

- Assign clear ownership of tasks
- Use consistent naming conventions
- Communicate changes in task descriptions
- Hold regular team syncs
- Use the project structure to organize work`,
    keywords: "team, collaborate, invite, member, role, admin, editor, viewer",
    priority: 7,
    isActive: true,
  },
];

async function main() {
  console.log("🌱 Seeding Knowledge Base...");

  try {
    // Clear existing articles
    const deleted = await db.knowledgeBase.deleteMany({});
    console.log(`✓ Cleared ${deleted.count} existing articles`);

    // Create new articles
    for (const article of KNOWLEDGE_BASE_ARTICLES) {
      const created = await db.knowledgeBase.create({
        data: article,
      });
      console.log(`✓ Created: "${created.title}"`);
    }

    console.log(`\n✨ Successfully seeded ${KNOWLEDGE_BASE_ARTICLES.length} articles!`);
  } catch (error) {
    console.error("❌ Error seeding knowledge base:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main();
