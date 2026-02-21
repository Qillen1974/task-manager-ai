import * as path from "path";
import * as dotenv from "dotenv";

// Load .env from daemons/ directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

export interface JohnConfig {
  TQ_BASE_URL: string;
  TQ_API_KEY: string;
  TQ_PROJECT_ID: string;
  MINIMAX_API_KEY: string;
  POLL_INTERVAL_MS: number;
  CODE_EXEC_TIMEOUT_MS: number;
  MAX_TOOL_ROUNDS: number;
  MAX_DESCRIPTION_LENGTH: number;
  SERPER_API_KEY: string;
  LOG_LEVEL: string;
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

export function loadConfig(): JohnConfig {
  return {
    TQ_BASE_URL: requireEnv("TQ_BASE_URL"),
    TQ_API_KEY: requireEnv("TQ_API_KEY"),
    TQ_PROJECT_ID: requireEnv("TQ_PROJECT_ID"),
    MINIMAX_API_KEY: requireEnv("MINIMAX_API_KEY"),
    POLL_INTERVAL_MS: optionalInt("POLL_INTERVAL_MS", 30_000),
    CODE_EXEC_TIMEOUT_MS: optionalInt("CODE_EXEC_TIMEOUT_MS", 30_000),
    MAX_TOOL_ROUNDS: optionalInt("MAX_TOOL_ROUNDS", 3),
    MAX_DESCRIPTION_LENGTH: optionalInt("MAX_DESCRIPTION_LENGTH", 5000),
    SERPER_API_KEY: requireEnv("SERPER_API_KEY"),
    LOG_LEVEL: process.env.LOG_LEVEL || "INFO",
  };
}
