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
 *
 * Flow for existing members to join teams:
 * 1. Team owner invites user@example.com
 * 2. User with existing account logs in
 * 3. User accepts invitation (their email must match invitation email)
 * 4. User is added to team with specified role
 *
 * This ensures only the intended recipient can accept the invitation.
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

    // Get current user's email
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    });

    if (!user) {
      return ApiErrors.NOT_FOUND("User not found");
    }

    // Email validation: ensure invited email matches current user's email
    // This ensures only the intended recipient can accept the invitation
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return ApiErrors.FORBIDDEN(
        "This invitation was sent to a different email address. " +
        "You're currently logged in as " + user.email
      );
    }

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

    // Create team membership for existing user
    const membership = await db.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: auth.userId,
        role: invitation.role,
        acceptedAt: new Date(),
        invitedBy: invitation.createdBy,
      },
    });

    // Delete the invitation after acceptance
    await db.teamInvitation.delete({
      where: { id: invitation.id },
    });

    // Get the team with updated member list
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
      "Successfully joined team!"
    );
  });
}
