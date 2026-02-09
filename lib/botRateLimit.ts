interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory rate limit store
const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 60-second sliding window

/**
 * Check if a bot request is within rate limits
 */
export function checkRateLimit(
  botId: string,
  limitPerMinute: number
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(botId);

  // If no entry or window has expired, start fresh
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    rateLimitStore.set(botId, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: limitPerMinute - 1,
      resetAt: now + WINDOW_MS,
    };
  }

  // Within current window
  if (entry.count >= limitPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + WINDOW_MS,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: limitPerMinute - entry.count,
    resetAt: entry.windowStart + WINDOW_MS,
  };
}

/**
 * Get rate limit headers for the response
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}
