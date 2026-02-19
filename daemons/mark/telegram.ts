import TelegramBot from "node-telegram-bot-api";
import { MarkConfig } from "./config";
import { TaskQuadrantClient, TaskQuadrantTask } from "../core/api-client";
import { LLMClient, LLMMessage } from "../core/llm/types";
import { Logger } from "../core/logger";
import { trackTask } from "./task-tracker";
import { getSystemPrompt } from "./system-prompt";

const TELEGRAM_MAX_MESSAGE = 4096;
const TRUNCATE_AT = 3800;

const STATUS_KEYWORDS = [
  "/status",
  "status",
  "what are you working on",
  "what are you doing",
  "any updates",
  "task list",
  "current tasks",
];

// ── Start / stop ──

export function startTelegramBot(
  config: MarkConfig,
  api: TaskQuadrantClient,
  llm: LLMClient,
  log: Logger
): TelegramBot {
  const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

  bot.on("message", (msg) => {
    handleMessage(msg, bot, config, api, llm, log).catch((err) => {
      log.error("Telegram message handler error", { error: (err as Error).message });
    });
  });

  bot.on("polling_error", (err) => {
    log.error("Telegram polling error", { error: err.message });
  });

  log.info("Telegram bot started (long-polling)");
  return bot;
}

export function stopTelegramBot(bot: TelegramBot): void {
  bot.stopPolling();
}

// ── Notification ──

export async function notifyTaskCompleted(
  bot: TelegramBot,
  chatId: string,
  task: TaskQuadrantTask,
  resultText: string
): Promise<void> {
  let body = `✅ Task completed: ${task.title}\n\n${resultText}`;

  if (body.length > TRUNCATE_AT) {
    body = body.slice(0, TRUNCATE_AT) + "\n\n(see full result in TaskQuadrant)";
  }

  await bot.sendMessage(chatId, body);
}

// ── Internal message handler ──

async function handleMessage(
  msg: TelegramBot.Message,
  bot: TelegramBot,
  config: MarkConfig,
  api: TaskQuadrantClient,
  llm: LLMClient,
  log: Logger
): Promise<void> {
  const chatId = String(msg.chat.id);

  // Gate: only the authorized user
  if (chatId !== config.TELEGRAM_CHAT_ID) {
    log.warn("Unauthorized Telegram message", { chatId, from: msg.from?.username });
    return;
  }

  const text = (msg.text || "").trim();
  if (!text) return;

  // Status query
  const lower = text.toLowerCase();
  if (STATUS_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + " "))) {
    await handleStatusQuery(bot, chatId, api, log);
    return;
  }

  // Task creation — requires /task prefix
  if (lower.startsWith("/task ") || lower === "/task") {
    const taskText = text.slice(5).trim();
    if (!taskText) {
      await bot.sendMessage(chatId, "Usage: /task <title>\n\nExample: /task Research best React form libraries for 2026");
      return;
    }
    await handleTaskCreation(bot, chatId, taskText, config, api, log);
    return;
  }

  // Help
  if (lower === "/help" || lower === "help") {
    await bot.sendMessage(
      chatId,
      "Here's what I can do:\n\n" +
      "/task <title> — Create a new task\n" +
      "/status — Show active tasks\n" +
      "/help — Show this message"
    );
    return;
  }

  // Anything else — casual chat via LLM
  await handleChat(bot, chatId, text, llm, log);
}

// ── Status query ──

async function handleStatusQuery(
  bot: TelegramBot,
  chatId: string,
  api: TaskQuadrantClient,
  log: Logger
): Promise<void> {
  const response = await api.listTasks({ assignedToBot: true, completed: false, limit: 20 });

  if (!response.success || !response.data) {
    await bot.sendMessage(chatId, "Could not fetch tasks. Try again in a moment.");
    return;
  }

  const tasks = response.data.tasks;
  if (tasks.length === 0) {
    await bot.sendMessage(chatId, "No active tasks right now. Send me something to work on!");
    return;
  }

  const lines = tasks.map((t, i) => {
    const status = t.status || "PENDING";
    return `${i + 1}. *${escapeMarkdown(t.title)}* — ${status}`;
  });

  const body = `📋 *Active tasks (${tasks.length}):*\n\n${lines.join("\n")}`;
  await bot.sendMessage(chatId, body, { parse_mode: "Markdown" });
}

// ── Task creation ──

async function handleTaskCreation(
  bot: TelegramBot,
  chatId: string,
  text: string,
  config: MarkConfig,
  api: TaskQuadrantClient,
  log: Logger
): Promise<void> {
  // First line = title, rest = description
  const lines = text.split("\n");
  const title = lines[0].slice(0, 200);
  const description = lines.slice(1).join("\n").trim() || undefined;

  const result = await api.createTask({
    title,
    description,
    projectId: config.TQ_PROJECT_ID,
    quadrant: "q1",
    assignToSelf: true,
  });

  if (!result.success || !result.data) {
    log.error("Failed to create task from Telegram", { error: result.error });
    await bot.sendMessage(chatId, "Failed to create task. Please try again.");
    return;
  }

  const task = result.data;
  trackTask(task.id, chatId);
  log.info("Task created from Telegram", { taskId: task.id, title });

  await bot.sendMessage(
    chatId,
    `👍 Got it. Task created: *${escapeMarkdown(title)}*\nI'll let you know when it's done.`,
    { parse_mode: "Markdown" }
  );
}

// ── Casual chat with conversation history ──

const MAX_CHAT_HISTORY = 20; // Keep last 20 messages (10 exchanges)
const chatHistory: LLMMessage[] = [];

const CHAT_SYSTEM_PROMPT = getSystemPrompt() +
  "\n\nTELEGRAM CONTEXT:" +
  "\nYou are chatting with your boss on Telegram. This is a casual conversation, not a task." +
  "\nKeep replies concise and conversational — this is a chat, not a report." +
  "\nIf the user seems to want a task done, suggest they use /task <title> to create one." +
  "\nYou can also mention /status to check tasks and /help for commands.";

async function handleChat(
  bot: TelegramBot,
  chatId: string,
  text: string,
  llm: LLMClient,
  log: Logger
): Promise<void> {
  try {
    chatHistory.push({ role: "user", content: text });

    // Trim history if too long
    while (chatHistory.length > MAX_CHAT_HISTORY) {
      chatHistory.shift();
    }

    const messages: LLMMessage[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...chatHistory,
    ];

    const response = await llm.chat(messages);

    const raw = response.content || "Sorry, I couldn't come up with a response.";
    const reply = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim() || raw;

    chatHistory.push({ role: "assistant", content: reply });

    let body = reply;
    if (body.length > TRUNCATE_AT) {
      body = body.slice(0, TRUNCATE_AT) + "\n\n(message truncated)";
    }

    await bot.sendMessage(chatId, body);
  } catch (err) {
    log.error("Chat LLM error", { error: (err as Error).message });
    await bot.sendMessage(chatId, "Sorry, something went wrong. Try again in a moment.");
  }
}

// ── Helpers ──

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
