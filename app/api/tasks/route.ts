import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { canCreateRecurringTask, TASK_LIMITS, getEffectiveTier } from "@/lib/projectLimits";
import { calculateNextOccurrenceDate, calculateInitialNextGenerationDate } from "@/lib/utils";
import { notifyBotsOfTaskEvent } from "@/lib/webhookService";

/**
 * GET /api/tasks - List all tasks for the user
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const completed = url.searchParams.get("completed");

    // Build filter - include tasks from user's own projects AND team projects
    let where: any;

    if (projectId) {
      // If specific project requested, get that project first to check if it's a team project
      const project = await db.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return ApiErrors.NOT_FOUND("Project");
      }

      // For team projects, include all tasks in the project
      // For personal projects, only include user's tasks
      if (project.teamId) {
        // Verify user is a team member
        const teamMember = await db.teamMember.findFirst({
          where: {
            teamId: project.teamId,
            userId: auth.userId,
            acceptedAt: { not: null },
          },
        });

        if (!teamMember) {
          return ApiErrors.FORBIDDEN("You are not a member of this team");
        }

        // User is team member, show all tasks in project
        where = { projectId };
      } else {
        // Personal project - only show user's tasks
        where = { projectId, userId: auth.userId };
      }
    } else {
      // No specific project - return user's personal tasks + all tasks from team projects they're in
      const teamMemberships = await db.teamMember.findMany({
        where: {
          userId: auth.userId,
          acceptedAt: { not: null },
        },
        select: { teamId: true },
      });

      const userTeamIds = teamMemberships.map((tm) => tm.teamId);

      // Get all user's projects
      const userProjects = await db.project.findMany({
        where: {
          OR: [
            { userId: auth.userId }, // Personal projects
            ...(userTeamIds.length > 0 ? [{ teamId: { in: userTeamIds } }] : []), // Team projects
          ],
        },
        select: { id: true },
      });

      const projectIds = userProjects.map((p) => p.id);

      where = {
        projectId: { in: projectIds },
      };
    }

    // Add completion filter if specified
    if (completed !== null) {
      where.completed = completed === "true";
    }

    const tasks = await db.task.findMany({
      where,
      select: {
        id: true,
        userId: true,
        projectId: true,
        title: true,
        description: true,
        priority: true,
        completed: true,
        completedAt: true,
        progress: true,
        status: true,
        startDate: true,
        startTime: true,
        dueDate: true,
        dueTime: true,
        resourceCount: true,
        manhours: true,
        dependsOnTaskId: true,
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
        },
        // Recurring task fields
        isRecurring: true,
        recurringPattern: true,
        recurringConfig: true,
        recurringStartDate: true,
        recurringEndDate: true,
        nextGenerationDate: true,
        lastGeneratedDate: true,
        parentTaskId: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignedToBotId: true,
        assignedToBot: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          select: {
            id: true,
            userId: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all user data for all assignments in all tasks
    const allAssignmentUserIds = tasks
      .flatMap(task => task.assignments?.map(a => a.userId) || [])
      .filter((id, index, arr) => arr.indexOf(id) === index); // Deduplicate

    const assignmentUsers = allAssignmentUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: allAssignmentUserIds } },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        })
      : [];

    const userMap = new Map(assignmentUsers.map(u => [u.id, u]));

    // Format tasks to match frontend expectations
    const formattedTasks = tasks.map((task: any) => ({
      id: task.id,
      userId: task.userId,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      priority: task.priority || "", // Convert null to empty string
      completed: task.completed,
      completedAt: task.completedAt,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : undefined,
      dueTime: task.dueTime,
      progress: task.progress,
      status: task.status,
      startDate: task.startDate ? task.startDate.toISOString().split('T')[0] : undefined,
      startTime: task.startTime,
      resourceCount: task.resourceCount,
      manhours: task.manhours,
      dependsOnTaskId: task.dependsOnTaskId,
      dependsOnTask: task.dependsOnTask,
      // Recurring task fields
      isRecurring: task.isRecurring,
      recurringPattern: task.recurringPattern,
      recurringConfig: task.recurringConfig,
      recurringStartDate: task.recurringStartDate ? task.recurringStartDate.toISOString().split('T')[0] : undefined,
      recurringEndDate: task.recurringEndDate ? task.recurringEndDate.toISOString().split('T')[0] : undefined,
      nextGenerationDate: task.nextGenerationDate,
      lastGeneratedDate: task.lastGeneratedDate,
      parentTaskId: task.parentTaskId,
      assignedToBotId: task.assignedToBotId,
      assignedToBot: task.assignedToBot,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project,
      assignments: task.assignments?.map((a: any) => ({
        ...a,
        user: userMap.get(a.userId),
      })),
    }));

    return success(formattedTasks);
  });
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { title, description, projectId, priority, startDate, startTime, dueDate, dueTime, resourceCount, manhours, dependsOnTaskId, isRecurring, recurringPattern, recurringConfig, recurringStartDate, recurringEndDate, assignedToBotId } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return ApiErrors.MISSING_REQUIRED_FIELD("title");
    }

    if (!projectId) {
      return ApiErrors.MISSING_REQUIRED_FIELD("projectId");
    }

    // Verify project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiErrors.NOT_FOUND("Project");
    }

    // Check access: either personal project owner OR team member with EDITOR+ role
    const isOwner = project.userId === auth.userId;
    let isTeamMember = false;

    if (project.teamId) {
      // For team projects, check if user is EDITOR or ADMIN
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: project.teamId,
          userId: auth.userId,
          acceptedAt: { not: null }, // Only accepted members
        },
      });

      if (teamMember) {
        const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
        const userLevel = roleHierarchy[teamMember.role as keyof typeof roleHierarchy];
        isTeamMember = userLevel >= 2; // EDITOR or higher
      }
    }

    // Must be either owner or team member with appropriate access
    if (!isOwner && !isTeamMember) {
      return ApiErrors.FORBIDDEN();
    }

    // Validate date logic: due date cannot be before start date
    if (startDate && dueDate) {
      const start = new Date(startDate + (startTime ? `T${startTime}` : 'T00:00'));
      const due = new Date(dueDate + (dueTime ? `T${dueTime}` : 'T23:59'));

      if (due < start) {
        return error("Due date cannot be earlier than start date", 400, "INVALID_DATE_RANGE");
      }
    }

    // Get user with subscription and mobile unlock status
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: { subscription: true },
    });

    const subscription = user?.subscription;
    const mobileUnlocked = user?.mobileUnlocked || false;
    const effectiveTier = getEffectiveTier(subscription?.plan || "FREE", mobileUnlocked);

    // Check task limit using effective tier
    const taskCount = await db.task.count({
      where: { userId: auth.userId },
    });

    const taskLimits = TASK_LIMITS[effectiveTier];
    if (taskLimits.maxTasks !== -1 && taskCount >= taskLimits.maxTasks) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("task");
    }

    // Check recurring task limits if applicable
    let processedIsRecurring = false;
    let calculatedNextGenerationDate: Date | null = null;

    if (isRecurring) {
      const recurringTaskCount = await db.task.count({
        where: { userId: auth.userId, isRecurring: true, parentTaskId: null },
      });

      const canCreate = canCreateRecurringTask(subscription?.plan || "FREE", recurringTaskCount, mobileUnlocked);
      if (!canCreate.allowed) {
        return error(canCreate.message || "Cannot create recurring task", 403, "SUBSCRIPTION_LIMIT");
      }

      // Calculate next generation date
      if (recurringStartDate && recurringConfig) {
        // For initial creation, use special logic that accounts for missed occurrences
        // E.g., if it's Tuesday and task is scheduled for Monday, generate today (it's overdue)
        const nextDate = calculateInitialNextGenerationDate(recurringConfig);
        calculatedNextGenerationDate = nextDate;
      }

      processedIsRecurring = true;
    }

    // Create task
    const task = await db.task.create({
      data: {
        userId: auth.userId,
        projectId,
        title: title.trim(),
        description: description?.trim(),
        priority: priority || null, // Allow null for tasks without a quadrant
        startDate: startDate ? new Date(startDate) : null,
        startTime: startTime || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime || null,
        resourceCount: resourceCount || null,
        manhours: manhours || null,
        dependsOnTaskId: dependsOnTaskId || null,
        assignedToBotId: assignedToBotId || null,
        // Recurring task fields
        isRecurring: processedIsRecurring,
        recurringPattern: processedIsRecurring ? recurringPattern : null,
        recurringConfig: processedIsRecurring ? (typeof recurringConfig === 'string' ? recurringConfig : JSON.stringify(recurringConfig)) : null,
        recurringStartDate: processedIsRecurring && recurringStartDate ? new Date(recurringStartDate) : null,
        recurringEndDate: processedIsRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
        nextGenerationDate: calculatedNextGenerationDate,
      },
      select: {
        id: true,
        userId: true,
        projectId: true,
        title: true,
        description: true,
        priority: true,
        completed: true,
        completedAt: true,
        progress: true,
        status: true,
        startDate: true,
        startTime: true,
        dueDate: true,
        dueTime: true,
        resourceCount: true,
        manhours: true,
        dependsOnTaskId: true,
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
        },
        assignedToBotId: true,
        assignedToBot: {
          select: {
            id: true,
            name: true,
          },
        },
        // Recurring task fields
        isRecurring: true,
        recurringPattern: true,
        recurringConfig: true,
        recurringStartDate: true,
        recurringEndDate: true,
        nextGenerationDate: true,
        lastGeneratedDate: true,
        parentTaskId: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Format response
    const formattedTask = {
      id: task.id,
      userId: task.userId,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      priority: task.priority || "", // Convert null to empty string
      completed: task.completed,
      completedAt: task.completedAt,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : undefined,
      dueTime: task.dueTime,
      progress: task.progress,
      status: task.status,
      startDate: task.startDate ? task.startDate.toISOString().split('T')[0] : undefined,
      startTime: task.startTime,
      resourceCount: task.resourceCount,
      manhours: task.manhours,
      dependsOnTaskId: task.dependsOnTaskId,
      dependsOnTask: task.dependsOnTask,
      // Recurring task fields
      isRecurring: task.isRecurring,
      recurringPattern: task.recurringPattern,
      recurringConfig: task.recurringConfig,
      recurringStartDate: task.recurringStartDate ? task.recurringStartDate.toISOString().split('T')[0] : undefined,
      recurringEndDate: task.recurringEndDate ? task.recurringEndDate.toISOString().split('T')[0] : undefined,
      nextGenerationDate: task.nextGenerationDate,
      lastGeneratedDate: task.lastGeneratedDate,
      parentTaskId: task.parentTaskId,
      assignedToBotId: task.assignedToBotId,
      assignedToBot: task.assignedToBot,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project,
    };

    // Notify bots of task creation
    notifyBotsOfTaskEvent(projectId, "task.created", task).catch(() => {});

    return success(formattedTask, 201);
  });
}
