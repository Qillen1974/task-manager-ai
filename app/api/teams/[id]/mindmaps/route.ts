import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import {
  canViewMindMap,
  canCreateTeamMindMap,
  canEditMindMap,
} from "@/lib/mindMapPermissions";

/**
 * GET /api/teams/[id]/mindmaps - List team mind maps
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

    const { id: teamId } = params;

    // Verify team exists and user is a member
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return ApiErrors.NOT_FOUND("Team");
    }

    const teamMember = team.members.find(
      (m) => m.userId === auth.userId && m.acceptedAt !== null
    );

    if (!teamMember) {
      return ApiErrors.FORBIDDEN("You are not a member of this team");
    }

    // Get team mind maps
    const mindMaps = await db.mindMap.findMany({
      where: {
        teamId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        nodeCount: true,
        isConverted: true,
        convertedAt: true,
        createdBy: true,
        lastModifiedBy: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch user data for createdBy and lastModifiedBy
    const userIds = [
      ...new Set(
        mindMaps
          .flatMap((m) => [m.createdBy, m.lastModifiedBy])
          .filter((id) => id !== null)
      ),
    ];

    const users = await db.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Format response with user details
    const formattedMaps = mindMaps.map((m) => ({
      ...m,
      createdByUser: m.createdBy ? userMap.get(m.createdBy) : null,
      lastModifiedByUser: m.lastModifiedBy ? userMap.get(m.lastModifiedBy) : null,
    }));

    return success(formattedMaps);
  });
}

/**
 * POST /api/teams/[id]/mindmaps - Create team mind map
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

    const { id: teamId } = params;

    // Check subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (!subscription || subscription.plan !== "ENTERPRISE") {
      return error(
        "Team mind maps require ENTERPRISE subscription",
        403,
        "SUBSCRIPTION_REQUIRED"
      );
    }

    // Check if user can create team mind map
    const canCreate = await canCreateTeamMindMap(auth.userId, teamId);
    if (!canCreate.allowed) {
      return error(canCreate.reason || "Permission denied", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const { title, description, nodes = "[]", edges = "[]" } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return ApiErrors.MISSING_REQUIRED_FIELD("title");
    }

    // Parse nodes to count them
    let nodeCount = 0;
    try {
      const nodesArray = JSON.parse(nodes);
      nodeCount = Array.isArray(nodesArray) ? nodesArray.length : 0;
    } catch (e) {
      return error("Invalid nodes JSON format", 400, "INVALID_FORMAT");
    }

    // Check mind map count limit for team (ENTERPRISE: unlimited)
    // Currently no limit for ENTERPRISE, but can be added later

    // Create mind map
    const mindMap = await db.mindMap.create({
      data: {
        teamId,
        userId: null, // Team-owned, not user-owned
        title: title.trim(),
        description: description?.trim(),
        nodes,
        edges,
        nodeCount,
        createdBy: auth.userId,
        lastModifiedBy: auth.userId,
        visibility: "TEAM",
      },
      select: {
        id: true,
        title: true,
        description: true,
        nodeCount: true,
        isConverted: true,
        convertedAt: true,
        createdBy: true,
        lastModifiedBy: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(mindMap, 201);
  });
}
