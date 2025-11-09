import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/teams/pending-invitations - Get all pending invitations for the current user
 *
 * Returns invitations that have been sent to the user's email address and haven't expired
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Get the user's email
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    });

    if (!user) {
      return ApiErrors.NOT_FOUND("User not found");
    }

    // Get all pending invitations for this user's email
    const normalizedUserEmail = user.email.toLowerCase();
    const invitations = await db.teamInvitation.findMany({
      where: {
        email: normalizedUserEmail,
        expiresAt: { gt: new Date() }, // Only non-expired invitations
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            ownerId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response to include team info
    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      token: inv.token,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      team: inv.team,
    }));

    return success(formattedInvitations);
  });
}
