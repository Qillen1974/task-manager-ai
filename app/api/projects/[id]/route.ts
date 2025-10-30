import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/projects/[id] - Get a specific project with hierarchy
 * Optional query: includeChildren=true, includeParent=true
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

    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get("includeChildren") === "true";
    const includeParent = searchParams.get("includeParent") === "true";

    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
        parentProject: includeParent ? true : false,
        childProjects: includeChildren ? {
          include: {
            tasks: true,
          },
          orderBy: { name: "asc" },
        } : false,
      },
    });

    if (!project) {
      return ApiErrors.NOT_FOUND("Project");
    }

    // Check ownership
    if (project.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    // Calculate task stats
    const taskCount = project.tasks.length;
    const completedCount = project.tasks.filter((t) => t.completed).length;
    const childTaskCount = includeChildren && (project as any).childProjects
      ? (project as any).childProjects.reduce((sum: number, child: any) => sum + child.tasks.length, 0)
      : 0;

    return success({
      ...project,
      taskStats: {
        total: taskCount,
        completed: completedCount,
        pending: taskCount - completedCount,
        childProjectTasks: childTaskCount,
      },
    });
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
    const { name, color, description, status, startDate, endDate, owner, budget, budget_currency } = body;

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

    // Validate status if provided
    const validStatuses = ["ACTIVE", "ARCHIVED", "COMPLETED", "ON_HOLD"];
    if (status && !validStatuses.includes(status)) {
      return ApiErrors.INVALID_INPUT("Invalid status");
    }

    // Update project
    const updated = await db.project.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(owner !== undefined && { owner: owner?.trim() }),
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
        ...(budget_currency !== undefined && { budget_currency }),
      },
    });

    return success(updated);
  });
}

/**
 * DELETE /api/projects/[id] - Delete a project with cascade delete
 * Deletes: project, all subprojects, and all associated tasks
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

    // Find project with all descendants
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        childProjects: {
          select: { id: true },
        },
        tasks: {
          select: { id: true },
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

    // Recursively get all descendant project IDs
    const getAllDescendantIds = async (projectId: string): Promise<string[]> => {
      const children = await db.project.findMany({
        where: { parentProjectId: projectId },
        select: { id: true },
      });

      const childIds = children.map((c) => c.id);
      const allDescendants: string[] = [projectId, ...childIds];

      for (const childId of childIds) {
        const descendants = await getAllDescendantIds(childId);
        allDescendants.push(...descendants.filter((d) => !allDescendants.includes(d)));
      }

      return allDescendants;
    };

    const projectsToDelete = await getAllDescendantIds(params.id);

    // Delete all tasks in these projects
    await db.task.deleteMany({
      where: {
        projectId: {
          in: projectsToDelete,
        },
      },
    });

    // Delete all projects (parent first to handle cascades)
    for (const projectId of projectsToDelete) {
      await db.project.delete({
        where: { id: projectId },
      });
    }

    return success({
      message: "Project and all subprojects deleted successfully",
      deletedProjectCount: projectsToDelete.length,
      deletedTaskCount: project.tasks.length,
    });
  });
}
