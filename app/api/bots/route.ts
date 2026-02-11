import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/bots - Fetch active bots available for a project
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return ApiErrors.MISSING_REQUIRED_FIELD("projectId");
    }

    // Verify the project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiErrors.NOT_FOUND("Project");
    }

    // Check access: personal project owner or team member
    const isOwner = project.userId === auth.userId;
    let hasAccess = isOwner;

    if (project.teamId && !isOwner) {
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: project.teamId,
          userId: auth.userId,
          acceptedAt: { not: null },
        },
      });
      hasAccess = !!teamMember;
    }

    if (!hasAccess) {
      return ApiErrors.FORBIDDEN();
    }

    // Find active bots whose projectIds include this project
    const allActiveBots = await db.bot.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        projectIds: true,
      },
    });

    const bots = allActiveBots
      .filter((bot) => bot.projectIds.includes(projectId))
      .map(({ projectIds, ...bot }) => bot);

    return success(bots);
  });
}
