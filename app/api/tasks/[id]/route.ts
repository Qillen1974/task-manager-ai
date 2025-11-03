import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/tasks/[id] - Get a specific task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
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

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    if (task.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

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
      startDate: task.startDate ? task.startDate.toISOString().split('T')[0] : undefined,
      startTime: task.startTime,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : undefined,
      dueTime: task.dueTime,
      progress: task.progress,
      resourceCount: task.resourceCount,
      manhours: task.manhours,
      dependsOnTaskId: task.dependsOnTaskId,
      dependsOnTask: task.dependsOnTask,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project,
    };

    return success(formattedTask);
  });
}

/**
 * PATCH /api/tasks/[id] - Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { title, description, projectId, priority, startDate, startTime, dueDate, dueTime, completed, progress, resourceCount, manhours, dependsOnTaskId } = body;

    // Find task
    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    if (task.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    // If changing project, verify ownership
    if (projectId && projectId !== task.projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.userId !== auth.userId) {
        return ApiErrors.FORBIDDEN();
      }
    }

    // Validate date logic: due date cannot be before start date
    // Use existing task dates if not provided in update
    const finalStartDate = startDate !== undefined ? startDate : (task.startDate ? task.startDate.toISOString().split('T')[0] : null);
    const finalStartTime = startTime !== undefined ? startTime : task.startTime;
    const finalDueDate = dueDate !== undefined ? dueDate : (task.dueDate ? task.dueDate.toISOString().split('T')[0] : null);
    const finalDueTime = dueTime !== undefined ? dueTime : task.dueTime;

    if (finalStartDate && finalDueDate) {
      const start = new Date(finalStartDate + (finalStartTime ? `T${finalStartTime}` : 'T00:00'));
      const due = new Date(finalDueDate + (finalDueTime ? `T${finalDueTime}` : 'T23:59'));

      if (due < start) {
        return error("Due date cannot be earlier than start date", 400, "INVALID_DATE_RANGE");
      }
    }

    // Update task
    const updated = await db.task.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(projectId !== undefined && { projectId }),
        ...(priority !== undefined && { priority }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(startTime !== undefined && { startTime }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(dueTime !== undefined && { dueTime }),
        ...(progress !== undefined && { progress }),
        ...(resourceCount !== undefined && { resourceCount }),
        ...(manhours !== undefined && { manhours }),
        ...(dependsOnTaskId !== undefined && { dependsOnTaskId: dependsOnTaskId || null }),
        ...(completed !== undefined && {
          completed,
          completedAt: completed ? new Date() : null,
          // Automatically set progress to 100 when task is completed
          ...(completed && { progress: 100 }),
        }),
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
      id: updated.id,
      userId: updated.userId,
      projectId: updated.projectId,
      title: updated.title,
      description: updated.description,
      priority: updated.priority || "", // Convert null to empty string
      completed: updated.completed,
      completedAt: updated.completedAt,
      startDate: updated.startDate ? updated.startDate.toISOString().split('T')[0] : undefined,
      startTime: updated.startTime,
      dueDate: updated.dueDate ? updated.dueDate.toISOString().split('T')[0] : undefined,
      dueTime: updated.dueTime,
      progress: updated.progress,
      resourceCount: updated.resourceCount,
      manhours: updated.manhours,
      dependsOnTaskId: updated.dependsOnTaskId,
      dependsOnTask: updated.dependsOnTask,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      project: updated.project,
    };

    return success(formattedTask);
  });
}

/**
 * DELETE /api/tasks/[id] - Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Find task
    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    if (task.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    // Delete task
    await db.task.delete({
      where: { id: params.id },
    });

    return success({ message: "Task deleted" });
  });
}
