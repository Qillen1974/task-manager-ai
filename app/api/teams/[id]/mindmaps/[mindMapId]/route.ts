import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import {
  canViewMindMap,
  canEditMindMap,
  canDeleteMindMap,
} from "@/lib/mindMapPermissions";

/**
 * GET /api/teams/[id]/mindmaps/[mindMapId] - Get specific team mind map
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; mindMapId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId, mindMapId } = params;

    // Get mind map
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
    });

    if (!mindMap) {
      return ApiErrors.NOT_FOUND("Mind map");
    }

    // Verify it belongs to the team
    if (mindMap.teamId !== teamId) {
      return ApiErrors.NOT_FOUND("Mind map");
    }

    // Check access permission
    const canView = await canViewMindMap(auth.userId, mindMapId);
    if (!canView.allowed) {
      return error(canView.reason || "Permission denied", 403, "FORBIDDEN");
    }

    return success(mindMap);
  });
}

/**
 * PATCH /api/teams/[id]/mindmaps/[mindMapId] - Update team mind map
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; mindMapId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId, mindMapId } = params;

    // Get mind map
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
    });

    if (!mindMap) {
      return ApiErrors.NOT_FOUND("Mind map");
    }

    // Verify it belongs to the team
    if (mindMap.teamId !== teamId) {
      return ApiErrors.NOT_FOUND("Mind map");
    }

    // Check edit permission
    const canEdit = await canEditMindMap(auth.userId, mindMapId);
    if (!canEdit.allowed) {
      return error(canEdit.reason || "Permission denied", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const { title, description, nodes, edges } = body;

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return ApiErrors.MISSING_REQUIRED_FIELD("title");
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (nodes !== undefined) {
      try {
        const nodesArray = JSON.parse(nodes);
        updateData.nodes = nodes;
        updateData.nodeCount = Array.isArray(nodesArray) ? nodesArray.length : 0;
      } catch (e) {
        return error("Invalid nodes JSON format", 400, "INVALID_FORMAT");
      }
    }

    if (edges !== undefined) {
      try {
        JSON.parse(edges);
        updateData.edges = edges;
      } catch (e) {
        return error("Invalid edges JSON format", 400, "INVALID_FORMAT");
      }
    }

    // Track who modified it
    updateData.lastModifiedBy = auth.userId;
    updateData.updatedAt = new Date();

    // Update mind map
    const updated = await db.mindMap.update({
      where: { id: mindMapId },
      data: updateData,
    });

    return success(updated);
  });
}

/**
 * DELETE /api/teams/[id]/mindmaps/[mindMapId] - Delete team mind map
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; mindMapId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId, mindMapId } = params;

    // Get mind map
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
    });

    if (!mindMap) {
      return ApiErrors.NOT_FOUND("Mind map");
    }

    // Verify it belongs to the team
    if (mindMap.teamId !== teamId) {
      return ApiErrors.NOT_FOUND("Mind map");
    }

    // Check delete permission
    const canDelete = await canDeleteMindMap(auth.userId, mindMapId);
    if (!canDelete.allowed) {
      return error(canDelete.reason || "Permission denied", 403, "FORBIDDEN");
    }

    // Delete mind map
    await db.mindMap.delete({
      where: { id: mindMapId },
    });

    return success({ message: "Mind map deleted" });
  });
}
