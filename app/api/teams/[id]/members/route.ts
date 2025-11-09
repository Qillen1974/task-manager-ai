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
 * GET /api/teams/[id]/members - Get all team members
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId } = params;

    // Check if user is a team member
    const access = await checkTeamAccess(teamId, auth.userId, "VIEWER");
    if (!access.allowed) {
      return ApiErrors.FORBIDDEN("You are not a member of this team");
    }

    // Get all team members
    const members = await db.teamMember.findMany({
      where: {
        teamId,
        acceptedAt: { not: null }, // Only accepted members
      },
      select: {
        userId: true,
        role: true,
      },
    });

    // Get user details for all members
    const userIds = members.map(m => m.userId);
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Create a map of user data
    const userMap = new Map(users.map(u => [u.id, u]));

    // Format the response with user information
    const formattedMembers = members.map((member) => {
      const user = userMap.get(member.userId);
      const displayName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.lastName || user?.email || member.userId;

      return {
        userId: member.userId,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        name: displayName,
        role: member.role,
      };
    });

    return success(formattedMembers);
  });
}

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
