import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";
import crypto from "crypto";
import { sendTeamInvitationNotification } from "@/lib/notificationService";

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).default("VIEWER"),
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

  return { allowed: userLevel >= requiredLevel };
}

/**
 * POST /api/teams/[id]/invitations - Send team invitation (ADMIN only)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId } = params;

    // Check if user is ADMIN
    const access = await checkTeamAccess(teamId, auth.userId, "ADMIN");
    if (!access.allowed) {
      return ApiErrors.FORBIDDEN("You must be a team admin to invite members");
    }

    const body = await request.json();
    const { email, role } = inviteMemberSchema.parse(body);

    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.toLowerCase();

    // Check team exists
    const team = await db.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return ApiErrors.NOT_FOUND("Team not found");
    }

    // Check if user is already a member or invited
    const existingMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: { contains: normalizedEmail }, // This is a rough check - in production, you'd have User relation
      },
    });

    const existingInvitation = await db.teamInvitation.findFirst({
      where: {
        teamId,
        email: normalizedEmail,
        expiresAt: { gt: new Date() }, // Only check non-expired invitations
      },
    });

    if (existingInvitation) {
      return ApiErrors.INVALID_INPUT("An invitation has already been sent to this email");
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await db.teamInvitation.create({
      data: {
        teamId,
        email: normalizedEmail,
        role,
        token,
        expiresAt,
        createdBy: auth.userId,
      },
    });

    // Get inviter name
    const inviter = await db.user.findUnique({
      where: { id: auth.userId },
      select: { firstName: true, lastName: true },
    });
    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}`.trim() : "A team member";

    // Send invitation email and create notifications
    try {
      await sendTeamInvitationNotification(
        normalizedEmail,
        teamId,
        team.name,
        inviterName,
        role,
        invitation.token
      );
    } catch (emailError) {
      console.error("[API] Failed to send invitation email:", emailError);
      // Don't fail the API call if email fails - invitation is still created
    }

    return success(
      {
        id: invitation.id,
        email: normalizedEmail,
        role: invitation.role,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      },
      "Invitation sent successfully"
    );
  });
}

/**
 * GET /api/teams/[id]/invitations - Get pending invitations (ADMIN only)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId } = params;

    // Check if user is ADMIN
    const access = await checkTeamAccess(teamId, auth.userId, "ADMIN");
    if (!access.allowed) {
      return ApiErrors.FORBIDDEN("You must be a team admin to view invitations");
    }

    // Get pending invitations
    const invitations = await db.teamInvitation.findMany({
      where: {
        teamId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return success(invitations);
  });
}
