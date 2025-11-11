import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Helper function to check if user is admin of the team
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
    return { allowed: false, error: ApiErrors.FORBIDDEN() };
  }

  // Check role hierarchy
  const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
  const requiredLevel = roleHierarchy[requiredRole];
  const userLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy];

  if (userLevel < requiredLevel) {
    return { allowed: false, error: ApiErrors.FORBIDDEN() };
  }

  return { allowed: true, membership };
}

/**
 * GET /api/teams/[id] - Get a single team with members
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id } = params;

    // Check access
    const access = await checkTeamAccess(id, auth.userId);
    if (!access.allowed) {
      return access.error;
    }

    // Get team with members
    const team = await db.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
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
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!team) {
      return ApiErrors.NOT_FOUND("Team not found");
    }

    return success({
      ...team,
      userRole: access.membership?.role,
    });
  });
}

/**
 * PATCH /api/teams/[id] - Update team settings (ADMIN only)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id } = params;

    // Check if user is ADMIN
    const access = await checkTeamAccess(id, auth.userId, "ADMIN");
    if (!access.allowed) {
      return access.error;
    }

    const body = await request.json();
    const data = updateTeamSchema.parse(body);

    // Update team
    const team = await db.team.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            acceptedAt: true,
            invitedAt: true,
          },
        },
      },
    });

    return success(team, "Team updated successfully");
  });
}

/**
 * DELETE /api/teams/[id] - Delete a team (ADMIN only, must be owner)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id } = params;

    // Get the team
    const team = await db.team.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!team) {
      return ApiErrors.NOT_FOUND("Team not found");
    }

    // Only owner can delete the team
    if (team.ownerId !== auth.userId) {
      return ApiErrors.FORBIDDEN("Only team owner can delete the team");
    }

    // Delete the team (cascade will handle members and invitations)
    await db.team.delete({
      where: { id },
    });

    return success(null, "Team deleted successfully");
  });
}
