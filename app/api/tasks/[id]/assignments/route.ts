import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";
import { sendTaskAssignmentNotification } from "@/lib/notificationService";

const createAssignmentSchema = z.object({
  userId: z.string(),
  role: z.enum(["OWNER", "COLLABORATOR", "REVIEWER"]).default("COLLABORATOR"),
});

const updateAssignmentSchema = z.object({
  role: z.enum(["OWNER", "COLLABORATOR", "REVIEWER"]),
});

/**
 * POST /api/tasks/[id]/assignments - Assign a task to a team member
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

    const body = await request.json();
    const { userId, role } = createAssignmentSchema.parse(body);

    // Get task with project info
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Check if user has permission to assign tasks
    const isOwner = task.userId === auth.userId;
    let canAssign = isOwner;

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
        canAssign = userLevel >= 2; // EDITOR or higher
      }
    }

    if (!canAssign) {
      return ApiErrors.FORBIDDEN("You don't have permission to assign tasks");
    }

    // Verify the user being assigned is a team member (for team projects)
    if (task.project?.teamId) {
      const assigneeTeamMember = await db.teamMember.findFirst({
        where: {
          teamId: task.project.teamId,
          userId: userId,
          acceptedAt: { not: null },
        },
      });

      if (!assigneeTeamMember) {
        return ApiErrors.FORBIDDEN("User must be a team member to be assigned tasks");
      }
    }

    // Check if already assigned
    const existing = await db.taskAssignment.findFirst({
      where: {
        taskId: params.id,
        userId,
      },
    });

    if (existing) {
      return ApiErrors.INVALID_INPUT("User is already assigned to this task");
    }

    // Create assignment
    const assignment = await db.taskAssignment.create({
      data: {
        taskId: params.id,
        userId,
        role,
      },
    });

    // Get assigner name for notification
    const assigner = await db.user.findUnique({
      where: { id: auth.userId },
      select: { firstName: true, lastName: true },
    });
    const assignerName = assigner ? `${assigner.firstName} ${assigner.lastName}`.trim() : "A team member";

    // Send notification
    try {
      await sendTaskAssignmentNotification(
        userId,
        assignerName,
        params.id,
        task.title,
        task.project.name,
        task.dueDate,
        role
      );
    } catch (notificationError) {
      console.error("[API] Failed to send task assignment notification:", notificationError);
      // Don't fail the API call if notification fails
    }

    return success(assignment, "Task assigned successfully", 201);
  });
}

/**
 * GET /api/tasks/[id]/assignments - Get all assignments for a task
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

    // Get task
    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Get assignments
    const assignments = await db.taskAssignment.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return success(assignments);
  });
}
