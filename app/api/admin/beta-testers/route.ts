import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/beta-testers
 * Get all beta testers with their activity stats
 */
export async function GET(request: NextRequest) {
  // Minimal test to see if route loads at all
  return NextResponse.json({
    success: true,
    message: "Beta testers route is working",
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /api/admin/beta-testers
 * Grant or revoke mobile unlock for selected users
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "POST endpoint working",
  });
}
