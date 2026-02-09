import crypto from "crypto";

const KEY_PREFIX = "tk_live_";

/**
 * Generate a new bot API key with hash and prefix
 */
export function generateBotApiKey(): {
  rawKey: string;
  hash: string;
  prefix: string;
} {
  const randomBytes = crypto.randomBytes(24).toString("hex"); // 48 hex chars
  const rawKey = `${KEY_PREFIX}${randomBytes}`;
  const hash = hashApiKey(rawKey);
  const prefix = rawKey.substring(0, 8);

  return { rawKey, hash, prefix };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Validate API key format
 */
export function isValidKeyFormat(key: string): boolean {
  return (
    typeof key === "string" &&
    key.startsWith(KEY_PREFIX) &&
    key.length === KEY_PREFIX.length + 48
  );
}

/**
 * Generate a webhook secret for HMAC signing
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
