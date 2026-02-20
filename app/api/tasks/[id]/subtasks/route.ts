import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { canAccessSubtasks } from "@/lib/projectLimits";

/**
 * GET /api/tasks/[id]/subtasks - List subtasks of a task
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

    // Find task and verify access
    const task = await db.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        project: {
          select: { teamId: true },
        },
      },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check access: user must be creator OR team member
    const isOwner = task.userId === auth.userId;
    let canAccess = isOwner;

    if (task.project?.teamId && !isOwner) {
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

    const subtasks = await db.task.findMany({
      where: { subtaskOfId: params.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        completed: true,
        progress: true,
        assignedToBotId: true,
        assignedToBot: {
          select: { id: true, name: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(subtasks);
  });
}

/**
 * POST /api/tasks/[id]/subtasks - Create a subtask under a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Check enterprise plan
    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
      select: { plan: true },
    });
    const plan = subscription?.plan || "FREE";

    if (!canAccessSubtasks(plan)) {
      return error("Subtasks require an ENTERPRISE plan", 403, "ENTERPRISE_REQUIRED");
    }

    // Find parent task and verify access
    const parentTask = await db.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        projectId: true,
        subtaskOfId: true,
        project: {
          select: { teamId: true },
        },
      },
    });

    if (!parentTask) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check access
    const isOwner = parentTask.userId === auth.userId;
    let canEdit = isOwner;

    if (parentTask.project?.teamId && !isOwner) {
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: parentTask.project.teamId,
          userId: auth.userId,
          acceptedAt: { not: null },
        },
      });
      if (teamMember) {
        const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
        const userLevel = roleHierarchy[teamMember.role as keyof typeof roleHierarchy];
        canEdit = userLevel >= 2;
      }
    }

    if (!canEdit) {
      return ApiErrors.FORBIDDEN();
    }

    // Prevent nested subtasks
    if (parentTask.subtaskOfId) {
      return error("Cannot create nested subtasks. Only one level of subtask hierarchy is supported.", 400, "NESTED_SUBTASK_NOT_ALLOWED");
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      return ApiErrors.MISSING_REQUIRED_FIELD("title");
    }

    const subtask = await db.task.create({
      data: {
        userId: parentTask.userId,
        projectId: parentTask.projectId,
        title: title.trim(),
        description: description?.trim() || null,
        subtaskOfId: parentTask.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        completed: true,
        progress: true,
        assignedToBotId: true,
        assignedToBot: {
          select: { id: true, name: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(subtask, 201);
  });
}
