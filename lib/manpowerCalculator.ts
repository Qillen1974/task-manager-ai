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
  operationalStaff: number; // People doing the actual work (100% allocation)
  managementStaff: number;  // Managers/leads providing oversight (variable allocation)
  taskDurationWeeks: number;
  codeReviewPercentage: number;
  documentationPercentage: number;
  adminPercentage: number;
  customBaseHoursPerWeek?: number; // Optional: override default base hours per week
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
  roleBreakdown: {
    operationalManHours: number;
    managementManHours: number;
    operationalResourceCount: number;
    managementResourceCount: number;
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
function calculateBaseHours(taskType: TaskType, complexity: Complexity, weeks: number, customBaseHoursPerWeek?: number): number {
  const baseRate = customBaseHoursPerWeek !== undefined ? customBaseHoursPerWeek : BASE_HOURS_BY_TYPE[taskType];
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
 * Get management staff utilization rate based on task type
 * Different task types require different levels of management oversight
 */
function getManagementUtilizationRate(taskType: TaskType): number {
  // Management utilization as percentage of base hours
  // How much time managers/leads spend on this type of work
  const rates: Record<TaskType, number> = {
    development: 0.35, // 35%: Code reviews, technical decisions, mentoring
    design: 0.4, // 40%: Design reviews, feedback, stakeholder communication
    testing: 0.3, // 30%: QA oversight, bug triage, process management
    documentation: 0.15, // 15%: Minimal management needed for pure documentation
    management: 1.0, // 100%: This IS the manager's primary work
    research: 0.35, // 35%: Research oversight, stakeholder collaboration
    requirements: 0.5, // 50%: High involvement in stakeholder meetings and docs
  };
  return rates[taskType] || 0.35;
}

/**
 * Get activity cap percentage based on task type
 * Different task types have different overhead expectations
 */
function getActivityCapPercentage(taskType: TaskType): number {
  // Activity cap as percentage of base hours
  // Different task types have different expected overhead
  const caps: Record<TaskType, number> = {
    development: 0.5, // 50%: Code review, documentation, admin
    design: 0.6, // 60%: Design review, documentation, stakeholder feedback
    testing: 0.55, // 55%: Test review, documentation, bug analysis
    documentation: 0.3, // 30%: Minimal overhead for pure documentation work
    management: 0.8, // 80%: High overhead for coordination and communication
    research: 0.6, // 60%: Documentation and stakeholder collaboration
    requirements: 0.9, // 90%: Very high overhead for meetings and documentation
  };
  return caps[taskType] || 0.5;
}

/**
 * Calculate additional activity hours
 * Total additional activities are capped based on task type
 * Different task types have different overhead expectations
 */
function calculateActivityHours(
  baseHours: number,
  taskType: TaskType,
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

  // Get task-type-specific cap
  // Requirements gathering: 90% (meetings, stakeholder docs)
  // Management: 80% (coordination overhead)
  // Design: 60% (design reviews, feedback)
  // Development: 50% (code review, docs)
  // Testing: 55% (test review, documentation)
  // Research: 60% (documentation, analysis)
  // Documentation: 30% (minimal overhead)
  const capPercentage = getActivityCapPercentage(taskType);
  const maxAdditionalHours = baseHours * capPercentage;
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
 * Now differentiates between operational staff (doing the work) and management staff (oversight)
 */
export function calculateManpower(input: ManpowerInput): ManpowerOutput {
  const baseHours = calculateBaseHours(input.taskType, input.complexity, input.taskDurationWeeks, input.customBaseHoursPerWeek);
  const meetingHours = calculateMeetingHours(
    input.meetingsPerWeek,
    input.meetingDurationMinutes,
    input.taskDurationWeeks
  );

  const activityHours = calculateActivityHours(
    baseHours,
    input.taskType,
    input.codeReviewPercentage,
    input.documentationPercentage,
    input.adminPercentage
  );

  const totalManHours =
    baseHours + meetingHours + activityHours.codeReview + activityHours.documentation + activityHours.admin;

  // Calculate role-based hours allocation
  const managementUtilizationRate = getManagementUtilizationRate(input.taskType);

  // Operational staff: Full allocation of base hours + activities, partial meetings
  const operationalBaseHours = baseHours * input.operationalStaff;
  const operationalActivityHours = (activityHours.codeReview + activityHours.documentation + activityHours.admin) * input.operationalStaff;
  const operationalMeetingHours = meetingHours * input.operationalStaff;
  const operationalManHours = operationalBaseHours + operationalActivityHours + operationalMeetingHours;

  // Management staff: Partial allocation (oversight), plus coordinating meetings
  const managementBaseHours = baseHours * input.managementStaff * managementUtilizationRate;
  const managementMeetingHours = meetingHours * input.managementStaff;
  const managementManHours = managementBaseHours + managementMeetingHours;

  // Total across all staff
  const totalAllManHours = operationalManHours + managementManHours;

  // Calculate resource counts
  const operationalResourceCount = operationalManHours / (40 * input.taskDurationWeeks);
  const managementResourceCount = managementManHours / (40 * input.taskDurationWeeks);
  const totalResourceCount = (operationalManHours + managementManHours) / (40 * input.taskDurationWeeks);

  // Calculate hours per person per week
  const totalTeamSize = input.operationalStaff + input.managementStaff;
  const hoursPerPersonPerWeek = totalTeamSize > 0 ? totalAllManHours / (input.taskDurationWeeks * totalTeamSize) : 0;

  // Generate weekly breakdown
  const weeklyBreakdown = generateWeeklyBreakdown(
    baseHours,
    meetingHours,
    input.taskDurationWeeks,
    input.operationalStaff + input.managementStaff
  );

  return {
    totalManHours: Math.round(totalAllManHours * 10) / 10,
    totalResourceCount: Math.round(totalResourceCount * 100) / 100,
    breakdown: {
      baseHours: Math.round(baseHours * 10) / 10,
      meetingHours: Math.round(meetingHours * 10) / 10,
      codeReviewHours: Math.round(activityHours.codeReview * 10) / 10,
      documentationHours: Math.round(activityHours.documentation * 10) / 10,
      adminHours: Math.round(activityHours.admin * 10) / 10,
    },
    roleBreakdown: {
      operationalManHours: Math.round(operationalManHours * 10) / 10,
      managementManHours: Math.round(managementManHours * 10) / 10,
      operationalResourceCount: Math.round(operationalResourceCount * 100) / 100,
      managementResourceCount: Math.round(managementResourceCount * 100) / 100,
    },
    weeklyBreakdown,
    hoursPerPersonPerWeek: Math.round(hoursPerPersonPerWeek * 10) / 10,
    summary: generateSummary(
      baseHours,
      meetingHours,
      totalAllManHours,
      input.operationalStaff,
      input.managementStaff,
      managementUtilizationRate,
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
  operationalStaff: number,
  managementStaff: number,
  managementUtilizationRate: number,
  weeks: number
): string {
  const hoursPerWeek = totalHours / weeks;
  const totalTeamSize = operationalStaff + managementStaff;

  let summary = `Total effort: ${totalHours.toFixed(1)} hours`;

  if (totalTeamSize > 0) {
    summary += ` over ${weeks} week${weeks !== 1 ? 's' : ''}`;
  }

  summary += `. This breaks down to ${hoursPerWeek.toFixed(1)} hours/week`;

  if (totalTeamSize > 0) {
    const hoursPerPersonPerWeek = totalHours / (weeks * totalTeamSize);
    summary += ` across ${totalTeamSize} team member${totalTeamSize !== 1 ? 's' : ''} (${hoursPerPersonPerWeek.toFixed(1)} hours/person/week)`;

    if (managementStaff > 0) {
      summary += `, with ${operationalStaff} operational and ${managementStaff} management at ~${(managementUtilizationRate * 100).toFixed(0)}% utilization`;
    }
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

  if (input.operationalStaff === undefined || input.operationalStaff < 0) {
    errors.push('Operational staff cannot be negative');
  }

  if (input.managementStaff === undefined || input.managementStaff < 0) {
    errors.push('Management staff cannot be negative');
  }

  if ((input.operationalStaff || 0) + (input.managementStaff || 0) <= 0) {
    errors.push('At least 1 team member (operational or management) is required');
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

/**
 * Get default base hours per week for a task type
 */
export function getDefaultBaseHours(taskType: TaskType): number {
  return BASE_HOURS_BY_TYPE[taskType] || 40;
}
