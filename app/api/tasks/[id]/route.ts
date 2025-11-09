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
        assignments: {
          select: {
            id: true,
            userId: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check access: user must be creator OR team member with access
    const isOwner = task.userId === auth.userId;
    let canAccess = isOwner;

    if (task.project?.teamId && !isOwner) {
      // For team projects, check if user is a team member
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: task.project.teamId,
          userId: auth.userId,
          acceptedAt: { not: null },
        },
      });
      canAccess = !!teamMember;
    }

    if (!canAccess) {
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
      assignments: task.assignments,
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
      include: { project: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check task access: user must be owner OR team member with EDITOR+ role
    const isOwner = task.userId === auth.userId;
    let canEditTask = isOwner;

    if (task.project?.teamId && !isOwner) {
      // For team projects, check if user is EDITOR or ADMIN
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: task.project.teamId,
          userId: auth.userId,
          acceptedAt: { not: null },
        },
      });

      if (teamMember) {
        const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
        const userLevel = roleHierarchy[teamMember.role as keyof typeof roleHierarchy];
        canEditTask = userLevel >= 2; // EDITOR or higher
      }
    }

    if (!canEditTask) {
      return ApiErrors.FORBIDDEN();
    }

    // If changing project, verify access to new project
    if (projectId && projectId !== task.projectId) {
      const newProject = await db.project.findUnique({
        where: { id: projectId },
      });

      if (!newProject) {
        return ApiErrors.NOT_FOUND("Project");
      }

      const isNewOwner = newProject.userId === auth.userId;
      let canAccessNewProject = isNewOwner;

      if (newProject.teamId && !isNewOwner) {
        const teamMember = await db.teamMember.findFirst({
          where: {
            teamId: newProject.teamId,
            userId: auth.userId,
            acceptedAt: { not: null },
          },
        });

        if (teamMember) {
          const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
          const userLevel = roleHierarchy[teamMember.role as keyof typeof roleHierarchy];
          canAccessNewProject = userLevel >= 2;
        }
      }

      if (!canAccessNewProject) {
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
        assignments: {
          select: {
            id: true,
            userId: true,
            role: true,
            createdAt: true,
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
      // Recurring task fields
      isRecurring: updated.isRecurring,
      recurringPattern: updated.recurringPattern,
      recurringConfig: updated.recurringConfig,
      recurringStartDate: updated.recurringStartDate ? updated.recurringStartDate.toISOString().split('T')[0] : undefined,
      recurringEndDate: updated.recurringEndDate ? updated.recurringEndDate.toISOString().split('T')[0] : undefined,
      nextGenerationDate: updated.nextGenerationDate,
      lastGeneratedDate: updated.lastGeneratedDate,
      parentTaskId: updated.parentTaskId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      project: updated.project,
      assignments: updated.assignments,
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
      include: { project: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check delete access: user must be owner OR team member with EDITOR+ role
    const isOwner = task.userId === auth.userId;
    let canDeleteTask = isOwner;

    if (task.project?.teamId && !isOwner) {
      // For team projects, check if user is EDITOR or ADMIN
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: task.project.teamId,
          userId: auth.userId,
          acceptedAt: { not: null },
        },
      });

      if (teamMember) {
        const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
        const userLevel = roleHierarchy[teamMember.role as keyof typeof roleHierarchy];
        canDeleteTask = userLevel >= 2; // EDITOR or higher
      }
    }

    if (!canDeleteTask) {
      return ApiErrors.FORBIDDEN();
    }

    // Delete task
    await db.task.delete({
      where: { id: params.id },
    });

    return success({ message: "Task deleted" });
  });
}
