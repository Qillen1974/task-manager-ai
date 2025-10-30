import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, generateAccessToken, getTokenFromHeader } from "@/lib/authUtils";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const authHeader = request.headers.get("authorization");
    const refreshToken = getTokenFromHeader(authHeader);

    if (!refreshToken) {
      return ApiErrors.MISSING_TOKEN();
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, "refresh");
    if (!decoded) {
      return ApiErrors.INVALID_TOKEN();
    }

    // Check if session exists in database
    const session = await db.session.findUnique({
      where: { token: refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return ApiErrors.SESSION_EXPIRED();
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: { subscription: true },
    });

    if (!user) {
      return ApiErrors.USER_NOT_FOUND();
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id);

    return success({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      subscription: {
        plan: user.subscription?.plan,
        projectLimit: user.subscription?.projectLimit,
        taskLimit: user.subscription?.taskLimit,
      },
    });
  });
}
