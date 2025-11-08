import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import {
  canCreateRootProject,
  canCreateSubproject,
  canCreateMindMapWithNodes,
} from "@/lib/projectLimits";

interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  color?: string;
  parentId?: string | null;
  metadata?: Record<string, any>;
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * POST /api/mindmaps/[id]/convert - Convert a mind map to projects and tasks
 *
 * This endpoint converts a saved mind map into:
 * - A root project (from the mind map root)
 * - Subprojects (from mind map branches)
 * - Tasks (from mind map leaf nodes)
 * - Task dependencies (from mind map connections)
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

    const { id } = params;

    // Get the mind map
    const mindMap = await db.mindMap.findUnique({
      where: { id },
    });

    if (!mindMap) {
      return ApiErrors.NOT_FOUND("Mind map");
    }

    // Verify ownership
    if (mindMap.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN();
    }

    // Check if already converted
    if (mindMap.isConverted) {
      return ApiErrors.INVALID_INPUT({ message: "This mind map has already been converted" });
    }

    // Parse nodes and edges
    let nodes: MindMapNode[] = [];
    let edges: MindMapEdge[] = [];

    try {
      nodes = JSON.parse(mindMap.nodes);
      edges = JSON.parse(mindMap.edges);
    } catch (error) {
      return ApiErrors.INVALID_INPUT({ message: "Invalid mind map data format" });
    }

    if (nodes.length === 0) {
      return ApiErrors.INVALID_INPUT({ message: "Mind map must have at least one node" });
    }

    // Get subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (!subscription) {
      return ApiErrors.NOT_FOUND("Subscription");
    }

    // Find root node (node with no parent or first node)
    const rootNode = nodes.find((n) => !n.parentId) || nodes[0];

    // Get current project count to validate limits
    const rootProjectCount = await db.project.count({
      where: { userId: auth.userId, parentProjectId: null },
    });

    // Check if can create root project
    const canCreateRoot = canCreateRootProject(
      subscription.plan,
      rootProjectCount
    );
    if (!canCreateRoot.allowed) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("root projects");
    }

    // Validate node count against subscription limits
    const nodeCheck = canCreateMindMapWithNodes(subscription.plan, nodes.length);
    if (!nodeCheck.allowed) {
      return ApiErrors.RESOURCE_LIMIT_EXCEEDED("nodes per mind map");
    }

    try {
      // Determine if root project should be a subproject of an existing project
      const parentProjectId = rootNode.metadata?.parentProjectId;
      let rootProject: any;
      let rootProjectLevel = 0;

      if (parentProjectId) {
        // Create as subproject of existing project
        const parentProject = await db.project.findUnique({
          where: { id: parentProjectId },
        });

        if (!parentProject) {
          return ApiErrors.NOT_FOUND("Parent project");
        }

        if (parentProject.userId !== auth.userId) {
          return ApiErrors.FORBIDDEN();
        }

        // Check if we can create a subproject at this level
        const canCreateSub = canCreateSubproject(subscription.plan, parentProject.projectLevel);
        if (!canCreateSub.allowed) {
          return ApiErrors.RESOURCE_LIMIT_EXCEEDED("subprojects at this level");
        }

        rootProjectLevel = parentProject.projectLevel + 1;
        rootProject = await db.project.create({
          data: {
            userId: auth.userId,
            name: rootNode.label,
            description: rootNode.description || null,
            color: rootNode.color || "blue",
            parentProjectId,
            projectLevel: rootProjectLevel,
          },
        });
      } else {
        // Create as root project
        rootProject = await db.project.create({
          data: {
            userId: auth.userId,
            name: rootNode.label,
            description: rootNode.description || null,
            color: rootNode.color || "blue",
            projectLevel: 0,
          },
        });
      }

      // Map to track node IDs to created project/task IDs
      const nodeToIdMap = new Map<string, { type: "project" | "task"; id: string }>();
      nodeToIdMap.set(rootNode.id, { type: "project", id: rootProject.id });

      // Separate nodes into branches (projects) and leaves (tasks)
      const childNodes = nodes.filter((n) => n.id !== rootNode.id);
      const branchNodes: MindMapNode[] = [];
      const leafNodes: MindMapNode[] = [];

      // A node is a leaf if it has no children
      for (const node of childNodes) {
        const hasChildren = childNodes.some((n) => n.parentId === node.id);
        if (hasChildren) {
          branchNodes.push(node);
        } else {
          leafNodes.push(node);
        }
      }

      // Create subprojects from branch nodes
      for (const branchNode of branchNodes) {
        const parentNodeId = branchNode.parentId || rootNode.id;
        const parentMapping = nodeToIdMap.get(parentNodeId);

        if (!parentMapping) {
          continue;
        }

        // Only create as subproject if parent is a project
        if (parentMapping.type === "project") {
          const parentProject = await db.project.findUnique({
            where: { id: parentMapping.id },
          });

          if (parentProject) {
            // Check if can create subproject
            const canCreateSub = canCreateSubproject(
              subscription.plan,
              parentProject.projectLevel
            );

            if (canCreateSub.allowed) {
              const subproject = await db.project.create({
                data: {
                  userId: auth.userId,
                  name: branchNode.label,
                  description: branchNode.description || null,
                  color: branchNode.color || "blue",
                  parentProjectId: parentMapping.id,
                  projectLevel: parentProject.projectLevel + 1,
                },
              });

              nodeToIdMap.set(branchNode.id, {
                type: "project",
                id: subproject.id,
              });
            }
          }
        }
      }

      // Create tasks from leaf nodes
      const createdTasks: Array<{ nodeId: string; taskId: string }> = [];

      for (const leafNode of leafNodes) {
        const parentNodeId = leafNode.parentId || rootNode.id;
        const parentMapping = nodeToIdMap.get(parentNodeId);

        if (!parentMapping) {
          continue;
        }

        // Get the project to associate with task
        let projectId: string;
        if (parentMapping.type === "project") {
          projectId = parentMapping.id;
        } else {
          // If parent is a task, use root project
          projectId = rootProject.id;
        }

        // Get current task count
        const taskCount = await db.task.count({
          where: { userId: auth.userId },
        });

        // Check task limits
        const taskLimit = subscription.taskLimit;
        if (taskCount >= taskLimit) {
          // Skip this task if limit reached
          continue;
        }

        const task = await db.task.create({
          data: {
            userId: auth.userId,
            projectId,
            title: leafNode.label,
            description: leafNode.description || null,
            priority: leafNode.metadata?.priority || null,
            dueDate: leafNode.metadata?.dueDate
              ? new Date(leafNode.metadata.dueDate)
              : null,
            startDate: leafNode.metadata?.startDate
              ? new Date(leafNode.metadata.startDate)
              : null,
          },
        });

        nodeToIdMap.set(leafNode.id, { type: "task", id: task.id });
        createdTasks.push({ nodeId: leafNode.id, taskId: task.id });
      }

      // Create task dependencies from edges
      for (const edge of edges) {
        const sourceMapping = nodeToIdMap.get(edge.source);
        const targetMapping = nodeToIdMap.get(edge.target);

        if (
          sourceMapping?.type === "task" &&
          targetMapping?.type === "task"
        ) {
          // Update task to add dependency
          await db.task.update({
            where: { id: sourceMapping.id },
            data: { dependsOnTaskId: targetMapping.id },
          });
        }
      }

      // Mark mind map as converted
      const updatedMindMap = await db.mindMap.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          rootProjectId: rootProject.id,
        },
      });

      // Return conversion results
      return success({
        success: true,
        mindMapId: id,
        rootProjectId: rootProject.id,
        rootProjectName: rootProject.name,
        projectsCreated: [rootProject.id, ...Array.from(nodeToIdMap.values())
          .filter((m) => m.type === "project")
          .map((m) => m.id)
          .filter((id) => id !== rootProject.id)].length,
        tasksCreated: createdTasks.length,
        edgesProcessed: edges.length,
        message: `Successfully converted mind map to ${createdTasks.length} tasks and projects`,
      });
    } catch (error) {
      console.error("Error converting mind map:", error);
      return ApiErrors.INTERNAL_SERVER_ERROR(
        "Failed to convert mind map to projects and tasks"
      );
    }
  });
}
