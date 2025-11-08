import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { canCreateMindMap, canCreateMindMapWithNodes } from "@/lib/projectLimits";

/**
 * GET /api/mindmaps - List all mind maps for the user
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const includeConverted = searchParams.get("includeConverted") === "true";

    const where: any = {
      userId: auth.userId,
    };

    // Filter out converted mind maps by default
    if (!includeConverted) {
      where.isConverted = false;
    }

    const mindMaps = await db.mindMap.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        nodeCount: true,
        isConverted: true,
        convertedAt: true,
        rootProjectId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(mindMaps);
  });
}

/**
 * POST /api/mindmaps - Create a new mind map
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { title, description, nodes, edges } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return ApiErrors.INVALID_INPUT({ message: "Title is required" });
    }

    if (!Array.isArray(nodes)) {
      return ApiErrors.INVALID_INPUT({ message: "Nodes must be an array" });
    }

    if (!Array.isArray(edges)) {
      return ApiErrors.INVALID_INPUT({ message: "Edges must be an array" });
    }

    // Get user subscription to check limits
    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (!subscription) {
      return ApiErrors.USER_NOT_FOUND();
    }

    // Check if user can create mind maps
    const mindMapCount = await db.mindMap.count({
      where: { userId: auth.userId },
    });

    const canCreate = canCreateMindMap(subscription.plan, mindMapCount);
    if (!canCreate.allowed) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("mind maps");
    }

    // Check if mind map can have this many nodes
    const nodeCheck = canCreateMindMapWithNodes(subscription.plan, nodes.length);
    if (!nodeCheck.allowed) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("nodes per mind map");
    }

    // Create mind map
    const mindMap = await db.mindMap.create({
      data: {
        userId: auth.userId,
        title: title.trim(),
        description: description || null,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        nodeCount: nodes.length,
      },
    });

    // Return mind map with parsed nodes/edges
    return success(
      {
        ...mindMap,
        nodes: JSON.parse(mindMap.nodes),
        edges: JSON.parse(mindMap.edges),
      },
      201
    );
  });
}
