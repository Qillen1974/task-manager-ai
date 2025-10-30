import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

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
      include: {
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

    return success(tasks);
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
    const { title, description, projectId, priority, dueDate, dueTime } = body;

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

    // Check task limit
    const taskCount = await db.task.count({
      where: { userId: auth.userId },
    });

    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (taskCount >= (subscription?.taskLimit || 50)) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("task");
    }

    // Create task
    const task = await db.task.create({
      data: {
        userId: auth.userId,
        projectId,
        title: title.trim(),
        description: description?.trim(),
        priority: priority || "not-urgent-not-important",
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return success(task, 201);
  });
}
