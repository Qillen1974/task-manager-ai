import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/projects - List all projects for the user
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const projects = await db.project.findMany({
      where: { userId: auth.userId },
      include: {
        tasks: {
          select: {
            id: true,
            completed: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add task counts
    const projectsWithCounts = projects.map((project) => ({
      ...project,
      taskCount: project.tasks.length,
      completedCount: project.tasks.filter((t) => t.completed).length,
    }));

    return success(projectsWithCounts);
  });
}

/**
 * POST /api/projects - Create a new project
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { name, color, description } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return ApiErrors.MISSING_REQUIRED_FIELD("name");
    }

    // Check project limit
    const projectCount = await db.project.count({
      where: { userId: auth.userId },
    });

    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (projectCount >= (subscription?.projectLimit || 3)) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("project");
    }

    // Create project
    const project = await db.project.create({
      data: {
        userId: auth.userId,
        name: name.trim(),
        color: color || "blue",
        description: description?.trim(),
      },
    });

    return success(project, 201);
  });
}
