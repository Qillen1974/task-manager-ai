import { NextRequest, NextResponse } from 'next/server';
import { calculateManpower, validateManpowerInput } from '@/lib/manpowerCalculator';

interface ManpowerRequest {
  taskType: string;
  complexity: string;
  meetingsPerWeek: number;
  meetingDurationMinutes: number;
  numberOfTeamMembers: number;
  taskDurationWeeks: number;
  codeReviewPercentage: number;
  documentationPercentage: number;
  adminPercentage: number;
}

/**
 * POST /api/tools/manpower-calculator
 * Calculate manpower requirements based on task parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ManpowerRequest;

    // Validate input
    const errors = validateManpowerInput(body);
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors,
        },
        { status: 400 }
      );
    }

    // Calculate manpower
    const result = calculateManpower({
      taskType: body.taskType as any,
      complexity: body.complexity as any,
      meetingsPerWeek: body.meetingsPerWeek,
      meetingDurationMinutes: body.meetingDurationMinutes,
      numberOfTeamMembers: body.numberOfTeamMembers,
      taskDurationWeeks: body.taskDurationWeeks,
      codeReviewPercentage: body.codeReviewPercentage,
      documentationPercentage: body.documentationPercentage,
      adminPercentage: body.adminPercentage,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in manpower calculator:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate manpower. Please check your inputs and try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tools/manpower-calculator
 * Returns calculator documentation and example
 */
export async function GET() {
  return NextResponse.json(
    {
      name: 'Manpower Calculator API',
      description: 'Calculate manpower and resource requirements for tasks',
      endpoint: '/api/tools/manpower-calculator',
      method: 'POST',
      example_request: {
        taskType: 'development',
        complexity: 'medium',
        meetingsPerWeek: 2,
        meetingDurationMinutes: 60,
        numberOfTeamMembers: 2,
        taskDurationWeeks: 4,
        codeReviewPercentage: 10,
        documentationPercentage: 5,
        adminPercentage: 5,
      },
      example_response: {
        success: true,
        data: {
          totalManHours: 320.0,
          totalResourceCount: 1.6,
          breakdown: {
            baseHours: 160.0,
            meetingHours: 120.0,
            codeReviewHours: 16.0,
            documentationHours: 8.0,
            adminHours: 8.0,
          },
          hoursPerPersonPerWeek: 40.0,
          summary: 'Total effort: 320.0 hours (2 person-weeks). This breaks down to 80 hours/week...',
        },
      },
    },
    { status: 200 }
  );
}
