import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { sendTaskCompletionNotification } from "@/lib/notificationService";
import { notifyBotsOfTaskEvent } from "@/lib/webhookService";

/**
 * Cascade start date updates to dependent tasks
 * When a predecessor task's due date changes, dependent tasks need their dates adjusted
 */
async function cascadeDependentTaskDates(
  predecessorTaskId: string,
  predecessorDueDate: Date | null
): Promise<{ taskId: string; oldStartDate: Date | null; newStartDate: Date | null }[]> {
  const cascadedUpdates: { taskId: string; oldStartDate: Date | null; newStartDate: Date | null }[] = [];

  if (!predecessorDueDate) {
    return cascadedUpdates;
  }

  // Find all tasks that depend on this task
  const dependentTasks = await db.task.findMany({
    where: {
      dependsOnTaskId: predecessorTaskId,
    },
    select: {
      id: true,
      startDate: true,
      dueDate: true,
    },
  });

  for (const dependent of dependentTasks) {
    // New start date should be the day after predecessor's due date
    const newStartDate = new Date(predecessorDueDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    // Check if we need to update this dependent task:
    // 1. If it has no start date, set it to day after predecessor's due date
    // 2. If it has a start date that's before or on the predecessor's due date, push it forward
    const needsUpdate = !dependent.startDate || dependent.startDate <= predecessorDueDate;

    if (needsUpdate) {
      // Calculate the shift in days (for shifting due date proportionally)
      let shiftDays = 0;
      if (dependent.startDate) {
        shiftDays = Math.ceil((newStartDate.getTime() - dependent.startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Prepare update data
      const updateData: { startDate: Date; dueDate?: Date } = {
        startDate: newStartDate,
      };

      // If dependent task has a due date, shift it by the same amount
      if (dependent.dueDate && shiftDays > 0) {
        const newDueDate = new Date(dependent.dueDate);
        newDueDate.setDate(newDueDate.getDate() + shiftDays);
        updateData.dueDate = newDueDate;
      }

      // Update the dependent task
      await db.task.update({
        where: { id: dependent.id },
        data: updateData,
      });

      cascadedUpdates.push({
        taskId: dependent.id,
        oldStartDate: dependent.startDate,
        newStartDate: newStartDate,
      });

      // Recursively cascade to tasks that depend on this dependent task
      const nestedCascades = await cascadeDependentTaskDates(dependent.id, updateData.dueDate || dependent.dueDate || null);
      cascadedUpdates.push(...nestedCascades);
    }
  }

  return cascadedUpdates;
}

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
            teamId: true,
          },
        },
        assignments: {
          select: {
            id: true,
            userId: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
              },
            },
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

    // Fetch user data for assignments
    const assignmentUserIds = task.assignments?.map(a => a.userId) || [];
    const users = assignmentUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: assignmentUserIds } },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u]));

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
      status: task.status,
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
      assignments: task.assignments?.map(a => ({
        ...a,
        user: userMap.get(a.userId),
      })),
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
    const { title, description, projectId, priority, startDate, startTime, dueDate, dueTime, completed, progress, resourceCount, manhours, dependsOnTaskId, assignedToBotId, status } = body;

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

    // Validate status if provided
    const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return error("Invalid status. Use TODO, IN_PROGRESS, REVIEW, or DONE", 400, "INVALID_STATUS");
    }

    // Bidirectional sync between status and completed
    let syncedCompleted = completed;
    let syncedStatus = status;
    let syncedProgress = progress;

    // status: DONE → auto-set completed: true, progress: 100
    if (status === "DONE") {
      syncedCompleted = true;
      syncedProgress = 100;
    }
    // completed: true (explicit) → auto-set status: DONE
    if (completed === true && status === undefined) {
      syncedStatus = "DONE";
    }
    // Moving away from DONE → completed: false
    if (status !== undefined && status !== "DONE" && task.status === "DONE") {
      syncedCompleted = false;
    }
    // completed: false (explicit) and currently DONE → move to TODO
    if (completed === false && status === undefined && task.status === "DONE") {
      syncedStatus = "TODO";
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
        ...(syncedProgress !== undefined && { progress: syncedProgress }),
        ...(resourceCount !== undefined && { resourceCount }),
        ...(manhours !== undefined && { manhours }),
        ...(dependsOnTaskId !== undefined && { dependsOnTaskId: dependsOnTaskId || null }),
        ...(assignedToBotId !== undefined && { assignedToBotId: assignedToBotId || null }),
        ...(syncedStatus !== undefined && { status: syncedStatus as any }),
        ...(syncedCompleted !== undefined && {
          completed: syncedCompleted,
          completedAt: syncedCompleted ? new Date() : null,
          ...(syncedCompleted && { progress: 100 }),
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
            teamId: true,
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

    // Send task completion notification if task was just completed
    if (completed === true && !task.completed) {
      try {
        const assignmentIds = updated.assignments?.map(a => a.id) || [];
        await sendTaskCompletionNotification(
          assignmentIds,
          auth.userId,
          updated.id,
          updated.title,
          updated.project?.name || "Untitled"
        );
      } catch (notificationError) {
        // Log but don't fail the request if notification fails
        console.error("Failed to send task completion notification:", notificationError);
      }
    }

    // Cascade date changes to dependent tasks if start date or due date was updated
    let cascadedTasks: { taskId: string; oldStartDate: Date | null; newStartDate: Date | null }[] = [];
    if (startDate !== undefined || dueDate !== undefined) {
      const newDueDate = updated.dueDate;
      if (newDueDate) {
        cascadedTasks = await cascadeDependentTaskDates(params.id, newDueDate);
      }
    }

    // Notify bots of task update
    notifyBotsOfTaskEvent(updated.projectId, "task.updated", updated).catch(() => {});

    // Fetch user data for assignments
    const updatedAssignmentUserIds = updated.assignments?.map(a => a.userId) || [];
    const updatedUsers = updatedAssignmentUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: updatedAssignmentUserIds } },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        })
      : [];

    const updatedUserMap = new Map(updatedUsers.map(u => [u.id, u]));

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
      status: updated.status,
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
      assignedToBotId: updated.assignedToBotId,
      assignedToBot: updated.assignedToBot,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      project: updated.project,
      assignments: updated.assignments?.map(a => ({
        ...a,
        user: updatedUserMap.get(a.userId),
      })),
      // Include cascaded dependent task updates in response
      cascadedUpdates: cascadedTasks.length > 0 ? cascadedTasks : undefined,
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
