import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/authUtils';
import { db } from '@/lib/db';
import { TASK_LIMITS, PROJECT_LIMITS } from '@/lib/projectLimits';

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

    if (subscription.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: { message: 'Subscription is already cancelled' } },
        { status: 400 }
      );
    }

    const currentPlan = subscription.plan;
    const newPlan = 'FREE';
    const freeProjectLimit = PROJECT_LIMITS.FREE.maxProjects;
    const freeTaskLimit = TASK_LIMITS.FREE.maxTasks;

    // Get user's projects and tasks
    const userProjects = await db.project.findMany({
      where: { userId },
      include: { childProjects: true },
    });

    const userTasks = await db.task.findMany({
      where: { userId },
    });

    // Count root projects
    const rootProjects = userProjects.filter(p => !p.parentProjectId);
    const totalProjects = userProjects.length;
    const totalTasks = userTasks.length;

    // Calculate excess items
    const excessProjects = rootProjects.slice(freeProjectLimit);
    const excessTasks = userTasks.slice(freeTaskLimit);

    // Set readOnlyUntil for excess items (30 days from now)
    const readOnlyUntilDate = new Date();
    readOnlyUntilDate.setDate(readOnlyUntilDate.getDate() + 30);

    // Mark excess projects as read-only
    if (excessProjects.length > 0) {
      await db.project.updateMany({
        where: { id: { in: excessProjects.map(p => p.id) } },
        data: { readOnlyUntil: readOnlyUntilDate },
      });
    }

    // Mark excess tasks as read-only
    if (excessTasks.length > 0) {
      await db.task.updateMany({
        where: { id: { in: excessTasks.map(t => t.id) } },
        data: { readOnlyUntil: readOnlyUntilDate },
      });
    }

    // Cancel the subscription
    await db.subscription.update({
      where: { userId },
      data: {
        plan: 'FREE',
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Subscription cancelled successfully',
        newPlan: 'FREE',
        excessProjects: excessProjects.length,
        excessTasks: excessTasks.length,
        readOnlyUntilDate: readOnlyUntilDate.toISOString(),
        details: excessProjects.length > 0 || excessTasks.length > 0
          ? `You have ${excessProjects.length} excess projects and ${excessTasks.length} excess tasks that are now read-only. You have 30 days to delete or manage them.`
          : 'Your subscription has been cancelled. You are now on the FREE plan.',
      },
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to cancel subscription' } },
      { status: 500 }
    );
  }
}
