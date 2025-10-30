import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/authUtils";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return ApiErrors.MISSING_REQUIRED_FIELD(
        !email ? "email" : "password"
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return ApiErrors.INVALID_CREDENTIALS();
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return ApiErrors.INVALID_CREDENTIALS();
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Delete any existing sessions for this user (prevent conflicts)
    await db.session.deleteMany({
      where: { userId: user.id },
    });

    // Save refresh token to database
    await db.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return success({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      subscription: {
        plan: user.subscription?.plan,
        projectLimit: user.subscription?.projectLimit,
        taskLimit: user.subscription?.taskLimit,
      },
    });
  });
}
