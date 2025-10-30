import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/authUtils";
import { ApiErrors } from "@/lib/apiResponse";

/**
 * Middleware to verify JWT token and extract user ID
 */
export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return {
      authenticated: false,
      error: ApiErrors.MISSING_TOKEN(),
    };
  }

  const decoded = verifyToken(token, "access");
  if (!decoded) {
    return {
      authenticated: false,
      error: ApiErrors.INVALID_TOKEN(),
    };
  }

  return {
    authenticated: true,
    userId: decoded.userId,
  };
}

/**
 * Wrapper for protected API routes
 */
export async function protectedRoute(
  handler: (request: NextRequest, userId: string) => Promise<any>
) {
  return async (request: NextRequest) => {
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return auth.error;
    }

    return handler(request, auth.userId);
  };
}
