import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";
import { sendEmail } from "@/lib/emailService";

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

    // Send email notification to support@taskquadrant.io
    const supportEmail = process.env.SUPPORT_EMAIL || "support@taskquadrant.io";
    const emailHtml = generateBugReportEmail(
      user.name || user.email,
      user.email,
      title.trim(),
      description.trim(),
      bugReport.id
    );

    try {
      await sendEmail({
        to: supportEmail,
        subject: `🐛 New Bug Report: ${title.trim()}`,
        html: emailHtml,
      });
      console.log(`[Bug Report] Email sent to ${supportEmail} for bug report ${bugReport.id}`);
    } catch (emailError) {
      console.error(
        "[Bug Report] Failed to send email notification:",
        emailError instanceof Error ? emailError.message : emailError
      );
      // Don't fail the API response if email fails, the bug report is still created
    }

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
 * Generate bug report email HTML
 */
function generateBugReportEmail(
  userName: string,
  userEmail: string,
  title: string,
  description: string,
  bugId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .section { margin: 20px 0; }
          .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
          .value { background: white; padding: 15px; border-left: 4px solid #EF4444; border-radius: 4px; }
          .user-info { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .bug-id { font-family: 'Courier New', monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 40px; margin-bottom: 10px;">🐛</div>
            <h1>New Bug Report</h1>
            <p>Issue ID: <span class="bug-id">${bugId}</span></p>
          </div>

          <div class="content">
            <p><strong>A new bug has been reported by a user:</strong></p>

            <div class="user-info">
              <p style="margin: 0;"><strong>Reported by:</strong> ${userName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${userEmail}</p>
            </div>

            <div class="section">
              <div class="label">Bug Title</div>
              <div class="value">${escapeHtml(title)}</div>
            </div>

            <div class="section">
              <div class="label">Description</div>
              <div class="value" style="white-space: pre-wrap;">${escapeHtml(description)}</div>
            </div>

            <div class="divider"></div>

            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Review the bug report in the admin dashboard</li>
              <li>Assign to a developer for investigation</li>
              <li>Update the bug status as it's being worked on</li>
              <li>Close once resolved</li>
            </ul>

            <p style="color: #6b7280; font-size: 14px;">
              <strong>Report ID:</strong> ${bugId}<br>
              <strong>Submitted at:</strong> ${new Date().toLocaleString()}
            </p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. Bug Report System.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
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
