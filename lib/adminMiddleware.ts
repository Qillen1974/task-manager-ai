import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/authUtils";
import { ApiErrors } from "@/lib/apiResponse";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  console.log("=== verifyAdminAuth called ===");
  console.log("Full auth header:", authHeader);
  console.log("Auth header type:", typeof authHeader);

  if (!authHeader) {
    console.log("verifyAdminAuth: No auth header, returning UNAUTHORIZED");
    return { authenticated: false, error: ApiErrors.UNAUTHORIZED() };
  }

  const token = authHeader.replace("Bearer ", "");
  console.log("Token after removing 'Bearer ':", token);
  console.log("Token length:", token.length);
  console.log("Token first 100 chars:", token.substring(0, 100));

  // First, try to verify as admin token (contains role field)
  let decoded: any = null;
  try {
    console.log("verifyAdminAuth: Attempting to verify token with JWT_SECRET");
    decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string; type: string };
    console.log("verifyAdminAuth: Token verified successfully, decoded:", { userId: decoded.userId, role: decoded.role, type: decoded.type });
  } catch (err) {
    console.error("verifyAdminAuth: JWT verification failed:", err instanceof Error ? err.message : err);
    return { authenticated: false, error: ApiErrors.UNAUTHORIZED() };
  }

  // Check if this is an admin token (has role field indicating admin)
  if (decoded.role === "admin" || decoded.role === "super_admin") {
    console.log("verifyAdminAuth: Admin token detected, role:", decoded.role);
    // This is an admin session token - verify the type is access
    if (decoded.type !== "access") {
      console.log("verifyAdminAuth: Token type is not access:", decoded.type);
      return { authenticated: false, error: ApiErrors.UNAUTHORIZED() };
    }
    console.log("verifyAdminAuth: Admin authentication successful");
    return { authenticated: true, userId: decoded.userId };
  }

  console.log("verifyAdminAuth: Not an admin token, checking database");
  // Otherwise, check if user is admin in database (regular user JWT)
  const userDecoded = verifyToken(token, "access");
  if (!userDecoded) {
    console.log("verifyAdminAuth: User token verification failed");
    return { authenticated: false, error: ApiErrors.UNAUTHORIZED() };
  }

  // Check if user is admin using raw SQL since Prisma client doesn't have isAdmin field
  const result = await db.$queryRaw<Array<{ id: string; isAdmin: boolean }>>`
    SELECT id, "isAdmin" FROM "User" WHERE id = ${userDecoded.userId}
  `;

  if (result.length === 0 || !result[0].isAdmin) {
    console.log("verifyAdminAuth: User is not an admin");
    return { authenticated: false, error: ApiErrors.FORBIDDEN() };
  }

  console.log("verifyAdminAuth: User admin authentication successful");
  return { authenticated: true, userId: result[0].id };
}
