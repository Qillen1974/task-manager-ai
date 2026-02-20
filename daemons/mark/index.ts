import TelegramBot from "node-telegram-bot-api";
import { loadConfig } from "./config";
import { createLogger } from "../core/logger";
import { TaskQuadrantClient } from "../core/api-client";
import { LLMClient } from "../core/llm/types";
import { KimiClient } from "../core/llm/kimi";
import { MiniMaxClient } from "../core/llm/minimax";
import { processTask } from "./brain";
import { reviewTask } from "./review";
import { startTelegramBot, stopTelegramBot, notifyTaskCompleted } from "./telegram";
import { getTrackedTaskIds, getTrackedTask, untrackTask } from "./task-tracker";

// ── Load config (exits if missing required vars) ──
const config = loadConfig();
const log = createLogger("mark.main");

// ── State ──
const inProgress = new Set<string>();
const inReview = new Set<string>();
const inOrchestration = new Set<string>();
let shuttingDown = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let reviewTimer: ReturnType<typeof setInterval> | null = null;
let orchestrateTimer: ReturnType<typeof setInterval> | null = null;
let notifyTimer: ReturnType<typeof setInterval> | null = null;
let telegramBot: TelegramBot | null = null;

// ── Initialize clients ──
const api = new TaskQuadrantClient(config.TQ_BASE_URL, config.TQ_API_KEY);

function createLLMClient(): LLMClient {
  switch (config.LLM_PROVIDER) {
    case "minimax":
      return new MiniMaxClient(config.LLM_API_KEY);
    case "kimi":
      return new KimiClient(config.LLM_API_KEY);
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${config.LLM_PROVIDER}`);
  }
}
const llm = createLLMClient();

// ── Poll loop ──

async function pollOnce(): Promise<void> {
  if (shuttingDown) return;

  try {
    const response = await api.listTasks({
      assignedToBot: true,
      completed: false,
    });

    if (!response.success || !response.data) {
      log.error("Failed to fetch tasks", { error: response.error });
      return;
    }

    const tasks = response.data.tasks;
    let newTaskCount = 0;

    for (const task of tasks) {
      // Skip if already being processed by this daemon instance
      if (inProgress.has(task.id)) continue;

      // Skip if already started (progress > 0 means we or another instance already picked it up)
      if (task.progress > 0) continue;

      newTaskCount++;
      inProgress.add(task.id);

      // Process asynchronously — don't block the poll loop
      processTask(task, api, llm, config, log)
        .catch((err) => {
          log.error("Unhandled error in task processing", {
            taskId: task.id,
            error: (err as Error).message,
          });
        })
        .finally(() => {
          inProgress.delete(task.id);
        });
    }

    if (newTaskCount > 0) {
      log.info("Picked up new tasks", { count: newTaskCount });
    }
  } catch (err) {
    log.error("Poll cycle error", { error: (err as Error).message });
  }
}

// ── Review poll loop (checks tasks John has completed) ──

async function reviewOnce(): Promise<void> {
  if (shuttingDown) return;

  try {
    // Fetch tasks in REVIEW status across Mark's projects
    const response = await api.listTasks({
      completed: false,
      status: "REVIEW",
    });

    if (!response.success || !response.data) {
      log.error("Failed to fetch review tasks", { error: response.error });
      return;
    }

    const tasks = response.data.tasks;
    let reviewCount = 0;

    for (const task of tasks) {
      // Only review tasks assigned to John (delegated tasks)
      if (task.assignedToBotId !== config.JOHN_BOT_ID) continue;

      // Skip if already being reviewed
      if (inReview.has(task.id)) continue;

      reviewCount++;
      inReview.add(task.id);

      reviewTask(task, api, llm, config, log)
        .catch((err) => {
          log.error("Unhandled error in task review", {
            taskId: task.id,
            error: (err as Error).message,
          });
        })
        .finally(() => {
          inReview.delete(task.id);
        });
    }

    if (reviewCount > 0) {
      log.info("Picked up tasks for review", { count: reviewCount });
    }
  } catch (err) {
    log.error("Review poll cycle error", { error: (err as Error).message });
  }
}

// ── Orchestration loop (tracks decomposed parent tasks) ──

async function orchestrateOnce(): Promise<void> {
  if (shuttingDown) return;

  try {
    // Fetch IN_PROGRESS tasks assigned to Mark (parent tasks being orchestrated)
    const response = await api.listTasks({
      assignedToBot: true,
      completed: false,
      status: "IN_PROGRESS",
    });

    if (!response.success || !response.data) {
      log.error("Failed to fetch orchestration tasks", { error: response.error });
      return;
    }

    for (const task of response.data.tasks) {
      // Skip if already being orchestrated this cycle
      if (inOrchestration.has(task.id)) continue;

      // Get full task details to check subtasks
      const detailResponse = await api.getTask(task.id);
      if (!detailResponse.success || !detailResponse.data) continue;

      const detail = detailResponse.data;

      // Skip tasks with no subtasks (regular self-handled tasks)
      if (!detail.subtasks || detail.subtasks.length === 0) continue;

      inOrchestration.add(task.id);

      try {
        // Calculate parent progress from subtask averages
        const subtaskProgressSum = detail.subtasks.reduce((sum, st) => sum + st.progress, 0);
        const avgProgress = Math.floor(subtaskProgressSum / detail.subtasks.length);
        const parentProgress = Math.max(10, avgProgress); // Min 10 since we set it on decomposition

        // Update parent progress if changed
        if (parentProgress !== task.progress) {
          await api.updateTask(task.id, { progress: parentProgress });
          log.debug("Updated parent progress", { taskId: task.id, progress: parentProgress });
        }

        // Check if all subtasks are done
        const allDone = detail.subtasks.every((st) => st.completed || st.status === "DONE");
        if (allDone) {
          await api.updateTask(task.id, { status: "DONE", completed: true, progress: 100 });
          await api.addComment(task.id, `[Mark] All ${detail.subtasks.length} subtask(s) completed.`);
          log.info("Parent task auto-completed (all subtasks done)", { taskId: task.id });
        }
      } catch (err) {
        log.error("Error orchestrating task", {
          taskId: task.id,
          error: (err as Error).message,
        });
      } finally {
        inOrchestration.delete(task.id);
      }
    }
  } catch (err) {
    log.error("Orchestration poll cycle error", { error: (err as Error).message });
  }
}

// ── Telegram notification loop ──

async function notifyOnce(): Promise<void> {
  if (shuttingDown || !telegramBot) return;

  const taskIds = getTrackedTaskIds();
  if (taskIds.length === 0) return;

  for (const taskId of taskIds) {
    try {
      const response = await api.getTask(taskId);
      if (!response.success || !response.data) continue;

      const task = response.data;
      if (task.status !== "DONE" && !task.completed) continue;

      const tracked = getTrackedTask(taskId);
      if (!tracked) continue;

      // Find the result comment — look for "[Result]" pattern first, fall back to longest bot comment
      const botComments = task.comments.filter((c) => c.author.type === "bot");
      const resultComment =
        botComments.find((c) => /\] Result:/i.test(c.body)) ||
        botComments.sort((a, b) => b.body.length - a.body.length)[0];
      const resultText = resultComment?.body || "(no result comment found)";

      await notifyTaskCompleted(telegramBot, tracked.chatId, task, resultText);
      untrackTask(taskId);
      log.info("Sent Telegram notification for completed task", { taskId });
    } catch (err) {
      log.error("Error checking tracked task", {
        taskId,
        error: (err as Error).message,
      });
    }
  }
}

// ── Graceful shutdown ──

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  log.info(`Received ${signal}. Shutting down gracefully...`);

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (reviewTimer) {
    clearInterval(reviewTimer);
    reviewTimer = null;
  }
  if (orchestrateTimer) {
    clearInterval(orchestrateTimer);
    orchestrateTimer = null;
  }
  if (notifyTimer) {
    clearInterval(notifyTimer);
    notifyTimer = null;
  }
  if (telegramBot) {
    stopTelegramBot(telegramBot);
    telegramBot = null;
  }

  if (inProgress.size === 0 && inReview.size === 0) {
    log.info("No tasks in progress. Exiting.");
    process.exit(0);
  }

  // Wait for in-progress tasks (with 5 min timeout — Mark tasks can be long)
  const forceExitTimeout = setTimeout(() => {
    log.warn("Shutdown timeout reached. Forcing exit.", { pendingTasks: inProgress.size });
    process.exit(1);
  }, 300_000);

  const checkInterval = setInterval(() => {
    if (inProgress.size === 0 && inReview.size === 0) {
      clearInterval(checkInterval);
      clearTimeout(forceExitTimeout);
      log.info("All tasks finished. Exiting.");
      process.exit(0);
    }
    log.info(`Waiting for ${inProgress.size} task(s) + ${inReview.size} review(s) to finish...`);
  }, 5000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Startup ──

async function main(): Promise<void> {
  log.info("Mark daemon starting...", {
    baseUrl: config.TQ_BASE_URL,
    llmProvider: config.LLM_PROVIDER,
    telegram: config.TELEGRAM_ENABLED ? "enabled" : "disabled",
    pollInterval: config.POLL_INTERVAL_MS,
    maxToolRounds: config.MAX_TOOL_ROUNDS,
    codeExecTimeout: config.CODE_EXEC_TIMEOUT_MS,
    maxOutputBytes: config.MAX_OUTPUT_BYTES,
  });

  // Verify API key
  const authResult = await api.verifyAuth();
  if (!authResult.success || !authResult.data) {
    log.error("Auth verification failed", { error: authResult.error });
    process.exit(1);
  }

  // Store Mark's own bot ID for subtask assignment
  config.MARK_BOT_ID = authResult.data.id;

  log.info(`Auth verified: Bot "${authResult.data.name}" (${authResult.data.id})`, {
    permissions: authResult.data.permissions,
    projects: authResult.data.projectIds,
  });

  // Start Telegram bot if enabled
  if (config.TELEGRAM_ENABLED) {
    telegramBot = startTelegramBot(config, api, log);
    notifyTimer = setInterval(notifyOnce, config.POLL_INTERVAL_MS);
  }

  // Start polling (tasks + reviews + orchestration on same interval)
  pollTimer = setInterval(pollOnce, config.POLL_INTERVAL_MS);
  reviewTimer = setInterval(reviewOnce, config.POLL_INTERVAL_MS);
  orchestrateTimer = setInterval(orchestrateOnce, config.POLL_INTERVAL_MS);

  // Also run immediately
  await pollOnce();
  await reviewOnce();
  await orchestrateOnce();

  log.info(`Mark daemon running. Polling every ${config.POLL_INTERVAL_MS / 1000}s (tasks + reviews + orchestration). Press Ctrl+C to stop.`);
}

main().catch((err) => {
  log.error("Fatal startup error", { error: (err as Error).message });
  process.exit(1);
});
