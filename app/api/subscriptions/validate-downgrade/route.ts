import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/authUtils';
import { db } from '@/lib/db';
import { validateDowngrade } from '@/lib/subscriptionValidation';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid token' } },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const { plan } = await request.json();

    if (!plan || !['FREE', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid plan' } },
        { status: 400 }
      );
    }

    // Get user's current subscription
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: { message: 'No subscription found' } },
        { status: 404 }
      );
    }

    // Get current project and task counts
    const rootProjects = await db.project.count({
      where: {
        userId,
        parentProjectId: null,
      },
    });

    const taskCount = await db.task.count({
      where: { userId },
    });

    // Validate downgrade
    const validation = validateDowngrade(plan, rootProjects, taskCount);

    return NextResponse.json({
      success: true,
      data: {
        allowed: validation.allowed,
        message: validation.message,
        excessProjects: validation.excessProjects || 0,
        excessTasks: validation.excessTasks || 0,
        currentProjects: rootProjects,
        currentTasks: taskCount,
        targetPlan: plan,
      },
    });
  } catch (error) {
    console.error('Downgrade validation error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to validate downgrade' } },
      { status: 500 }
    );
  }
}
