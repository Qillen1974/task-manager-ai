import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { canCreateRecurringTask, TASK_LIMITS } from "@/lib/projectLimits";
import { calculateNextOccurrenceDate } from "@/lib/utils";

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

    // Build filter
    const where: any = { userId: auth.userId };
    if (projectId) {
      where.projectId = projectId;
    }
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
      },
      orderBy: { createdAt: "desc" },
    });

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
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project,
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
    const { title, description, projectId, priority, startDate, startTime, dueDate, dueTime, resourceCount, manhours, dependsOnTaskId, isRecurring, recurringPattern, recurringConfig, recurringStartDate, recurringEndDate } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return ApiErrors.MISSING_REQUIRED_FIELD("title");
    }

    if (!projectId) {
      return ApiErrors.MISSING_REQUIRED_FIELD("projectId");
    }

    // Verify project exists and belongs to user
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiErrors.NOT_FOUND("Project");
    }

    if (project.userId !== auth.userId) {
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

    // Get subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    // Check task limit
    const taskCount = await db.task.count({
      where: { userId: auth.userId },
    });

    const taskLimit = subscription?.taskLimit || TASK_LIMITS.FREE.maxTasks;
    if (taskCount >= taskLimit) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("task");
    }

    // Check recurring task limits if applicable
    let processedIsRecurring = false;
    let calculatedNextGenerationDate: Date | null = null;

    if (isRecurring) {
      const recurringTaskCount = await db.task.count({
        where: { userId: auth.userId, isRecurring: true, parentTaskId: null },
      });

      const canCreate = canCreateRecurringTask(subscription?.plan || "FREE", recurringTaskCount);
      if (!canCreate.allowed) {
        return error(canCreate.message || "Cannot create recurring task", 403, "SUBSCRIPTION_LIMIT");
      }

      // Calculate next generation date
      if (recurringStartDate && recurringConfig) {
        const nextDate = calculateNextOccurrenceDate(recurringStartDate, recurringConfig);
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
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project,
    };

    return success(formattedTask, 201);
  });
}
