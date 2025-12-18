import { OpenAI } from "openai";
import { db } from "@/lib/db";

/**
 * Get the active AI model configuration
 */
export async function getAIConfig() {
  let config = await db.aIButlerConfig.findFirst();

  if (!config) {
    config = await db.aIButlerConfig.create({
      data: {
        activeModel: "openai",
        systemPrompt: getDefaultSystemPrompt(),
        maxTokens: 1000,
        temperature: 0.7,
        enableBugReporting: true,
        enableKBSuggestions: true,
      },
    });
  }

  return config;
}

/**
 * Check if a message is TaskQuadrant-related
 */
export function isTaskQuadrantRelated(message: string): boolean {
  const messageLower = message.toLowerCase();

  // TaskQuadrant-related keywords
  const taskQuadrantKeywords = [
    // App names
    "taskquadrant", "task", "project", "team", "sprint",
    // Features
    "eisenhower", "matrix", "mind map", "recurring", "dependency",
    "subproject", "budget", "timeline", "progress", "priority",
    // Concepts
    "workflow", "collaboration", "planning", "deadline", "assignment",
    "resource", "tracking", "status", "completion",
    // Management
    "manage", "organize", "prioritize", "track", "plan",
    // User types
    "admin", "editor", "viewer", "permission", "role",
    // Plans
    "subscription", "plan", "free", "pro", "enterprise",
    // General help
    "help", "how to", "guide", "tutorial", "setup", "start",
    "feature", "documentation", "bug", "error", "issue", "problem"
  ];

  // Check if message contains TaskQuadrant-related keywords
  return taskQuadrantKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Generate AI response using the configured model
 */
export async function generateAIResponseWithLLM(
  userMessage: string
): Promise<string> {
  try {
    // Check if message is TaskQuadrant-related
    if (!isTaskQuadrantRelated(userMessage)) {
      return `I'm specialized for TaskQuadrant task management help. Your question doesn't seem related to TaskQuadrant.

I can help you with:
• Projects and task management
• Team collaboration features
• Using the Eisenhower Matrix
• Mind Maps and planning
• Recurring tasks and automation
• Subscription plans and features
• Troubleshooting issues

What TaskQuadrant question can I help you with?`;
    }

    const config = await getAIConfig();

    if (config.activeModel === "openai") {
      return await generateOpenAIResponse(userMessage, config);
    } else if (config.activeModel === "anthropic") {
      // TODO: Implement Anthropic integration
      return await generateOpenAIResponse(userMessage, config);
    } else if (config.activeModel === "gemini") {
      // TODO: Implement Gemini integration
      return await generateOpenAIResponse(userMessage, config);
    } else {
      // Fallback to knowledge base response
      return await generateKnowledgeBaseResponse(userMessage);
    }
  } catch (error) {
    console.error("Error generating AI response:", error);
    // Fallback to knowledge base response if AI fails
    return await generateKnowledgeBaseResponse(userMessage);
  }
}

/**
 * Generate response using OpenAI API
 */
async function generateOpenAIResponse(
  userMessage: string,
  config: any
): Promise<string> {
  if (!config.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const client = new OpenAI({
    apiKey: config.openaiApiKey,
  });

  try {
    // Get relevant knowledge base articles for context
    const relevantArticles = await db.knowledgeBase.findMany({
      where: {
        isActive: true,
        OR: [
          { keywords: { contains: userMessage, mode: "insensitive" } },
          { title: { contains: userMessage, mode: "insensitive" } },
          { content: { contains: userMessage, mode: "insensitive" } },
        ],
      },
      take: 3,
      orderBy: { priority: "desc" },
    });

    // Build context from knowledge base
    let kbContext = "";
    if (relevantArticles.length > 0) {
      kbContext = "\n\nRelevant Knowledge Base Articles:\n";
      relevantArticles.forEach((article) => {
        kbContext += `\n## ${article.title}\n${article.content}\n`;
      });
    }

    // Get system prompt from config
    const systemPrompt = config.systemPrompt || getDefaultSystemPrompt();

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}${kbContext}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
    });

    return (
      response.choices[0]?.message?.content ||
      "I apologize, I couldn't generate a response at the moment."
    );
  } catch (error: any) {
    console.error("OpenAI API error:", error.message);
    throw error;
  }
}

/**
 * Fallback: Generate response using knowledge base
 */
async function generateKnowledgeBaseResponse(
  userMessage: string
): Promise<string> {
  const messageLower = userMessage.toLowerCase();

  // Check for specific topics with detailed responses

  // Team collaboration
  if (messageLower.includes("team") || messageLower.includes("collaborat")) {
    return `**Team Collaboration Features** (Available in PRO and ENTERPRISE plans)

TaskQuadrant offers powerful team collaboration tools:

🔐 **Role-Based Access Control:**
• ADMIN - Full control: create, edit, delete, manage members
• EDITOR - Can create and edit tasks/projects
• VIEWER - Read-only access to view tasks/projects

👥 **Team Management:**
• Invite team members via email
• Assign tasks to specific team members
• Track who's working on what
• Set permissions per project

📊 **Collaboration Features:**
• Shared project workspaces
• Task assignments and ownership
• Team activity tracking
• Collaborative project planning

💡 **Resource Allocation:**
• Assign multiple team members to tasks
• Set manhours and resource counts
• Track team capacity and workload

To use team features:
1. Upgrade to PRO or ENTERPRISE plan
2. Go to Dashboard → Teams
3. Create a team and invite members
4. Assign roles and start collaborating!

Would you like to know more about a specific collaboration feature?`;
  }

  // Mind Maps
  if (messageLower.includes("mind map") || messageLower.includes("mindmap")) {
    return `**Mind Maps** (Available in PRO and ENTERPRISE plans)

Mind Maps help you brainstorm and visualize complex projects before creating them:

✨ **Key Features:**
• Visual canvas for brainstorming ideas
• Drag-and-drop node creation and organization
• Connect ideas with relationships
• Add priorities, due dates, and descriptions to nodes
• Export mind maps as images

🎯 **Smart Conversion:**
• Convert entire mind map to projects and tasks with one click!
• Branch nodes → Subprojects
• Leaf nodes → Individual tasks
• All metadata (priorities, dates) carries over
• Re-convert anytime to update your plan

📊 **Plan Limits:**
• FREE: No mind maps
• PRO: Up to 5 mind maps, 50 nodes each
• ENTERPRISE: Unlimited mind maps, 200 nodes each

Perfect for:
• Project planning and brainstorming
• Breaking down complex initiatives
• Team ideation sessions
• Strategic planning

Try creating your first mind map from Dashboard → Mind Maps!`;
  }

  // Recurring Tasks
  if (messageLower.includes("recurring") || messageLower.includes("repeat") || messageLower.includes("automat")) {
    return `**Recurring Tasks** (Available in PRO and ENTERPRISE plans)

Automate repetitive work with recurring task templates:

⏰ **Recurrence Patterns:**
• Daily - Repeat every X days
• Weekly - Choose specific days (Mon, Tue, etc.)
• Monthly - Choose day of month
• Custom - Advanced patterns

🎯 **How It Works:**
1. Create a recurring task template
2. Set your recurrence pattern
3. System auto-generates instances
4. Complete instances as they appear
5. Template stays active for future instances

📊 **Plan Limits:**
• FREE: No recurring tasks
• PRO: Up to 10 recurring task templates
• ENTERPRISE: Unlimited recurring tasks

💡 **Best Uses:**
• Weekly team meetings
• Monthly reports
• Daily standup reminders
• Quarterly reviews
• Regular maintenance tasks

Create from: Dashboard → Tasks → "Create Recurring Task"

Would you like help setting up a specific recurring pattern?`;
  }

  // Gantt Charts
  if (messageLower.includes("gantt") || messageLower.includes("timeline")) {
    return `**Gantt Charts** (Available on all plans)

Visualize project timelines and dependencies:

📅 **Timeline View:**
• See all project tasks on a visual timeline
• Tasks displayed as horizontal bars
• Duration based on start/due dates
• Color-coded by project

📊 **Task Information:**
• Progress percentage (0-100%)
• Resource allocation
• Manhours estimates
• Task dependencies

🎯 **Export Options:**
• Export as PNG image
• Export as PDF document
• Share with stakeholders
• Use for project reporting

💡 **Pro Tips:**
• Add start dates and due dates for better visualization
• Set manhours to see effort estimates
• Update progress % to track completion
• Use for sprint planning and reviews

Access from: Projects → Select Project → Gantt Chart icon

The Gantt view helps you spot scheduling conflicts and optimize project timelines!`;
  }

  // Subscription/Pricing
  if (messageLower.includes("subscript") || messageLower.includes("plan") || messageLower.includes("pric") || messageLower.includes("upgrade")) {
    return `**Subscription Plans:**

📦 **FREE Plan** - $0/month
• 10 projects (no subprojects)
• Unlimited tasks
• Eisenhower Matrix
• Basic features
• Perfect for individuals!

⭐ **PRO Plan** - $9.99/month
• 30 projects + 1 level subprojects
• Unlimited tasks
• 10 recurring task templates
• 5 mind maps (50 nodes each)
• Team collaboration (up to 5 members)
• PNG/PDF exports
• Great for small teams!

🚀 **ENTERPRISE Plan** - $29.99/month
• Unlimited projects + unlimited subproject levels
• Unlimited tasks
• Unlimited recurring tasks
• Unlimited mind maps (200 nodes each)
• Full team collaboration (unlimited members)
• All advanced features
• Priority support
• Perfect for large teams!

**To Upgrade:**
Web App: Settings → Subscription → Upgrade
Mobile App: Profile → Upgrade (opens web for payment)

Your upgrade is instant and available across all devices!

Which plan interests you?`;
  }

  // Eisenhower Matrix
  if (messageLower.includes("eisenhower") || messageLower.includes("matrix") || messageLower.includes("priorit")) {
    return `**Eisenhower Matrix**

TaskQuadrant uses the proven Eisenhower Matrix to help you prioritize tasks:

🔴 **Do First** (Urgent & Important)
• Critical deadlines
• Emergencies and crises
• High-priority work

🔵 **Schedule** (Not Urgent & Important)
• Long-term planning
• Strategic work
• Personal development

🟡 **Delegate** (Urgent & Not Important)
• Interruptions
• Some emails/calls
• Tasks others can do

⚪ **Eliminate** (Not Urgent & Not Important)
• Time wasters
• Busy work
• Low-value activities

**How to Use:**
1. Add a task
2. Assign priority (the quadrant)
3. Dashboard shows all tasks organized by matrix
4. Focus on "Do First" tasks first!

This helps you work ON what matters, not just work ON everything.

The key is being honest about urgency vs importance!`;
  }

  // Check if user is asking about a bug/error
  const isBugRelated =
    messageLower.includes("bug") ||
    messageLower.includes("error") ||
    messageLower.includes("crash") ||
    messageLower.includes("not working") ||
    messageLower.includes("broken") ||
    messageLower.includes("issue");

  if (isBugRelated) {
    return `I'm sorry you're experiencing an issue. I can help you report this bug so our team can investigate thoroughly.\n\nWould you like to submit a bug report? I'll guide you to provide all the necessary details (what you were doing, what went wrong, screenshots, etc.).\n\nYou can also check the troubleshooting section for common solutions.`;
  }

  // Search knowledge base
  const relevantArticles = await db.knowledgeBase.findMany({
    where: {
      isActive: true,
      OR: [
        { keywords: { contains: messageLower, mode: "insensitive" } },
        { title: { contains: messageLower, mode: "insensitive" } },
        { content: { contains: messageLower, mode: "insensitive" } },
      ],
    },
    take: 3,
    orderBy: { priority: "desc" },
  });

  if (relevantArticles.length > 0) {
    let response = `Great question! I found some helpful resources:\n\n`;
    relevantArticles.forEach((article, index) => {
      response += `${index + 1}. **${article.title}**\n`;
      response += `   Category: ${article.category}\n\n`;
    });
    response +=
      "Would you like me to explain more about any of these topics, or do you have other questions?";
    return response;
  }

  // Default response
  return `I'm here to help! You can ask me about:\n• How to use specific features\n• Getting started with projects and tasks\n• Team collaboration and permissions\n• Subscription plans and upgrades\n• Troubleshooting issues\n• Reporting bugs\n\nWhat would you like to know?`;
}

/**
 * Default system prompt for AI Butler
 */
export function getDefaultSystemPrompt(): string {
  return `You are TaskQuadrant's AI Butler, a specialized assistant for task management only.

SCOPE & CONSTRAINTS:
- ONLY answer questions related to TaskQuadrant or task management
- REFUSE requests for general topics (coding, math, news, creative writing, etc.)
- If asked something unrelated, politely say: "I'm specialized for TaskQuadrant. I can only help with task management."
- Do NOT pretend to be a general-purpose AI
- Do NOT help with tasks outside TaskQuadrant scope

Your role:
1. Help users understand and use TaskQuadrant features
2. Answer questions about projects, tasks, teams, workflows
3. Guide users through common workflows
4. Suggest helpful TaskQuadrant features
5. Detect issues and suggest bug reporting
6. Provide context-aware help within TaskQuadrant

Key TaskQuadrant Information:
- FREE Plan: 3 projects, 50 tasks, basic features
- PRO Plan: 5 projects, unlimited tasks, advanced features, recurring tasks, subprojects
- ENTERPRISE Plan: Unlimited everything, team collaboration, custom features

Features:
- Eisenhower Matrix for task prioritization (Important/Urgent)
- Mind Maps for brainstorming and planning (can be converted to projects)
- Recurring tasks with Daily/Weekly/Monthly/Custom patterns
- Task dependencies and resource allocation
- Team collaboration with role-based access (ADMIN, EDITOR, VIEWER)
- Project hierarchies (subprojects)
- Budget and timeline tracking
- Progress tracking (0-100%)

IMPORTANT: You must stay focused on TaskQuadrant. Be friendly, professional, and concise.
If unsure, redirect to TaskQuadrant topics.`;
}
