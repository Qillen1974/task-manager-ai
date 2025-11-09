import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";

const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

const removeMemberSchema = z.object({
  userId: z.string(),
});

/**
 * Helper to check team access
 */
async function checkTeamAccess(teamId: string, userId: string, requiredRole: "ADMIN" | "EDITOR" | "VIEWER" = "VIEWER") {
  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId,
      acceptedAt: { not: null },
    },
  });

  if (!membership) {
    return { allowed: false };
  }

  const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
  const requiredLevel = roleHierarchy[requiredRole];
  const userLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy];

  return { allowed: userLevel >= requiredLevel, membership };
}

/**
 * PATCH /api/teams/[id]/members - Update a member's role (ADMIN only)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId } = params;

    // Check if user is ADMIN
    const access = await checkTeamAccess(teamId, auth.userId, "ADMIN");
    if (!access.allowed) {
      return ApiErrors.FORBIDDEN("You must be a team admin to manage members");
    }

    const body = await request.json();
    const { userId, role } = z.object({
      userId: z.string(),
      role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
    }).parse(body);

    // Can't change your own role
    if (userId === auth.userId) {
      return ApiErrors.INVALID_INPUT("You cannot change your own role");
    }

    // Check member exists in team
    const member = await db.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!member) {
      return ApiErrors.NOT_FOUND("Member not found in team");
    }

    // Update the member's role
    const updated = await db.teamMember.update({
      where: { id: member.id },
      data: { role },
    });

    return success(updated, "Member role updated successfully");
  });
}

/**
 * DELETE /api/teams/[id]/members - Remove a member from team (ADMIN only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId } = params;
    const body = await request.json();
    const { userId } = removeMemberSchema.parse(body);

    // Check if user is ADMIN
    const access = await checkTeamAccess(teamId, auth.userId, "ADMIN");
    if (!access.allowed) {
      return ApiErrors.FORBIDDEN("You must be a team admin to manage members");
    }

    // Can't remove yourself
    if (userId === auth.userId) {
      return ApiErrors.INVALID_INPUT("You cannot remove yourself from the team");
    }

    // Check member exists
    const member = await db.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!member) {
      return ApiErrors.NOT_FOUND("Member not found in team");
    }

    // Delete the member
    await db.teamMember.delete({
      where: { id: member.id },
    });

    return success(null, "Member removed from team");
  });
}
