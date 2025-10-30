import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { canCreateRootProject, canCreateSubproject } from "@/lib/projectLimits";

/**
 * GET /api/projects - List all projects for the user
 * Returns root projects by default.
 * Optional query: includeAll=true to get all projects (including non-root)
 * Optional query: includeChildren=true to get full tree structure
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get("includeChildren") === "true";
    const includeAll = searchParams.get("includeAll") === "true";

    // Get projects - root projects only by default, or all if requested
    const where: any = {
      userId: auth.userId,
    };

    // Only filter for root projects if not requesting all
    if (!includeAll) {
      where.parentProjectId = null;
    }

    const projects = await db.project.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            completed: true,
          },
        },
        childProjects: includeChildren ? {
          include: {
            tasks: {
              select: {
                id: true,
                completed: true,
              },
            },
          },
        } : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Add task counts
    const projectsWithCounts = projects.map((project) => {
      const allTasks = [
        ...project.tasks,
        ...(includeChildren && project.childProjects
          ? project.childProjects.flatMap((cp: any) => cp.tasks)
          : []),
      ];

      return {
        ...project,
        taskCount: allTasks.length,
        completedCount: allTasks.filter((t) => t.completed).length,
      };
    });

    return success(projectsWithCounts);
  });
}

/**
 * GET /api/projects/tree - Get full project hierarchy tree
 */
export async function getProjectTree(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const buildTree = async (parentId: string | null = null): Promise<any[]> => {
      const projects = await db.project.findMany({
        where: {
          userId: auth.userId,
          parentProjectId: parentId,
        },
        include: {
          tasks: {
            select: { id: true, completed: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return Promise.all(
        projects.map(async (project: any) => {
          const children = await buildTree(project.id);
          return {
            ...project,
            taskCount: project.tasks.length,
            completedCount: project.tasks.filter((t) => t.completed).length,
            children,
          };
        })
      );
    };

    const tree = await buildTree();
    return success(tree);
  });
}

/**
 * POST /api/projects - Create a new project (root or subproject)
 * Body: { name, color, description, parentProjectId? }
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { name, color, description, parentProjectId, startDate, endDate, owner } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return ApiErrors.MISSING_REQUIRED_FIELD("name");
    }

    // Get user subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (!subscription) {
      return ApiErrors.UNAUTHORIZED();
    }

    // Determine if this is a root project or subproject
    if (!parentProjectId) {
      // Creating a root project
      const rootProjectCount = await db.project.count({
        where: {
          userId: auth.userId,
          parentProjectId: null,
        },
      });

      const canCreate = canCreateRootProject(subscription.plan, rootProjectCount);
      if (!canCreate.allowed) {
        return {
          success: false,
          error: {
            message: canCreate.message || "Cannot create project",
            code: "LIMIT_EXCEEDED",
          },
        };
      }

      // Create root project
      const project = await db.project.create({
        data: {
          userId: auth.userId,
          name: name.trim(),
          color: color || "blue",
          description: description?.trim(),
          projectLevel: 0,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          owner: owner?.trim(),
        },
      });

      return success(project, 201);
    } else {
      // Creating a subproject
      // First, verify parent project exists and belongs to user
      const parentProject = await db.project.findUnique({
        where: { id: parentProjectId },
      });

      if (!parentProject || parentProject.userId !== auth.userId) {
        return ApiErrors.NOT_FOUND("parent project");
      }

      // Check if user can create subprojects
      const canCreate = canCreateSubproject(subscription.plan, parentProject.projectLevel);
      if (!canCreate.allowed) {
        return {
          success: false,
          error: {
            message: canCreate.message || "Cannot create subproject",
            code: "LIMIT_EXCEEDED",
          },
        };
      }

      // Create subproject
      const subproject = await db.project.create({
        data: {
          userId: auth.userId,
          parentProjectId: parentProjectId,
          name: name.trim(),
          color: color || parentProject.color, // Inherit parent color by default
          description: description?.trim(),
          projectLevel: parentProject.projectLevel + 1,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          owner: owner?.trim(),
        },
      });

      return success(subproject, 201);
    }
  });
}
