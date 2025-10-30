import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { success, handleApiError } from "@/lib/apiResponse";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_EXPIRY = "7d"; // 7 days

/**
 * POST /api/admin/login - Generate JWT token for admin session
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body = await request.json();
    const { adminId, email, role } = body;

    console.log("POST /api/admin/login - adminId:", adminId, "role:", role);
    console.log("JWT_SECRET available:", !!JWT_SECRET);
    console.log("JWT_SECRET length:", JWT_SECRET.length);

    if (!adminId || !email || !role) {
      return { success: false, error: { message: "Missing required fields", code: "MISSING_FIELDS" } };
    }

    // Generate JWT token for admin
    const token = jwt.sign(
      { userId: adminId, email, role, type: "access" },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    console.log("Token generated, length:", token.length);

    return success({ token });
  });
}
