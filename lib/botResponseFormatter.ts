import { priorityToQuadrant } from "@/lib/botQuadrantMap";

/**
 * Format a task for bot API responses
 * Maps internal priority to quadrant names and formats dates
 */
export function formatTaskForBot(task: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description || null,
    quadrant: priorityToQuadrant(task.priority),
    completed: task.completed,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    progress: task.progress,
    status: task.status || "TODO",
    startDate: task.startDate
      ? task.startDate.toISOString().split("T")[0]
      : null,
    startTime: task.startTime || null,
    dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
    dueTime: task.dueTime || null,
    projectId: task.projectId,
    projectName: task.project?.name || null,
    assignedToBotId: task.assignedToBotId || null,
    userId: task.userId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/**
 * Format a comment for bot API responses
 */
export function formatCommentForBot(comment: any) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    body: comment.body,
    metadata: comment.metadata || null,
    author: comment.bot
      ? { type: "bot" as const, id: comment.bot.id, name: comment.bot.name }
      : comment.userId
        ? { type: "user" as const, id: comment.userId }
        : { type: "unknown" as const },
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

/**
 * Format an artifact for bot API responses
 */
export function formatArtifactForBot(artifact: any) {
  return {
    id: artifact.id,
    taskId: artifact.taskId,
    botId: artifact.botId,
    fileName: artifact.fileName,
    mimeType: artifact.mimeType,
    sizeBytes: artifact.sizeBytes,
    createdAt: artifact.createdAt.toISOString(),
  };
}
