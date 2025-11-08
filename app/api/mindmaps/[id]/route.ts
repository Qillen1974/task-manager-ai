import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/mindmaps/[id] - Get a specific mind map
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

    const { id } = params;

    const mindMap = await db.mindMap.findUnique({
      where: { id },
    });

    if (!mindMap) {
      return ApiErrors.NOT_FOUND("Mind map not found");
    }

    // Verify ownership
    if (mindMap.userId !== auth.userId) {
      return ApiErrors.UNAUTHORIZED("You do not have access to this mind map");
    }

    // Parse and return mind map with nodes/edges
    return success({
      ...mindMap,
      nodes: JSON.parse(mindMap.nodes),
      edges: JSON.parse(mindMap.edges),
    });
  });
}

/**
 * PATCH /api/mindmaps/[id] - Update a mind map
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

    const { id } = params;

    const mindMap = await db.mindMap.findUnique({
      where: { id },
    });

    if (!mindMap) {
      return ApiErrors.NOT_FOUND("Mind map not found");
    }

    // Verify ownership
    if (mindMap.userId !== auth.userId) {
      return ApiErrors.UNAUTHORIZED("You do not have access to this mind map");
    }

    // Don't allow updates to converted mind maps
    if (mindMap.isConverted) {
      return ApiErrors.INVALID_REQUEST("Cannot update a converted mind map");
    }

    const body = await request.json();
    const { title, description, nodes, edges } = body;

    // Validate if provided
    if (nodes && !Array.isArray(nodes)) {
      return ApiErrors.INVALID_REQUEST("Nodes must be an array");
    }

    if (edges && !Array.isArray(edges)) {
      return ApiErrors.INVALID_REQUEST("Edges must be an array");
    }

    // Get subscription if updating nodes
    let nodeValidation = true;
    if (nodes) {
      const subscription = await db.subscription.findUnique({
        where: { userId: auth.userId },
      });

      if (subscription) {
        const { canCreateMindMapWithNodes } = await import(
          "@/lib/projectLimits"
        );
        const check = canCreateMindMapWithNodes(
          subscription.plan,
          nodes.length
        );
        nodeValidation = check.allowed;
      }
    }

    if (!nodeValidation) {
      return ApiErrors.LIMIT_EXCEEDED(
        "Mind map exceeds node limit for your subscription"
      );
    }

    // Update mind map
    const updated = await db.mindMap.update({
      where: { id },
      data: {
        title: title !== undefined ? title : mindMap.title,
        description: description !== undefined ? description : mindMap.description,
        nodes: nodes !== undefined ? JSON.stringify(nodes) : mindMap.nodes,
        edges: edges !== undefined ? JSON.stringify(edges) : mindMap.edges,
        nodeCount: nodes ? nodes.length : mindMap.nodeCount,
        updatedAt: new Date(),
      },
    });

    return success({
      ...updated,
      nodes: JSON.parse(updated.nodes),
      edges: JSON.parse(updated.edges),
    });
  });
}

/**
 * DELETE /api/mindmaps/[id] - Delete a mind map
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

    const { id } = params;

    const mindMap = await db.mindMap.findUnique({
      where: { id },
    });

    if (!mindMap) {
      return ApiErrors.NOT_FOUND("Mind map not found");
    }

    // Verify ownership
    if (mindMap.userId !== auth.userId) {
      return ApiErrors.UNAUTHORIZED("You do not have access to this mind map");
    }

    // Delete mind map
    await db.mindMap.delete({
      where: { id },
    });

    return success({ message: "Mind map deleted successfully" });
  });
}
