import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import {
  hashPassword,
  validateEmail,
  validatePasswordStrength,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/authUtils";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return ApiErrors.MISSING_REQUIRED_FIELD(
        !email ? "email" : "password"
      );
    }

    if (!validateEmail(email)) {
      return ApiErrors.INVALID_EMAIL();
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return ApiErrors.WEAK_PASSWORD(passwordValidation.errors);
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return ApiErrors.EMAIL_ALREADY_EXISTS();
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and subscription
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split("@")[0],
        subscription: {
          create: {
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
            projectLimit: 3,
            taskLimit: 50,
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to database
    await db.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Return success with tokens
    return success(
      {
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
      },
      201
    );
  });
}
