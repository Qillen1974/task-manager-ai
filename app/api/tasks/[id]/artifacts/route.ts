import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";

const MAX_ARTIFACT_SIZE = 1_000_000; // 1MB

/**
 * GET /api/tasks/[id]/artifacts - List all artifacts for a task (metadata only)
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

    // Check access: user must be creator OR team member
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

    const artifacts = await db.taskArtifact.findMany({
      where: { taskId: params.id },
      select: {
        id: true,
        taskId: true,
        botId: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        bot: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = artifacts.map((a) => ({
      id: a.id,
      taskId: a.taskId,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      author: a.botId
        ? { type: "bot" as const, name: a.bot?.name || "Bot" }
        : { type: "user" as const, name: "You" },
      createdAt: a.createdAt.toISOString(),
    }));

    return success(formatted);
  });
}

/**
 * POST /api/tasks/[id]/artifacts - Upload a file attachment to a task
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

    const body = await request.json();
    const { fileName, mimeType, content } = body;

    if (!fileName) {
      return ApiErrors.MISSING_REQUIRED_FIELD("fileName");
    }
    if (!mimeType) {
      return ApiErrors.MISSING_REQUIRED_FIELD("mimeType");
    }
    if (!content) {
      return ApiErrors.MISSING_REQUIRED_FIELD("content");
    }

    const sizeBytes = Buffer.byteLength(content, "utf8");
    if (sizeBytes > MAX_ARTIFACT_SIZE) {
      return error(
        "Artifact too large. Maximum size is 1MB",
        413,
        "ARTIFACT_TOO_LARGE"
      );
    }

    const artifact = await db.taskArtifact.create({
      data: {
        taskId: params.id,
        botId: null, // User upload — no bot association
        fileName,
        mimeType,
        content,
        sizeBytes,
      },
    });

    return success(
      {
        id: artifact.id,
        taskId: artifact.taskId,
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        sizeBytes: artifact.sizeBytes,
        author: { type: "user" as const, name: "You" },
        createdAt: artifact.createdAt.toISOString(),
      },
      201
    );
  });
}
