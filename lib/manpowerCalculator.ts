/**
 * Manpower Calculator Utility
 * Helps users estimate hours and resources needed for tasks
 */

export type TaskType = 'development' | 'design' | 'testing' | 'documentation' | 'management' | 'research' | 'requirements';
export type Complexity = 'simple' | 'medium' | 'complex';

interface ManpowerInput {
  taskType: TaskType;
  complexity: Complexity;
  meetingsPerWeek: number;
  meetingDurationMinutes: number;
  numberOfTeamMembers: number;
  taskDurationWeeks: number;
  codeReviewPercentage: number;
  documentationPercentage: number;
  adminPercentage: number;
}

interface ManpowerOutput {
  totalManHours: number;
  totalResourceCount: number;
  breakdown: {
    baseHours: number;
    meetingHours: number;
    codeReviewHours: number;
    documentationHours: number;
    adminHours: number;
  };
  weeklyBreakdown: {
    week: number;
    hoursPerWeek: number;
  }[];
  hoursPerPersonPerWeek: number;
  summary: string;
}

/**
 * Base hours per task type (per week for one person)
 * These are starting points that vary by complexity
 */
const BASE_HOURS_BY_TYPE: Record<TaskType, number> = {
  development: 40, // Full time
  design: 40,
  testing: 40,
  documentation: 30, // Less intensive
  management: 35,
  research: 35,
  requirements: 40, // Intensive stakeholder engagement
};

/**
 * Complexity multipliers
 */
const COMPLEXITY_MULTIPLIERS: Record<Complexity, number> = {
  simple: 0.7, // Less time needed
  medium: 1.0, // Standard estimate
  complex: 1.4, // More time needed
};

/**
 * Calculate base hours based on task type and complexity
 */
function calculateBaseHours(taskType: TaskType, complexity: Complexity, weeks: number): number {
  const baseRate = BASE_HOURS_BY_TYPE[taskType];
  const multiplier = COMPLEXITY_MULTIPLIERS[complexity];
  return baseRate * multiplier * weeks;
}

/**
 * Calculate meeting hours
 */
function calculateMeetingHours(
  meetingsPerWeek: number,
  meetingDurationMinutes: number,
  weeks: number
): number {
  const hoursPerMeeting = meetingDurationMinutes / 60;
  return meetingsPerWeek * hoursPerMeeting * weeks;
}

/**
 * Calculate additional activity hours
 * Total additional activities are capped at 50% of base hours combined
 */
function calculateActivityHours(
  baseHours: number,
  codeReviewPercentage: number,
  documentationPercentage: number,
  adminPercentage: number
): {
  codeReview: number;
  documentation: number;
  admin: number;
} {
  // Calculate total activity hours before cap
  const totalActivityPercentage = codeReviewPercentage + documentationPercentage + adminPercentage;
  const rawActivityHours = (baseHours * totalActivityPercentage) / 100;

  // Cap total additional activities at 50% of base hours
  // This ensures people don't have unrealistic overhead on top of base work
  const maxAdditionalHours = baseHours * 0.5;
  const cappedActivityHours = Math.min(rawActivityHours, maxAdditionalHours);

  // If capped, scale down each activity proportionally
  const scaleFactor = totalActivityPercentage > 0 ? cappedActivityHours / rawActivityHours : 0;

  return {
    codeReview: (baseHours * codeReviewPercentage / 100) * scaleFactor,
    documentation: (baseHours * documentationPercentage / 100) * scaleFactor,
    admin: (baseHours * adminPercentage / 100) * scaleFactor,
  };
}

/**
 * Calculate total manpower requirements
 */
export function calculateManpower(input: ManpowerInput): ManpowerOutput {
  const baseHours = calculateBaseHours(input.taskType, input.complexity, input.taskDurationWeeks);
  const meetingHours = calculateMeetingHours(
    input.meetingsPerWeek,
    input.meetingDurationMinutes,
    input.taskDurationWeeks
  );

  const activityHours = calculateActivityHours(
    baseHours,
    input.codeReviewPercentage,
    input.documentationPercentage,
    input.adminPercentage
  );

  const totalManHours =
    baseHours + meetingHours + activityHours.codeReview + activityHours.documentation + activityHours.admin;

  // Calculate hours per person per week
  // This shows how many hours each team member would work per week if effort is distributed evenly
  const hoursPerPersonPerWeek = input.numberOfTeamMembers > 0 ? totalManHours / (input.taskDurationWeeks * input.numberOfTeamMembers) : 0;

  // Calculate total resource count (in person-weeks)
  // This represents how many person-weeks of effort are required
  // (assuming 40 hours per week standard work week)
  const totalResourceCount = totalManHours / (40 * input.taskDurationWeeks);

  // Generate weekly breakdown
  const weeklyBreakdown = generateWeeklyBreakdown(
    baseHours,
    meetingHours,
    input.taskDurationWeeks,
    input.numberOfTeamMembers
  );

  return {
    totalManHours: Math.round(totalManHours * 10) / 10, // Round to 1 decimal
    totalResourceCount: Math.round(totalResourceCount * 100) / 100, // Round to 2 decimals
    breakdown: {
      baseHours: Math.round(baseHours * 10) / 10,
      meetingHours: Math.round(meetingHours * 10) / 10,
      codeReviewHours: Math.round(activityHours.codeReview * 10) / 10,
      documentationHours: Math.round(activityHours.documentation * 10) / 10,
      adminHours: Math.round(activityHours.admin * 10) / 10,
    },
    weeklyBreakdown,
    hoursPerPersonPerWeek: Math.round(hoursPerPersonPerWeek * 10) / 10,
    summary: generateSummary(
      baseHours,
      meetingHours,
      totalManHours,
      input.numberOfTeamMembers,
      input.taskDurationWeeks
    ),
  };
}

/**
 * Generate weekly breakdown of hours
 */
function generateWeeklyBreakdown(
  baseHours: number,
  meetingHours: number,
  weeks: number,
  teamMembers: number
): Array<{ week: number; hoursPerWeek: number }> {
  const breakdown: Array<{ week: number; hoursPerWeek: number }> = [];
  const baseHoursPerWeek = baseHours / weeks;
  const meetingHoursPerWeek = meetingHours / weeks;
  const totalHoursPerWeek = baseHoursPerWeek + meetingHoursPerWeek;

  for (let i = 1; i <= weeks; i++) {
    breakdown.push({
      week: i,
      hoursPerWeek: Math.round(totalHoursPerWeek * 10) / 10,
    });
  }

  return breakdown;
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  baseHours: number,
  meetingHours: number,
  totalHours: number,
  teamMembers: number,
  weeks: number
): string {
  const resourceCount = totalHours / (40 * weeks);
  const hoursPerWeek = totalHours / weeks;
  const hoursPerMember = teamMembers > 0 ? totalHours / teamMembers : totalHours;

  let summary = `Total effort: ${totalHours.toFixed(1)} hours`;

  if (teamMembers > 0) {
    summary += ` (${teamMembers} person-weeks)`;
  }

  summary += `. This breaks down to ${hoursPerWeek.toFixed(1)} hours/week`;

  if (teamMembers > 1) {
    summary += ` across ${teamMembers} team members (${(hoursPerMember / weeks).toFixed(1)} hours/person/week)`;
  }

  if (meetingHours > 0) {
    const meetingPercentage = (meetingHours / totalHours * 100).toFixed(0);
    summary += `. ${meetingPercentage}% of time in meetings`;
  }

  return summary + '.';
}

/**
 * Validate calculator inputs
 */
export function validateManpowerInput(input: Partial<ManpowerInput>): string[] {
  const errors: string[] = [];

  if (!input.taskType) {
    errors.push('Task type is required');
  }

  if (!input.complexity) {
    errors.push('Complexity level is required');
  }

  if (input.taskDurationWeeks === undefined || input.taskDurationWeeks <= 0) {
    errors.push('Task duration must be greater than 0');
  }

  if (input.numberOfTeamMembers === undefined || input.numberOfTeamMembers <= 0) {
    errors.push('Number of team members must be at least 1');
  }

  if (input.meetingsPerWeek === undefined || input.meetingsPerWeek < 0) {
    errors.push('Meetings per week cannot be negative');
  }

  if (input.meetingDurationMinutes === undefined || input.meetingDurationMinutes <= 0) {
    errors.push('Meeting duration must be greater than 0');
  }

  const totalPercentage =
    (input.codeReviewPercentage || 0) + (input.documentationPercentage || 0) + (input.adminPercentage || 0);

  if (totalPercentage > 150) {
    errors.push('Total additional activities cannot exceed 150%');
  }

  return errors;
}

/**
 * Get default values for a task type
 */
export function getDefaultsForTaskType(taskType: TaskType): Partial<ManpowerInput> {
  const defaults: Record<TaskType, Partial<ManpowerInput>> = {
    development: {
      meetingsPerWeek: 2,
      codeReviewPercentage: 10,
      documentationPercentage: 5,
      adminPercentage: 5,
    },
    design: {
      meetingsPerWeek: 2,
      codeReviewPercentage: 0,
      documentationPercentage: 10,
      adminPercentage: 5,
    },
    testing: {
      meetingsPerWeek: 1,
      codeReviewPercentage: 5,
      documentationPercentage: 15,
      adminPercentage: 5,
    },
    documentation: {
      meetingsPerWeek: 1,
      codeReviewPercentage: 0,
      documentationPercentage: 80,
      adminPercentage: 5,
    },
    management: {
      meetingsPerWeek: 4,
      codeReviewPercentage: 0,
      documentationPercentage: 0,
      adminPercentage: 30,
    },
    research: {
      meetingsPerWeek: 1,
      codeReviewPercentage: 0,
      documentationPercentage: 20,
      adminPercentage: 10,
    },
    requirements: {
      meetingsPerWeek: 3,
      codeReviewPercentage: 0,
      documentationPercentage: 30,
      adminPercentage: 10,
    },
  };

  return defaults[taskType] || {};
}
