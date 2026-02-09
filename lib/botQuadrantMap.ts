/**
 * Maps between bot-facing quadrant names (q1-q4) and internal priority values
 *
 * q1 = DO_FIRST     (Urgent + Important)
 * q2 = SCHEDULE     (Not Urgent + Important)
 * q3 = DELEGATE     (Urgent + Not Important)
 * q4 = ELIMINATE    (Not Urgent + Not Important)
 */

const QUADRANT_TO_PRIORITY: Record<string, string> = {
  q1: "DO_FIRST",
  q2: "SCHEDULE",
  q3: "DELEGATE",
  q4: "ELIMINATE",
};

const PRIORITY_TO_QUADRANT: Record<string, string> = {
  DO_FIRST: "q1",
  SCHEDULE: "q2",
  DELEGATE: "q3",
  ELIMINATE: "q4",
};

/**
 * Convert bot-facing quadrant (q1-q4) to internal priority value
 */
export function quadrantToPriority(quadrant: string): string | null {
  return QUADRANT_TO_PRIORITY[quadrant.toLowerCase()] || null;
}

/**
 * Convert internal priority value to bot-facing quadrant (q1-q4)
 */
export function priorityToQuadrant(priority: string | null): string | null {
  if (!priority) return null;
  return PRIORITY_TO_QUADRANT[priority] || null;
}

/**
 * Check if a quadrant value is valid
 */
export function isValidQuadrant(quadrant: string): boolean {
  return quadrant.toLowerCase() in QUADRANT_TO_PRIORITY;
}

/**
 * Get all valid quadrant values for documentation/validation
 */
export function getValidQuadrants(): string[] {
  return Object.keys(QUADRANT_TO_PRIORITY);
}
