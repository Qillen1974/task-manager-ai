import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";

const updateAssignmentSchema = z.object({
  role: z.enum(["OWNER", "COLLABORATOR", "REVIEWER"]),
});

/**
 * PATCH /api/tasks/[id]/assignments/[assignmentId] - Update assignment role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { role } = updateAssignmentSchema.parse(body);

    // Get task with project
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check permission
    const isOwner = task.userId === auth.userId;
    let canUpdate = isOwner;

    if (task.project?.teamId && !isOwner) {
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
        canUpdate = userLevel >= 2;
      }
    }

    if (!canUpdate) {
      return ApiErrors.FORBIDDEN();
    }

    // Get assignment
    const assignment = await db.taskAssignment.findUnique({
      where: { id: params.assignmentId },
    });

    if (!assignment || assignment.taskId !== params.id) {
      return ApiErrors.NOT_FOUND("Assignment");
    }

    // Update role
    const updated = await db.taskAssignment.update({
      where: { id: params.assignmentId },
      data: { role },
    });

    return success(updated);
  });
}

/**
 * DELETE /api/tasks/[id]/assignments/[assignmentId] - Remove task assignment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Get task with project
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check permission
    const isOwner = task.userId === auth.userId;
    let canDelete = isOwner;

    if (task.project?.teamId && !isOwner) {
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
        canDelete = userLevel >= 2;
      }
    }

    if (!canDelete) {
      return ApiErrors.FORBIDDEN();
    }

    // Get assignment
    const assignment = await db.taskAssignment.findUnique({
      where: { id: params.assignmentId },
    });

    if (!assignment || assignment.taskId !== params.id) {
      return ApiErrors.NOT_FOUND("Assignment");
    }

    // Delete assignment
    await db.taskAssignment.delete({
      where: { id: params.assignmentId },
    });

    return success({ message: "Assignment removed" });
  });
}
