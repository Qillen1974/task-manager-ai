import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { canCreateRootProject, canCreateSubproject } from "@/lib/projectLimits";

/**
 * GET /api/projects - List all projects for the user
 * Returns root projects by default.
 * Includes both personal projects and team projects user is a member of.
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

    // Get user's team memberships
    const teamMemberships = await db.teamMember.findMany({
      where: {
        userId: auth.userId,
        acceptedAt: { not: null }, // Only accepted memberships
      },
      select: { teamId: true },
    });

    const userTeamIds = teamMemberships.map((tm) => tm.teamId);

    // Get projects - root projects only by default, or all if requested
    // Include both personal projects (userId = auth.userId) and team projects (teamId in userTeamIds)
    const where: any = {
      OR: [
        { userId: auth.userId }, // Personal projects
        ...(userTeamIds.length > 0 ? [{ teamId: { in: userTeamIds } }] : []), // Team projects
      ],
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
 * POST /api/projects - Create a new project (root, subproject, or team project)
 * Body: { name, color, description, parentProjectId?, teamId? }
 *
 * For team projects:
 * - teamId: ID of the team (ENTERPRISE feature)
 * - User must be EDITOR or ADMIN in the team
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { name, color, description, parentProjectId, teamId, startDate, endDate, owner } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return ApiErrors.MISSING_REQUIRED_FIELD("name");
    }

    // Get user with subscription and mobile unlock status
    let user;
    try {
      user = await db.user.findUnique({
        where: { id: auth.userId },
        include: { subscription: true },
      });
    } catch (err) {
      console.error("[API] Failed to fetch user:", err);
      throw err;
    }

    if (!user || !user.subscription) {
      console.warn("[API] No user or subscription found for:", auth.userId);
      return ApiErrors.UNAUTHORIZED();
    }

    const subscription = user.subscription;
    const mobileUnlocked = user.mobileUnlocked || false;

    // If creating a team project, validate team access
    if (teamId) {
      // Team projects are ENTERPRISE feature
      if (subscription.plan !== "ENTERPRISE") {
        return ApiErrors.FORBIDDEN("Team projects are only available to ENTERPRISE members");
      }

      // Verify user is a member of the team and has EDITOR or ADMIN role
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId,
          userId: auth.userId,
          acceptedAt: { not: null }, // Only accepted members
        },
      });

      if (!teamMember) {
        return ApiErrors.FORBIDDEN("You must be a member of the team to create projects");
      }

      const roleHierarchy = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
      const userLevel = roleHierarchy[teamMember.role as keyof typeof roleHierarchy];

      if (userLevel < 2) {
        // EDITOR or higher required
        return ApiErrors.FORBIDDEN("You must be an EDITOR or ADMIN to create team projects");
      }

      // Verify team exists
      const team = await db.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        return ApiErrors.NOT_FOUND("Team not found");
      }
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

      const canCreate = canCreateRootProject(subscription.plan, rootProjectCount, mobileUnlocked);
      if (!canCreate.allowed) {
        return ApiErrors.RESOURCE_LIMIT_EXCEEDED("root projects");
      }

      // Create root project
      const project = await db.project.create({
        data: {
          userId: auth.userId,
          teamId: teamId || undefined,
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
      const canCreate = canCreateSubproject(subscription.plan, parentProject.projectLevel, mobileUnlocked);
      if (!canCreate.allowed) {
        return ApiErrors.RESOURCE_LIMIT_EXCEEDED("subprojects");
      }

      // Create subproject
      const subproject = await db.project.create({
        data: {
          userId: auth.userId,
          teamId: teamId || parentProject.teamId || undefined, // Inherit teamId from parent if not specified
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
