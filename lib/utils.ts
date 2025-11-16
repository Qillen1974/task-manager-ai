import { Task, Priority, RecurringPattern, RecurringConfig } from "./types";

export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "Urgent & Important",
    "not-urgent-important": "Not Urgent & Important",
    "urgent-not-important": "Urgent & Not Important",
    "not-urgent-not-important": "Not Urgent & Not Important",
  };
  return priority === "" ? "No Quadrant" : labels[priority as Exclude<Priority, "">];
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "bg-red-50 border-red-200",
    "not-urgent-important": "bg-blue-50 border-blue-200",
    "urgent-not-important": "bg-yellow-50 border-yellow-200",
    "not-urgent-not-important": "bg-gray-50 border-gray-200",
  };
  return priority === "" ? "bg-gray-50 border-gray-200" : colors[priority as Exclude<Priority, "">];
}

export function getPriorityBadgeColor(priority: Priority): string {
  const colors: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "bg-red-100 text-red-800",
    "not-urgent-important": "bg-blue-100 text-blue-800",
    "urgent-not-important": "bg-yellow-100 text-yellow-800",
    "not-urgent-not-important": "bg-gray-100 text-gray-800",
  };
  return priority === "" ? "bg-gray-100 text-gray-800" : colors[priority as Exclude<Priority, "">];
}

export function getPriorityQuadrant(priority: Priority): string {
  const quadrants: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "Quadrant I",
    "not-urgent-important": "Quadrant II",
    "urgent-not-important": "Quadrant III",
    "not-urgent-not-important": "Quadrant IV",
  };
  return priority === "" ? "None" : quadrants[priority as Exclude<Priority, "">];
}

export function isDeadlineSoon(deadline?: string): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

export function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "No deadline";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date?: string, time?: string): string {
  if (!date) return "No deadline";
  let result = formatDate(date);
  if (time) {
    result += ` at ${time}`;
  }
  return result;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function filterTasksByPriority(tasks: Task[], priority: Priority): Task[] {
  return tasks.filter((task) => task.priority === priority);
}

export function getTasksByProject(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectId === projectId);
}

export function getCompletedTaskCount(tasks: Task[]): number {
  return tasks.filter((task) => task.completed).length;
}

export function getPendingTaskCount(tasks: Task[]): number {
  return tasks.filter((task) => !task.completed).length;
}

/**
 * Recurring task utility functions
 */

export function getRecurringPatternLabel(pattern: RecurringPattern): string {
  const labels: Record<RecurringPattern, string> = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    CUSTOM: "Custom",
  };
  return labels[pattern];
}

/**
 * Parse recurring config from JSON string or object
 */
export function parseRecurringConfig(config: RecurringConfig | string | null): RecurringConfig | null {
  if (!config) return null;
  if (typeof config === "object") return config;
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
}

/**
 * Format recurring config as readable string
 * Example: "Every 2 weeks on Monday, Wednesday"
 */
export function formatRecurringDescription(pattern: RecurringPattern, config: RecurringConfig | string | null): string {
  const parsedConfig = parseRecurringConfig(config);
  if (!parsedConfig) return getRecurringPatternLabel(pattern);

  const { pattern: cfgPattern, interval } = parsedConfig;

  if (cfgPattern === "DAILY") {
    return interval === 1 ? "Every day" : `Every ${interval} days`;
  }

  if (cfgPattern === "WEEKLY") {
    const days = parsedConfig.daysOfWeek || [];
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNames = days.map((d) => dayLabels[d] || "").filter(Boolean);
    const daysStr = dayNames.length > 0 ? ` on ${dayNames.join(", ")}` : "";
    return interval === 1 ? `Every week${daysStr}` : `Every ${interval} weeks${daysStr}`;
  }

  if (cfgPattern === "MONTHLY") {
    const dayOfMonth = parsedConfig.dayOfMonth || 1;
    const dayStr = getDayOfMonthSuffix(dayOfMonth);
    return interval === 1 ? `Every month on the ${dayStr}` : `Every ${interval} months on the ${dayStr}`;
  }

  if (cfgPattern === "CUSTOM") {
    const customType = parsedConfig.customType || "DAILY";
    const typeLabel = getRecurringPatternLabel(customType as RecurringPattern);
    return `Every ${interval} ${customType.toLowerCase()}${interval !== 1 ? "s" : ""}`;
  }

  return getRecurringPatternLabel(pattern);
}

/**
 * Get day of month suffix (1st, 2nd, 3rd, 4th, etc.)
 */
function getDayOfMonthSuffix(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/**
 * Calculate the next occurrence date based on recurring config
 * @param lastOccurrenceDate - The date of the last occurrence (or start date for first occurrence)
 * @param config - The recurring configuration
 * @returns The next occurrence date
 */
export function calculateNextOccurrenceDate(
  lastOccurrenceDate: string | Date,
  config: RecurringConfig | string | null
): Date | null {
  const parsedConfig = parseRecurringConfig(config);
  if (!parsedConfig) return null;

  const lastDate = typeof lastOccurrenceDate === "string" ? new Date(lastOccurrenceDate) : lastOccurrenceDate;
  const nextDate = new Date(lastDate);

  const { pattern, interval } = parsedConfig;

  if (pattern === "DAILY") {
    nextDate.setDate(nextDate.getDate() + interval);
  } else if (pattern === "WEEKLY") {
    nextDate.setDate(nextDate.getDate() + interval * 7);
    // If specific days of week are set, find the next matching day
    if (parsedConfig.daysOfWeek && parsedConfig.daysOfWeek.length > 0) {
      const daysOfWeek = parsedConfig.daysOfWeek.sort();
      const currentDayOfWeek = nextDate.getDay();
      const nextMatchingDay = daysOfWeek.find((d) => d >= currentDayOfWeek) || daysOfWeek[0];
      const daysToAdd =
        nextMatchingDay >= currentDayOfWeek ? nextMatchingDay - currentDayOfWeek : 7 - currentDayOfWeek + nextMatchingDay;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }
  } else if (pattern === "MONTHLY") {
    nextDate.setMonth(nextDate.getMonth() + interval);
    if (parsedConfig.dayOfMonth) {
      // Set to the desired day of month, ensuring it doesn't exceed the max days in that month
      const maxDayInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      nextDate.setDate(Math.min(parsedConfig.dayOfMonth, maxDayInMonth));
    }
  } else if (pattern === "CUSTOM") {
    const customType = parsedConfig.customType || "DAILY";
    if (customType === "DAILY") {
      nextDate.setDate(nextDate.getDate() + interval);
    } else if (customType === "WEEKLY") {
      nextDate.setDate(nextDate.getDate() + interval * 7);
    } else if (customType === "MONTHLY") {
      nextDate.setMonth(nextDate.getMonth() + interval);
    } else if (customType === "YEARLY") {
      nextDate.setFullYear(nextDate.getFullYear() + interval);
    }
  }

  return nextDate;
}

/**
 * Calculate the initial nextGenerationDate for a new recurring task
 * For tasks that should have run before today (e.g., Monday task on Tuesday),
 * set the generation date to today so it generates immediately
 */
export function calculateInitialNextGenerationDate(
  config: RecurringConfig | string | null
): Date | null {
  const parsedConfig = parseRecurringConfig(config);
  if (!parsedConfig) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentDayOfWeek = today.getDay();
  const { pattern, interval, daysOfWeek, dayOfMonth } = parsedConfig;

  if (pattern === "DAILY") {
    // Daily tasks generate today
    return today;
  } else if (pattern === "WEEKLY" && daysOfWeek && daysOfWeek.length > 0) {
    const sortedDays = daysOfWeek.sort();

    // Check if any scheduled day already passed this week
    const dayThatPassedThisWeek = sortedDays.find((d) => d < currentDayOfWeek);
    if (dayThatPassedThisWeek !== undefined) {
      // A scheduled day already passed this week, generate today (it's overdue)
      return today;
    }

    // Check if today is a scheduled day
    const isTodayScheduled = sortedDays.includes(currentDayOfWeek);
    if (isTodayScheduled) {
      // Today is a scheduled day, generate today
      return today;
    }

    // Find next scheduled day this week
    const nextDayThisWeek = sortedDays.find((d) => d > currentDayOfWeek);
    if (nextDayThisWeek !== undefined) {
      // Next occurrence is later this week
      const daysToAdd = nextDayThisWeek - currentDayOfWeek;
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      return nextDate;
    }

    // Next occurrence is next week
    const firstDayNextWeek = sortedDays[0];
    const daysToAdd = 7 - currentDayOfWeek + firstDayNextWeek;
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  } else if (pattern === "MONTHLY" && dayOfMonth) {
    const currentDate = today.getDate();
    if (dayOfMonth >= currentDate) {
      // Scheduled day hasn't passed this month yet
      const nextDate = new Date(today);
      nextDate.setDate(dayOfMonth);
      return nextDate;
    } else {
      // Scheduled day already passed, schedule for next month
      const nextDate = new Date(today);
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(dayOfMonth);
      return nextDate;
    }
  }

  return calculateNextOccurrenceDate(today, config);
}

/**
 * Check if we should generate a new instance of a recurring task
 * @param lastGeneratedDate - When the last instance was generated
 * @param nextGenerationDate - When the next instance should be generated
 * @returns true if we should generate now
 */
export function shouldGenerateRecurringTask(lastGeneratedDate: Date | null, nextGenerationDate: Date | null): boolean {
  if (!nextGenerationDate) return false;
  return new Date() >= nextGenerationDate;
}

/**
 * Check if a recurring task has reached its end condition
 */
export function isRecurringTaskEnded(
  lastGeneratedDate: Date | null,
  config: RecurringConfig | string | null,
  recurringEndDate: Date | null
): boolean {
  const parsedConfig = parseRecurringConfig(config);
  if (!parsedConfig) return false;

  // Check end date
  if (recurringEndDate && new Date() > recurringEndDate) {
    return true;
  }

  // Check end after occurrences (would need to count generated tasks)
  // This would be handled separately in the API
  return false;
}

/**
 * Calculate hours remaining until due date
 * Returns negative value if due date is in the past
 */
export function getHoursUntilDue(dueDate?: string, dueTime?: string): number | null {
  if (!dueDate) return null;

  const now = new Date();
  let dueDatetime = new Date(dueDate);

  // If a time is specified, parse it and set it on the date
  if (dueTime) {
    const [hours, minutes] = dueTime.split(":").map(Number);
    dueDatetime.setHours(hours, minutes, 0, 0);
  } else {
    // If no time specified, assume end of day (23:59)
    dueDatetime.setHours(23, 59, 59, 999);
  }

  const diffMs = dueDatetime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Get auto-prioritized priority based on due date and current priority
 * Rules:
 * - Quadrant 2 (not-urgent-important) → Quadrant 1 (urgent-important) if due within threshold
 * - Quadrant 4 (not-urgent-not-important) → Quadrant 3 (urgent-not-important) if due within threshold
 * - Quadrants 1 and 3 remain unchanged (already urgent)
 * - Returns the auto-prioritized priority or original if no change needed
 */
export function getAutoPriority(
  originalPriority: Priority,
  dueDate?: string,
  dueTime?: string,
  thresholdHours: number = 48
): Priority {
  // No priority set or already in urgent quadrant
  if (!originalPriority || originalPriority === "urgent-important" || originalPriority === "urgent-not-important") {
    return originalPriority;
  }

  const hoursUntilDue = getHoursUntilDue(dueDate, dueTime);

  // No due date or invalid calculation
  if (hoursUntilDue === null || hoursUntilDue < 0) {
    return originalPriority;
  }

  // If due date is within threshold, auto-prioritize to urgent
  if (hoursUntilDue <= thresholdHours) {
    if (originalPriority === "not-urgent-important") {
      return "urgent-important"; // Move from Q2 to Q1
    }
    if (originalPriority === "not-urgent-not-important") {
      return "urgent-not-important"; // Move from Q4 to Q3
    }
  }

  return originalPriority;
}
