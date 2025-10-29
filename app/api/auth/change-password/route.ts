import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/authUtils';
import { success, ApiErrors, handleApiError } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return ApiErrors.MISSING_REQUIRED_FIELD('password');
    }

    if (newPassword !== confirmPassword) {
      return ApiErrors.INVALID_INPUT({ details: 'New passwords do not match' });
    }

    // Validate password strength
    const strengthValidation = validatePasswordStrength(newPassword);
    if (!strengthValidation.valid) {
      return ApiErrors.WEAK_PASSWORD(strengthValidation.errors);
    }

    // Get user and verify current password
    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return ApiErrors.USER_NOT_FOUND();
    }

    // Verify current password matches
    const passwordMatches = await verifyPassword(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return ApiErrors.INVALID_CREDENTIALS();
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await db.user.update({
      where: { id: auth.userId },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return success({
      message: 'Password changed successfully',
    });
  });
}
