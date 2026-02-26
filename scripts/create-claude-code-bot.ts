/**
 * Create the "Claude Code" bot entity in TaskQuadrant.
 * Run with: npx tsx scripts/create-claude-code-bot.ts
 */
import { db } from "../lib/db";
import { generateBotApiKey, generateWebhookSecret } from "../lib/botApiKey";

async function main() {
  // Find the owner
  const owner = await db.user.findUnique({
    where: { email: "charles.wee74@icloud.com" },
    select: { id: true, email: true },
  });

  if (!owner) {
    console.error("Owner not found");
    process.exit(1);
  }

  // Check if bot already exists
  const existing = await db.bot.findFirst({
    where: { name: "Claude Code", ownerId: owner.id },
  });

  if (existing) {
    console.log("Claude Code bot already exists:", existing.id);
    process.exit(0);
  }

  const { rawKey, hash, prefix } = generateBotApiKey();
  const webhookSecret = generateWebhookSecret();

  const bot = await db.bot.create({
    data: {
      name: "Claude Code",
      description: "Team lead bot - orchestrates Mark and John, manages task lifecycle",
      ownerId: owner.id,
      apiKeyHash: hash,
      apiKeyPrefix: prefix,
      webhookSecret,
      permissions: "tasks:read,tasks:write,tasks:delegate,comments:read,comments:write",
      projectIds: [], // empty = access all owner's projects
      rateLimitPerMinute: 120,
      isActive: true,
    },
  });

  console.log("=== Claude Code Bot Created ===");
  console.log("Bot ID:", bot.id);
  console.log("API Key (save this, shown only once):", rawKey);
  console.log("Permissions:", bot.permissions);
  console.log("Rate Limit:", bot.rateLimitPerMinute, "req/min");
  console.log("");
  console.log("Update BOT_API_DOCS_CLAUDE.md with the Bot ID and API key above.");

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
