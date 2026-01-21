import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePasswordStrength,
} from "@/lib/authUtils";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body = await request.json();
    const { email, code, newPassword } = body;

    // Validation
    if (!email) {
      return ApiErrors.MISSING_REQUIRED_FIELD("email");
    }
    if (!code) {
      return ApiErrors.MISSING_REQUIRED_FIELD("code");
    }
    if (!newPassword) {
      return ApiErrors.MISSING_REQUIRED_FIELD("newPassword");
    }

    if (!validateEmail(email)) {
      return ApiErrors.INVALID_EMAIL();
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return error("Invalid reset code format", 400, "INVALID_CODE");
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return ApiErrors.WEAK_PASSWORD(passwordCheck.errors);
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return error("Invalid reset code or email", 400, "INVALID_RESET");
    }

    // Find valid (non-expired, unused) reset code for this user
    const resetRecord = await db.passwordReset.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!resetRecord) {
      return error("Reset code has expired or is invalid", 400, "INVALID_RESET");
    }

    // Verify code matches (bcrypt compare)
    const codeMatches = await verifyPassword(code, resetRecord.code);
    if (!codeMatches) {
      return error("Invalid reset code", 400, "INVALID_CODE");
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user's password and mark reset code as used (in transaction)
    await db.$transaction([
      // Update user password
      db.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      // Mark reset code as used
      db.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Delete all user sessions (security: force re-login everywhere)
      db.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return success({
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  });
}
