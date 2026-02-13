import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/tasks/[id]/artifacts/[artifactId] - Download a specific artifact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; artifactId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Find task and verify access
    const task = await db.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        project: {
          select: { teamId: true },
        },
      },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    const isOwner = task.userId === auth.userId;
    let canAccess = isOwner;

    if (task.project?.teamId && !isOwner) {
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: task.project.teamId,
          userId: auth.userId,
          acceptedAt: { not: null },
        },
      });
      canAccess = !!teamMember;
    }

    if (!canAccess) {
      return ApiErrors.FORBIDDEN();
    }

    const artifact = await db.taskArtifact.findFirst({
      where: {
        id: params.artifactId,
        taskId: params.id,
      },
      select: {
        id: true,
        taskId: true,
        botId: true,
        fileName: true,
        mimeType: true,
        content: true,
        sizeBytes: true,
        createdAt: true,
        bot: {
          select: { id: true, name: true },
        },
      },
    });

    if (!artifact) {
      return ApiErrors.NOT_FOUND("Artifact");
    }

    return success({
      id: artifact.id,
      taskId: artifact.taskId,
      fileName: artifact.fileName,
      mimeType: artifact.mimeType,
      content: artifact.content,
      sizeBytes: artifact.sizeBytes,
      author: artifact.botId
        ? { type: "bot" as const, name: artifact.bot?.name || "Bot" }
        : { type: "user" as const, name: "You" },
      createdAt: artifact.createdAt.toISOString(),
    });
  });
}
