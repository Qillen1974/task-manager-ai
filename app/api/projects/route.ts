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

    // Build the recursive include structure for childProjects
    const buildChildProjectsInclude = (depth: number = 3): any => {
      if (depth <= 0) return false;
      return {
        include: {
          tasks: {
            select: {
              id: true,
              completed: true,
            },
          },
          childProjects: buildChildProjectsInclude(depth - 1),
        },
      };
    };

    const includeObj: any = {
      tasks: {
        select: {
          id: true,
          completed: true,
        },
      },
    };

    if (includeChildren) {
      includeObj.childProjects = buildChildProjectsInclude(3);
    }

    const projects = await db.project.findMany({
      where,
      include: includeObj,
      orderBy: { createdAt: "desc" },
    });

    // Recursive function to transform and add task counts
    const transformProject = (project: any): any => {
      const allTasks = [
        ...project.tasks,
        ...(project.childProjects
          ? project.childProjects.flatMap((cp: any) => [
              ...cp.tasks,
              ...(cp.childProjects ? cp.childProjects.flatMap((cpp: any) => cpp.tasks) : []),
            ])
          : []),
      ];

      return {
        ...project,
        children: project.childProjects?.map(transformProject),
        taskCount: allTasks.length,
        completedCount: allTasks.filter((t) => t.completed).length,
      };
    };

    const projectsWithCounts = projects.map(transformProject);

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
    let subscription;
    try {
      subscription = await db.subscription.findUnique({
        where: { userId: auth.userId },
      });
    } catch (err) {
      console.error("[API] Failed to fetch subscription:", err);
      // If subscription query fails, return error
      throw err;
    }

    if (!subscription) {
      console.warn("[API] No subscription found for user:", auth.userId);
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
        return ApiErrors.RESOURCE_LIMIT_EXCEEDED("root projects");
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
        return ApiErrors.RESOURCE_LIMIT_EXCEEDED("subprojects");
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
