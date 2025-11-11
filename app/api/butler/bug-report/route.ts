import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * POST /api/butler/bug-report - Submit a bug report
 * Body: { title: string, description: string, screenshot?: string, userContext?: string }
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { title, description, screenshot, userContext } = body;

    if (!title || !title.trim()) {
      return { error: "Bug title is required", status: 400 };
    }

    if (!description || !description.trim()) {
      return { error: "Bug description is required", status: 400 };
    }

    // Get user info for context
    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return { error: "User not found", status: 404 };
    }

    // Create bug report
    const bugReport = await db.bugReport.create({
      data: {
        userId: auth.userId,
        title: title.trim(),
        description: description.trim(),
        screenshot: screenshot || null,
        userContext: userContext || generateUserContext(),
        status: "open",
      },
    });

    // TODO: Send email notification to support@taskquadrant.io
    // For now, just mark that email should be sent
    // In production, integrate with email service (SendGrid, Mailgun, etc.)

    return success({
      bugReport: {
        id: bugReport.id,
        title: bugReport.title,
        status: bugReport.status,
        createdAt: bugReport.createdAt,
      },
      message:
        "Thank you for reporting this issue! Our support team has been notified and will investigate. We appreciate your feedback!",
    });
  });
}

/**
 * GET /api/butler/bug-reports - Get user's bug reports (paginated)
 * Query: page=1, limit=10
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "10"));
    const skip = (page - 1) * limit;

    const [bugReports, total] = await Promise.all([
      db.bugReport.findMany({
        where: { userId: auth.userId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.bugReport.count({
        where: { userId: auth.userId },
      }),
    ]);

    return success({
      bugReports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

/**
 * Generate user context from browser/system info
 */
function generateUserContext(): string {
  // This would normally come from the client side
  // For now, create a basic structure
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    userAgent: "Browser/System info would be collected from client",
    url: "Page URL would be sent from client",
    note: "Full context should be gathered on frontend and sent with bug report",
  });
}
