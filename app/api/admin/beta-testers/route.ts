import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/beta-testers
 */
export async function GET(request: NextRequest) {
  const debug: Record<string, unknown> = {};

  // Test db import
  try {
    const { db } = await import("@/lib/db");
    debug.dbLoaded = true;
    debug.dbType = typeof db;
  } catch (e) {
    debug.dbLoaded = false;
    debug.dbError = e instanceof Error ? e.message : String(e);
  }

  // Test adminAuth import
  try {
    const { verifyAdminToken } = await import("@/lib/adminAuth");
    debug.authLoaded = true;
    debug.authType = typeof verifyAdminToken;
  } catch (e) {
    debug.authLoaded = false;
    debug.authError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    success: true,
    debug,
  });
}

/**
 * POST /api/admin/beta-testers
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: "POST test" });
}
