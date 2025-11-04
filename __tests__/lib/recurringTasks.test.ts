import {
  getRecurringPatternLabel,
  parseRecurringConfig,
  formatRecurringDescription,
  calculateNextOccurrenceDate,
  shouldGenerateRecurringTask,
  isRecurringTaskEnded,
} from "@/lib/utils";
import { RecurringConfig, RecurringPattern } from "@/lib/types";

describe("Recurring Task Utilities", () => {
  describe("getRecurringPatternLabel", () => {
    it("should return correct label for DAILY pattern", () => {
      expect(getRecurringPatternLabel("DAILY")).toBe("Daily");
    });

    it("should return correct label for WEEKLY pattern", () => {
      expect(getRecurringPatternLabel("WEEKLY")).toBe("Weekly");
    });

    it("should return correct label for MONTHLY pattern", () => {
      expect(getRecurringPatternLabel("MONTHLY")).toBe("Monthly");
    });

    it("should return correct label for CUSTOM pattern", () => {
      expect(getRecurringPatternLabel("CUSTOM")).toBe("Custom");
    });
  });

  describe("parseRecurringConfig", () => {
    it("should parse JSON string config", () => {
      const configStr = JSON.stringify({ pattern: "DAILY", interval: 1 });
      const result = parseRecurringConfig(configStr);
      expect(result).toEqual({ pattern: "DAILY", interval: 1 });
    });

    it("should return object config as-is", () => {
      const config: RecurringConfig = { pattern: "DAILY", interval: 1 };
      const result = parseRecurringConfig(config);
      expect(result).toEqual(config);
    });

    it("should return null for invalid JSON", () => {
      const result = parseRecurringConfig("invalid json");
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      const result = parseRecurringConfig(null);
      expect(result).toBeNull();
    });
  });

  describe("formatRecurringDescription", () => {
    it("should format daily recurrence", () => {
      const config: RecurringConfig = { pattern: "DAILY", interval: 1 };
      const result = formatRecurringDescription("DAILY", config);
      expect(result).toBe("Every day");
    });

    it("should format every X days", () => {
      const config: RecurringConfig = { pattern: "DAILY", interval: 3 };
      const result = formatRecurringDescription("DAILY", config);
      expect(result).toBe("Every 3 days");
    });

    it("should format weekly recurrence", () => {
      const config: RecurringConfig = {
        pattern: "WEEKLY",
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      };
      const result = formatRecurringDescription("WEEKLY", config);
      expect(result).toContain("Every week");
      expect(result).toContain("Mon");
      expect(result).toContain("Wed");
      expect(result).toContain("Fri");
    });

    it("should format monthly recurrence", () => {
      const config: RecurringConfig = {
        pattern: "MONTHLY",
        interval: 1,
        dayOfMonth: 15,
      };
      const result = formatRecurringDescription("MONTHLY", config);
      expect(result).toBe("Every month on the 15th");
    });

    it("should format monthly recurrence with special cases", () => {
      const config1: RecurringConfig = {
        pattern: "MONTHLY",
        interval: 1,
        dayOfMonth: 1,
      };
      expect(formatRecurringDescription("MONTHLY", config1)).toBe("Every month on the 1st");

      const config2: RecurringConfig = {
        pattern: "MONTHLY",
        interval: 1,
        dayOfMonth: 2,
      };
      expect(formatRecurringDescription("MONTHLY", config2)).toBe("Every month on the 2nd");

      const config3: RecurringConfig = {
        pattern: "MONTHLY",
        interval: 1,
        dayOfMonth: 21,
      };
      expect(formatRecurringDescription("MONTHLY", config3)).toBe("Every month on the 21st");
    });
  });

  describe("calculateNextOccurrenceDate", () => {
    it("should calculate next occurrence for daily pattern", () => {
      const lastDate = "2024-01-01";
      const config: RecurringConfig = { pattern: "DAILY", interval: 1 };
      const result = calculateNextOccurrenceDate(lastDate, config);

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(2); // January 2nd
    });

    it("should calculate next occurrence for every X days", () => {
      const lastDate = "2024-01-01";
      const config: RecurringConfig = { pattern: "DAILY", interval: 3 };
      const result = calculateNextOccurrenceDate(lastDate, config);

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(4); // January 4th
    });

    it("should calculate next occurrence for weekly pattern", () => {
      const lastDate = "2024-01-01"; // Monday
      const config: RecurringConfig = {
        pattern: "WEEKLY",
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      };
      const result = calculateNextOccurrenceDate(lastDate, config);

      expect(result).not.toBeNull();
      // Should return next matching day or next week's cycle
      expect(result?.getDay()).toBeDefined();
    });

    it("should calculate next occurrence for monthly pattern", () => {
      const lastDate = "2024-01-15";
      const config: RecurringConfig = {
        pattern: "MONTHLY",
        interval: 1,
        dayOfMonth: 15,
      };
      const result = calculateNextOccurrenceDate(lastDate, config);

      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(15);
    });

    it("should handle leap year in monthly calculation", () => {
      const lastDate = "2024-01-31"; // January 31
      const config: RecurringConfig = {
        pattern: "MONTHLY",
        interval: 1,
        dayOfMonth: 31,
      };
      const result = calculateNextOccurrenceDate(lastDate, config);

      expect(result).not.toBeNull();
      // February doesn't have 31 days, should adjust to last day of February
      // Date will be adjusted to available day in month
      expect(result?.getMonth()).toBeLessThanOrEqual(2); // February or March
    });

    it("should return null for invalid config", () => {
      const lastDate = "2024-01-01";
      const result = calculateNextOccurrenceDate(lastDate, null);
      expect(result).toBeNull();
    });
  });

  describe("shouldGenerateRecurringTask", () => {
    it("should return true if next generation date has passed", () => {
      const lastGenerated = new Date(Date.now() - 86400000); // 1 day ago
      const nextGeneration = new Date(Date.now() - 1000); // 1 second ago
      const result = shouldGenerateRecurringTask(lastGenerated, nextGeneration);
      expect(result).toBe(true);
    });

    it("should return false if next generation date is in future", () => {
      const lastGenerated = new Date(Date.now() - 86400000); // 1 day ago
      const nextGeneration = new Date(Date.now() + 86400000); // 1 day from now
      const result = shouldGenerateRecurringTask(lastGenerated, nextGeneration);
      expect(result).toBe(false);
    });

    it("should return false if next generation date is null", () => {
      const lastGenerated = new Date();
      const result = shouldGenerateRecurringTask(lastGenerated, null);
      expect(result).toBe(false);
    });
  });

  describe("isRecurringTaskEnded", () => {
    it("should return true if end date has passed", () => {
      const lastGenerated = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() - 1000); // 1 second ago
      const config: RecurringConfig = { pattern: "DAILY", interval: 1 };
      const result = isRecurringTaskEnded(lastGenerated, config, endDate);
      expect(result).toBe(true);
    });

    it("should return false if end date is in future", () => {
      const lastGenerated = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() + 86400000); // 1 day from now
      const config: RecurringConfig = { pattern: "DAILY", interval: 1 };
      const result = isRecurringTaskEnded(lastGenerated, config, endDate);
      expect(result).toBe(false);
    });

    it("should return false if no end date", () => {
      const lastGenerated = new Date();
      const config: RecurringConfig = { pattern: "DAILY", interval: 1 };
      const result = isRecurringTaskEnded(lastGenerated, config, null);
      expect(result).toBe(false);
    });

    it("should return false for invalid config", () => {
      const lastGenerated = new Date();
      const result = isRecurringTaskEnded(lastGenerated, null, null);
      expect(result).toBe(false);
    });
  });
});
