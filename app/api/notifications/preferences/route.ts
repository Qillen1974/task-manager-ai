import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";

const preferencesSchema = z.object({
  // Email preferences
  emailTaskAssignments: z.boolean().optional(),
  emailTeamInvitations: z.boolean().optional(),
  emailDocumentUploads: z.boolean().optional(),
  emailStickyNotes: z.boolean().optional(),
  emailTaskCompletions: z.boolean().optional(),

  // In-app preferences
  inAppTaskAssignments: z.boolean().optional(),
  inAppTeamInvitations: z.boolean().optional(),
  inAppDocumentUploads: z.boolean().optional(),
  inAppStickyNotes: z.boolean().optional(),
  inAppTaskCompletions: z.boolean().optional(),
  inAppTaskStartDate: z.boolean().optional(),

  // General preferences
  digestFrequency: z.enum(["immediate", "daily", "weekly", "never"]).optional(),
  notificationsMuted: z.boolean().optional(),
});

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Get or create preferences
    let preferences = await db.notificationPreference.findUnique({
      where: { userId: auth.userId },
    });

    if (!preferences) {
      preferences = await db.notificationPreference.create({
        data: { userId: auth.userId },
      });
    }

    return success(preferences);
  });
}

/**
 * PATCH /api/notifications/preferences
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const updates = preferencesSchema.parse(body);

    // Get or create preferences
    let preferences = await db.notificationPreference.findUnique({
      where: { userId: auth.userId },
    });

    if (!preferences) {
      preferences = await db.notificationPreference.create({
        data: {
          userId: auth.userId,
          ...updates,
        },
      });
    } else {
      preferences = await db.notificationPreference.update({
        where: { userId: auth.userId },
        data: updates,
      });
    }

    return success(preferences, "Notification preferences updated");
  });
}

/**
 * POST /api/notifications/preferences/reset
 * Reset notification preferences to defaults
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const preferences = await db.notificationPreference.upsert({
      where: { userId: auth.userId },
      create: { userId: auth.userId },
      update: {
        // Reset to defaults
        emailTaskAssignments: true,
        emailTeamInvitations: true,
        emailDocumentUploads: false,
        emailStickyNotes: false,
        emailTaskCompletions: false,
        inAppTaskAssignments: true,
        inAppTeamInvitations: true,
        inAppDocumentUploads: true,
        inAppStickyNotes: true,
        inAppTaskCompletions: true,
        inAppTaskStartDate: true,
        digestFrequency: "immediate",
        notificationsMuted: false,
      },
    });

    return success(preferences, "Notification preferences reset to defaults");
  });
}
