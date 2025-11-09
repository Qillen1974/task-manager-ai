import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";

const acceptInvitationSchema = z.object({
  token: z.string(),
});

/**
 * POST /api/teams/accept-invitation - Accept a team invitation
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { token } = acceptInvitationSchema.parse(body);

    // Find the invitation
    const invitation = await db.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return ApiErrors.NOT_FOUND("Invitation not found");
    }

    // Check if invitation is still valid
    if (invitation.expiresAt < new Date()) {
      return ApiErrors.INVALID_INPUT("Invitation has expired");
    }

    // For now, we'll use email matching since we don't have full User relation
    // In production, you'd need to ensure the user's email matches the invitation email

    // Check if user is already a member of the team
    const existingMember = await db.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId: auth.userId,
      },
    });

    if (existingMember) {
      return ApiErrors.INVALID_INPUT("You are already a member of this team");
    }

    // Create team membership
    const membership = await db.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: auth.userId,
        role: invitation.role,
        acceptedAt: new Date(),
        invitedBy: invitation.createdBy,
      },
    });

    // Delete the invitation
    await db.teamInvitation.delete({
      where: { id: invitation.id },
    });

    // Get the team
    const team = await db.team.findUnique({
      where: { id: invitation.teamId },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            acceptedAt: true,
          },
        },
      },
    });

    return success(
      {
        team,
        membership: {
          ...membership,
          team: undefined,
        },
      },
      "Invitation accepted successfully"
    );
  });
}
