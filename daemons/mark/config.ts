import * as path from "path";
import * as dotenv from "dotenv";

// Load .env from daemons/ directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

export type LLMProvider = "kimi" | "minimax";

export interface MarkConfig {
  TQ_BASE_URL: string;
  TQ_API_KEY: string;
  TQ_PROJECT_ID: string;
  LLM_PROVIDER: LLMProvider;
  LLM_API_KEY: string;
  JOHN_BOT_ID: string;
  MARK_BOT_ID: string; // Populated at runtime from auth response
  POLL_INTERVAL_MS: number;
  CODE_EXEC_TIMEOUT_MS: number;
  MAX_TOOL_ROUNDS: number;
  MAX_DESCRIPTION_LENGTH: number;
  MAX_OUTPUT_BYTES: number;
  LOG_LEVEL: string;
  SERPER_API_KEY: string;
  GITHUB_TOKEN: string;
  GIT_REPO_URL: string;
  TELEGRAM_ENABLED: boolean;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[FATAL] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value.trim();
}

function optionalInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.error(`[FATAL] Invalid integer for ${name}: ${value}`);
    process.exit(1);
  }
  return parsed;
}

export function loadConfig(): MarkConfig {
  const telegramEnabled = process.env.TELEGRAM_ENABLED === "true";

  return {
    TQ_BASE_URL: requireEnv("TQ_BASE_URL"),
    TQ_API_KEY: requireEnv("TQ_API_KEY"),
    TQ_PROJECT_ID: requireEnv("TQ_PROJECT_ID"),
    LLM_PROVIDER: (process.env.LLM_PROVIDER || "kimi") as LLMProvider,
    LLM_API_KEY: process.env.LLM_API_KEY || requireEnv("KIMI_API_KEY"),
    JOHN_BOT_ID: requireEnv("JOHN_BOT_ID"),
    MARK_BOT_ID: "", // Set after auth verification in index.ts
    POLL_INTERVAL_MS: optionalInt("POLL_INTERVAL_MS", 30_000),
    CODE_EXEC_TIMEOUT_MS: optionalInt("CODE_EXEC_TIMEOUT_MS", 300_000), // 5 minutes
    MAX_TOOL_ROUNDS: optionalInt("MAX_TOOL_ROUNDS", 8),
    MAX_DESCRIPTION_LENGTH: optionalInt("MAX_DESCRIPTION_LENGTH", 5000),
    MAX_OUTPUT_BYTES: optionalInt("MAX_OUTPUT_BYTES", 500 * 1024), // 500KB
    LOG_LEVEL: process.env.LOG_LEVEL || "INFO",
    SERPER_API_KEY: requireEnv("SERPER_API_KEY"),
    GITHUB_TOKEN: process.env.MARK_GITHUB_TOKEN || "",
    GIT_REPO_URL: process.env.GIT_REPO_URL || "",
    TELEGRAM_ENABLED: telegramEnabled,
    TELEGRAM_BOT_TOKEN: telegramEnabled ? requireEnv("TELEGRAM_BOT_TOKEN") : "",
    TELEGRAM_CHAT_ID: telegramEnabled ? requireEnv("TELEGRAM_CHAT_ID") : "",
  };
}
