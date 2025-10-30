import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

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

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    if (task.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    return success(task);
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
    const { title, description, projectId, priority, dueDate, dueTime, completed } = body;

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

    // Update task
    const updated = await db.task.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(projectId !== undefined && { projectId }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(dueTime !== undefined && { dueTime }),
        ...(completed !== undefined && {
          completed,
          completedAt: completed ? new Date() : null,
        }),
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

    return success(updated);
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
