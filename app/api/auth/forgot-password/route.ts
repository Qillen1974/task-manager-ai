import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword, validateEmail } from "@/lib/authUtils";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { sendEmail } from "@/lib/emailService";
import { passwordResetCodeEmailTemplate } from "@/lib/emailTemplates";

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return ApiErrors.MISSING_REQUIRED_FIELD("email");
    }

    if (!validateEmail(email)) {
      return ApiErrors.INVALID_EMAIL();
    }

    // Find user by email (don't reveal if user exists)
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success even if user not found (security: no user enumeration)
    if (!user) {
      return success({
        message: "If an account with that email exists, a reset code has been sent.",
      });
    }

    // Delete any existing reset codes for this user
    await db.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Generate 6-digit code
    const resetCode = crypto.randomInt(100000, 999999).toString();

    // Hash the code before storing
    const hashedCode = await hashPassword(resetCode);

    // Store with 15-minute expiration
    await db.passwordReset.create({
      data: {
        userId: user.id,
        code: hashedCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Send email with code
    const recipientName = user.firstName || user.name || "there";
    const { html, text } = passwordResetCodeEmailTemplate(recipientName, resetCode);

    await sendEmail({
      to: user.email,
      subject: "Password Reset Code - TaskQuadrant",
      html,
      text,
    });

    return success({
      message: "If an account with that email exists, a reset code has been sent.",
    });
  });
}
