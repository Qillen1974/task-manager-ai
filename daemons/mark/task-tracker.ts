// In-memory tracker for Telegram-originated tasks.
// If the daemon restarts, tracked tasks are lost — acceptable because
// tasks still exist in TaskQuadrant; user just won't get a Telegram
// notification for in-flight tasks.

interface TrackedTask {
  chatId: string;
  createdAt: number;
}

const tracked = new Map<string, TrackedTask>();

export function trackTask(taskId: string, chatId: string): void {
  tracked.set(taskId, { chatId, createdAt: Date.now() });
}

export function getTrackedTask(taskId: string): TrackedTask | undefined {
  return tracked.get(taskId);
}

export function untrackTask(taskId: string): void {
  tracked.delete(taskId);
}

export function getTrackedTaskIds(): string[] {
  return Array.from(tracked.keys());
}
