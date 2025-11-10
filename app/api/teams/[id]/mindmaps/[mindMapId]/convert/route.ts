import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError, error } from "@/lib/apiResponse";
import {
  canCreateRootProject,
  canCreateSubproject,
  canCreateMindMapWithNodes,
} from "@/lib/projectLimits";
import { canConvertMindMap } from "@/lib/mindMapPermissions";

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

interface NodeToResourceMap {
  [nodeId: string]: { type: "project" | "task"; id: string };
}

/**
 * POST /api/teams/[id]/mindmaps/[mindMapId]/convert - Convert a team mind map to team projects and tasks
 *
 * Similar to personal mind map conversion, but creates team-owned projects and tasks.
 * Team members with ADMIN/EDITOR role can convert.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; mindMapId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId, mindMapId } = params;

    // Get the mind map
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

    // Check conversion permission
    const canConvert = await canConvertMindMap(auth.userId, mindMapId);
    if (!canConvert.allowed) {
      return error(canConvert.reason || "Permission denied", 403, "FORBIDDEN");
    }

    // Check subscription - team mind maps require ENTERPRISE
    const subscription = await db.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (!subscription || subscription.plan !== "ENTERPRISE") {
      return error(
        "Team mind map conversion requires ENTERPRISE subscription",
        403,
        "SUBSCRIPTION_REQUIRED"
      );
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

    // Load previous conversion mapping if this is a re-conversion
    let previousNodeMap: NodeToResourceMap = {};
    if (mindMap.isConverted && mindMap.nodeToResourceMap) {
      try {
        previousNodeMap = JSON.parse(mindMap.nodeToResourceMap);
      } catch (error) {
        console.error("Failed to parse previous node map:", error);
        previousNodeMap = {};
      }
    }

    // Find root node (node with no parent or first node)
    const rootNode = nodes.find((n) => !n.parentId) || nodes[0];
    const currentNodeIds = new Set(nodes.map((n) => n.id));

    // Identify which nodes were removed
    const removedNodeIds = Object.keys(previousNodeMap).filter(
      (nodeId) => !currentNodeIds.has(nodeId)
    );

    try {
      // DELETE STEP: Remove projects/tasks for deleted nodes
      const deletedResourceIds: string[] = [];
      for (const nodeId of removedNodeIds) {
        const resource = previousNodeMap[nodeId];
        if (resource) {
          deletedResourceIds.push(resource.id);
          if (resource.type === "project") {
            await db.project.delete({
              where: { id: resource.id },
            }).catch(() => {
              // Silently fail if project doesn't exist or has dependent tasks
            });
          } else if (resource.type === "task") {
            await db.task.delete({
              where: { id: resource.id },
            }).catch(() => {
              // Silently fail if task doesn't exist
            });
          }
        }
      }

      // Map to track node IDs to created/updated project/task IDs
      const nodeToIdMap: NodeToResourceMap = { ...previousNodeMap };

      // Get current project count to validate limits for new projects
      const rootProjectCount = await db.project.count({
        where: { teamId, parentProjectId: null },
      });

      const canCreateRoot = canCreateRootProject(
        subscription.plan,
        rootProjectCount
      );

      // Check overall node limit
      const nodeCheck = canCreateMindMapWithNodes(subscription.plan, nodes.length);
      if (!nodeCheck.allowed) {
        return ApiErrors.RESOURCE_LIMIT_EXCEEDED("nodes per mind map");
      }

      // UPDATE/CREATE ROOT PROJECT
      let rootProject: any;

      if (previousNodeMap[rootNode.id] && previousNodeMap[rootNode.id].type === "project") {
        // Root project already exists - update it
        rootProject = await db.project.update({
          where: { id: previousNodeMap[rootNode.id].id },
          data: {
            name: rootNode.label,
            description: rootNode.description || null,
            color: rootNode.color || "blue",
          },
        });
      } else {
        // Create new root project
        if (!canCreateRoot.allowed) {
          return ApiErrors.RESOURCE_LIMIT_EXCEEDED("root projects");
        }

        const parentProjectId = rootNode.metadata?.parentProjectId;
        let rootProjectLevel = 0;

        if (parentProjectId) {
          // Create as subproject of existing project
          const parentProject = await db.project.findUnique({
            where: { id: parentProjectId },
          });

          if (!parentProject) {
            return ApiErrors.NOT_FOUND("Parent project");
          }

          if (parentProject.teamId !== teamId) {
            return ApiErrors.FORBIDDEN();
          }

          const canCreateSub = canCreateSubproject(subscription.plan, parentProject.projectLevel);
          if (!canCreateSub.allowed) {
            return ApiErrors.RESOURCE_LIMIT_EXCEEDED("subprojects at this level");
          }

          rootProjectLevel = parentProject.projectLevel + 1;
          rootProject = await db.project.create({
            data: {
              userId: auth.userId, // Still track who created it, but it's team-owned
              teamId,
              name: rootNode.label,
              description: rootNode.description || null,
              color: rootNode.color || "blue",
              parentProjectId,
              projectLevel: rootProjectLevel,
            },
          });
        } else {
          // Create as root project (team-owned)
          rootProject = await db.project.create({
            data: {
              userId: auth.userId,
              teamId,
              name: rootNode.label,
              description: rootNode.description || null,
              color: rootNode.color || "blue",
              projectLevel: 0,
            },
          });
        }

        nodeToIdMap[rootNode.id] = { type: "project", id: rootProject.id };
      }

      // Separate nodes into branches (projects) and leaves (tasks)
      const childNodes = nodes.filter((n) => n.id !== rootNode.id);
      const branchNodes: MindMapNode[] = [];
      const leafNodes: MindMapNode[] = [];

      for (const node of childNodes) {
        const hasChildren = childNodes.some((n) => n.parentId === node.id);
        if (hasChildren) {
          branchNodes.push(node);
        } else {
          leafNodes.push(node);
        }
      }

      // UPDATE/CREATE SUBPROJECTS from branch nodes
      for (const branchNode of branchNodes) {
        const parentNodeId = branchNode.parentId || rootNode.id;
        const parentMapping = nodeToIdMap[parentNodeId];

        if (!parentMapping) {
          continue;
        }

        if (parentMapping.type === "project") {
          const parentProject = await db.project.findUnique({
            where: { id: parentMapping.id },
          });

          if (!parentProject) {
            continue;
          }

          const canCreateSub = canCreateSubproject(
            subscription.plan,
            parentProject.projectLevel
          );

          if (!canCreateSub.allowed) {
            continue;
          }

          if (
            previousNodeMap[branchNode.id] &&
            previousNodeMap[branchNode.id].type === "project"
          ) {
            // Update existing subproject
            await db.project.update({
              where: { id: previousNodeMap[branchNode.id].id },
              data: {
                name: branchNode.label,
                description: branchNode.description || null,
                color: branchNode.color || "blue",
              },
            });
            nodeToIdMap[branchNode.id] = previousNodeMap[branchNode.id];
          } else {
            // Create new subproject (team-owned)
            const subproject = await db.project.create({
              data: {
                userId: auth.userId,
                teamId,
                name: branchNode.label,
                description: branchNode.description || null,
                color: branchNode.color || "blue",
                parentProjectId: parentMapping.id,
                projectLevel: parentProject.projectLevel + 1,
              },
            });

            nodeToIdMap[branchNode.id] = {
              type: "project",
              id: subproject.id,
            };
          }
        }
      }

      // UPDATE/CREATE TASKS from leaf nodes
      const createdTasks: Array<{ nodeId: string; taskId: string }> = [];

      for (const leafNode of leafNodes) {
        const parentNodeId = leafNode.parentId || rootNode.id;
        const parentMapping = nodeToIdMap[parentNodeId];

        if (!parentMapping) {
          continue;
        }

        let projectId: string;
        if (parentMapping.type === "project") {
          projectId = parentMapping.id;
        } else {
          projectId = rootProject.id;
        }

        if (previousNodeMap[leafNode.id] && previousNodeMap[leafNode.id].type === "task") {
          // Update existing task
          await db.task.update({
            where: { id: previousNodeMap[leafNode.id].id },
            data: {
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
          nodeToIdMap[leafNode.id] = previousNodeMap[leafNode.id];
        } else {
          // Create new task
          const taskCount = await db.task.count({
            where: { userId: auth.userId },
          });

          const taskLimit = subscription.taskLimit;
          if (taskCount >= taskLimit) {
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

          nodeToIdMap[leafNode.id] = { type: "task", id: task.id };
          createdTasks.push({ nodeId: leafNode.id, taskId: task.id });
        }
      }

      // Update task dependencies from edges
      for (const edge of edges) {
        const sourceMapping = nodeToIdMap[edge.source];
        const targetMapping = nodeToIdMap[edge.target];

        if (
          sourceMapping?.type === "task" &&
          targetMapping?.type === "task"
        ) {
          await db.task.update({
            where: { id: sourceMapping.id },
            data: { dependsOnTaskId: targetMapping.id },
          });
        }
      }

      // Update mind map with conversion metadata
      const updatedMindMap = await db.mindMap.update({
        where: { id: mindMapId },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          rootProjectId: rootProject.id,
          nodeToResourceMap: JSON.stringify(nodeToIdMap),
        },
      });

      // Calculate statistics
      const newProjectCount = Object.values(nodeToIdMap)
        .filter((m) => m.type === "project")
        .length;
      const newTaskCount = Object.values(nodeToIdMap)
        .filter((m) => m.type === "task")
        .length;

      return success({
        success: true,
        mindMapId: mindMapId,
        rootProjectId: rootProject.id,
        rootProjectName: rootProject.name,
        isReConversion: mindMap.isConverted,
        projectsCreated: newProjectCount,
        tasksCreated: newTaskCount,
        tasksUpdated: leafNodes.length - createdTasks.length,
        projectsDeleted: removedNodeIds.length,
        edgesProcessed: edges.length,
        message: mindMap.isConverted
          ? `Successfully re-converted team mind map. Created ${createdTasks.length} new tasks, deleted ${removedNodeIds.length} removed items.`
          : `Successfully converted team mind map to ${newTaskCount} tasks and ${newProjectCount} projects`,
      });
    } catch (error) {
      console.error("Error converting team mind map:", error);
      return ApiErrors.INTERNAL_SERVER_ERROR(
        "Failed to convert team mind map to projects and tasks"
      );
    }
  });
}
