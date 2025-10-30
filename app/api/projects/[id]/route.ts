import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/projects/[id] - Get a specific project
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

    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return ApiErrors.NOT_FOUND("Project");
    }

    // Check ownership
    if (project.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    return success(project);
  });
}

/**
 * PATCH /api/projects/[id] - Update a project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { name, color, description } = body;

    // Find project
    const project = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return ApiErrors.NOT_FOUND("Project");
    }

    // Check ownership
    if (project.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    // Update project
    const updated = await db.project.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description: description?.trim() }),
      },
    });

    return success(updated);
  });
}

/**
 * DELETE /api/projects/[id] - Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Find project
    const project = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return ApiErrors.NOT_FOUND("Project");
    }

    // Check ownership
    if (project.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    // Delete project (cascade deletes tasks)
    await db.project.delete({
      where: { id: params.id },
    });

    return success({ message: "Project deleted" });
  });
}
