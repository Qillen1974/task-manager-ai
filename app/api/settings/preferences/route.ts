import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET /api/settings/preferences - Fetch user preferences
export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid token" } },
        { status: 401 }
      );
    }

    // Fetch user settings, create if doesn't exist
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings for new user
      settings = await prisma.userSettings.create({
        data: {
          userId,
          enableAutoPrioritization: true,
          autoPrioritizationThresholdHours: 48,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        enableAutoPrioritization: settings.enableAutoPrioritization,
        autoPrioritizationThresholdHours: settings.autoPrioritizationThresholdHours,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch settings" } },
      { status: 500 }
    );
  }
}

// POST /api/settings/preferences - Update user preferences
export async function POST(request: NextRequest) {
  try {
    // Extract and verify token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid token" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enableAutoPrioritization, autoPrioritizationThresholdHours } = body;

    // Validate input
    if (typeof enableAutoPrioritization !== "boolean") {
      return NextResponse.json(
        { success: false, error: { message: "enableAutoPrioritization must be a boolean" } },
        { status: 400 }
      );
    }

    if (typeof autoPrioritizationThresholdHours !== "number" || autoPrioritizationThresholdHours < 1 || autoPrioritizationThresholdHours > 168) {
      return NextResponse.json(
        { success: false, error: { message: "autoPrioritizationThresholdHours must be between 1 and 168" } },
        { status: 400 }
      );
    }

    // Update or create user settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        enableAutoPrioritization,
        autoPrioritizationThresholdHours,
      },
      create: {
        userId,
        enableAutoPrioritization,
        autoPrioritizationThresholdHours,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        enableAutoPrioritization: settings.enableAutoPrioritization,
        autoPrioritizationThresholdHours: settings.autoPrioritizationThresholdHours,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update settings" } },
      { status: 500 }
    );
  }
}
