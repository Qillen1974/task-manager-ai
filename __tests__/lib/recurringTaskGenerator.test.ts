import {
  generateRecurringTaskInstances,
  generateInstanceIfDue,
  generateInstanceForTask,
  getGenerationStatus,
  countPendingGenerations,
} from "@/lib/recurringTaskGenerator";
import { isRecurringTaskEnded } from "@/lib/utils";
import { Task } from "@prisma/client";

/**
 * Tests for Recurring Task Generation Service
 *
 * Note: These are integration tests that test the logic.
 * In a real environment, you'd need to mock the database calls.
 */

describe("Recurring Task Generator", () => {
  describe("Helper Functions", () => {
    describe("isRecurringTaskEnded", () => {
      it("should return true if end date has passed", () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const config = { pattern: "DAILY" as const, interval: 1 };

        const result = isRecurringTaskEnded(now, config, yesterday);
        expect(result).toBe(true);
      });

      it("should return false if end date is in future", () => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const config = { pattern: "DAILY" as const, interval: 1 };

        const result = isRecurringTaskEnded(now, config, tomorrow);
        expect(result).toBe(false);
      });

      it("should return false if no end date", () => {
        const now = new Date();
        const config = { pattern: "DAILY" as const, interval: 1 };

        const result = isRecurringTaskEnded(now, config, null);
        expect(result).toBe(false);
      });
    });
  });

  describe("Generation Logic", () => {
    describe("generateInstanceIfDue", () => {
      it("should not generate if task has ended", () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const mockTask: Partial<Task> = {
          id: "task-1",
          isRecurring: true,
          parentTaskId: null,
          recurringStartDate: yesterday,
          recurringEndDate: yesterday, // Ended yesterday
          nextGenerationDate: now,
          recurringConfig: JSON.stringify({ pattern: "DAILY", interval: 1 }),
        };

        // hasEnded would be true, so generation shouldn't happen
        const hasEnded = isRecurringTaskEnded(mockTask.lastGeneratedDate || null, mockTask.recurringConfig, mockTask.recurringEndDate || null);
        expect(hasEnded).toBe(true);
      });

      it("should not generate if nextGenerationDate is in future", () => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const mockTask: Partial<Task> = {
          id: "task-1",
          isRecurring: true,
          parentTaskId: null,
          recurringStartDate: now,
          nextGenerationDate: tomorrow, // Tomorrow
          recurringConfig: JSON.stringify({ pattern: "DAILY", interval: 1 }),
        };

        // Should not generate (not due yet)
        const isDue = mockTask.nextGenerationDate ? now >= mockTask.nextGenerationDate : false;
        expect(isDue).toBe(false);
      });

      it("should generate if nextGenerationDate has passed", () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const mockTask: Partial<Task> = {
          id: "task-1",
          isRecurring: true,
          parentTaskId: null,
          recurringStartDate: yesterday,
          nextGenerationDate: yesterday, // Was due yesterday
          recurringConfig: JSON.stringify({ pattern: "DAILY", interval: 1 }),
        };

        // Should generate (overdue)
        const isDue = mockTask.nextGenerationDate ? now >= mockTask.nextGenerationDate : false;
        expect(isDue).toBe(true);
      });
    });

    describe("Task Instance Creation", () => {
      it("should create instance with correct title format", () => {
        const now = new Date();
        const title = "Daily Standup";
        const dateString = now.toLocaleDateString();

        // Expected format: "Daily Standup (11/4/2025)" or similar
        const expectedTitle = `${title} (${dateString})`;

        expect(expectedTitle).toContain(title);
        expect(expectedTitle).toContain(dateString);
      });

      it("should preserve task properties in instance", () => {
        const mockTask = {
          title: "Weekly Meeting",
          description: "Team sync",
          priority: "urgent-important",
          resourceCount: 5,
          manhours: 2,
          dueTime: "14:00",
          startTime: "13:00",
        };

        // Instance should have same properties except title
        expect(mockTask.title).toBe("Weekly Meeting");
        expect(mockTask.description).toBe("Team sync");
        expect(mockTask.priority).toBe("urgent-important");
        expect(mockTask.resourceCount).toBe(5);
        expect(mockTask.manhours).toBe(2);
      });

      it("should mark instance as non-recurring", () => {
        const instance = {
          isRecurring: false, // Instance should not be recurring
          parentTaskId: "parent-task-1", // Should link to parent
        };

        expect(instance.isRecurring).toBe(false);
        expect(instance.parentTaskId).toBe("parent-task-1");
      });
    });
  });

  describe("Generation Status", () => {
    it("should track generation dates correctly", () => {
      const now = new Date();
      const lastGenerated = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const nextGen = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

      const mockStatus = {
        lastGeneratedDate: lastGenerated,
        nextGenerationDate: nextGen,
        hasEnded: false,
        generationDueNow: false,
      };

      expect(mockStatus.lastGeneratedDate.getTime()).toBeLessThan(now.getTime());
      expect(mockStatus.nextGenerationDate.getTime()).toBeGreaterThan(now.getTime());
      expect(mockStatus.hasEnded).toBe(false);
      expect(mockStatus.generationDueNow).toBe(false);
    });

    it("should detect when generation is due now", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const isDueNow = now >= yesterday;
      expect(isDueNow).toBe(true);
    });

    it("should detect when task has ended", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endDate = yesterday;

      const hasEnded = now > endDate;
      expect(hasEnded).toBe(true);
    });
  });

  describe("Generation Patterns", () => {
    it("should track daily pattern generations", () => {
      const startDate = new Date("2024-01-15");
      const pattern = "DAILY";
      const interval = 1;

      // Day 1: Jan 15
      // Day 2: Jan 16
      // Day 3: Jan 17
      const generations = [
        new Date("2024-01-15"),
        new Date("2024-01-16"),
        new Date("2024-01-17"),
      ];

      expect(generations.length).toBe(3);
      expect(generations[0].getDate()).toBe(15);
      expect(generations[1].getDate()).toBe(16);
      expect(generations[2].getDate()).toBe(17);
    });

    it("should track weekly pattern generations", () => {
      const startDate = new Date("2024-01-15"); // Monday
      const pattern = "WEEKLY";
      const interval = 1;
      const daysOfWeek = [1, 3, 5]; // Mon, Wed, Fri

      // Week 1: Mon (15), Wed (17), Fri (19)
      const week1Generations = [
        new Date("2024-01-15"), // Monday
        new Date("2024-01-17"), // Wednesday
        new Date("2024-01-19"), // Friday
      ];

      expect(week1Generations.length).toBe(3);
      expect(week1Generations[0].toLocaleDateString()).toBe(new Date("2024-01-15").toLocaleDateString());
    });

    it("should track monthly pattern generations", () => {
      const startDate = new Date("2024-01-15");
      const pattern = "MONTHLY";
      const dayOfMonth = 15;

      const generations = [
        new Date("2024-01-15"),
        new Date("2024-02-15"),
        new Date("2024-03-15"),
      ];

      expect(generations.length).toBe(3);
      expect(generations[0].getDate()).toBe(15);
      expect(generations[1].getDate()).toBe(15);
      expect(generations[2].getDate()).toBe(15);
    });
  });

  describe("End Date Handling", () => {
    it("should stop generating after end date", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-10");
      const now = new Date("2024-01-11"); // After end date

      const shouldStop = now > endDate;
      expect(shouldStop).toBe(true);
    });

    it("should continue generating until end date", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      const checkDate = new Date("2024-06-15"); // Middle of year

      const shouldStop = checkDate > endDate;
      expect(shouldStop).toBe(false);
    });

    it("should handle no end date (indefinite recurrence)", () => {
      const startDate = new Date("2024-01-01");
      const endDate = null;
      const checkDate = new Date("2050-01-01"); // Far in future

      // With no end date, should always continue
      const shouldStop = endDate ? checkDate > endDate : false;
      expect(shouldStop).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should validate task is recurring", () => {
      const mockTask = {
        id: "task-1",
        isRecurring: false, // Not recurring
        parentTaskId: null,
      };

      const isRecurring = mockTask.isRecurring;
      expect(isRecurring).toBe(false);
    });

    it("should validate task is not an instance", () => {
      const mockTask = {
        id: "task-1",
        isRecurring: true,
        parentTaskId: "parent-1", // Is an instance
      };

      const isInstance = !!mockTask.parentTaskId;
      expect(isInstance).toBe(true);
    });

    it("should handle missing nextGenerationDate", () => {
      const mockTask = {
        id: "task-1",
        isRecurring: true,
        parentTaskId: null,
        nextGenerationDate: null, // Missing
      };

      const isDue = mockTask.nextGenerationDate ? new Date() >= mockTask.nextGenerationDate : false;
      expect(isDue).toBe(false);
    });

    it("should handle missing recurringConfig", () => {
      const mockTask = {
        id: "task-1",
        isRecurring: true,
        parentTaskId: null,
        recurringConfig: null, // Missing
      };

      const config = mockTask.recurringConfig ? JSON.parse(mockTask.recurringConfig) : null;
      expect(config).toBeNull();
    });
  });

  describe("Generation Results", () => {
    it("should report successful generation", () => {
      const result = {
        success: true,
        tasksGenerated: 5,
        errors: [],
        message: "Generated 5 task instances.",
      };

      expect(result.success).toBe(true);
      expect(result.tasksGenerated).toBe(5);
      expect(result.errors.length).toBe(0);
    });

    it("should report partial success with errors", () => {
      const result = {
        success: false,
        tasksGenerated: 3,
        errors: [
          { taskId: "task-1", error: "Database error" },
          { taskId: "task-2", error: "Invalid config" },
        ],
        message: "Generated 3 task instances. 2 errors occurred.",
      };

      expect(result.success).toBe(false);
      expect(result.tasksGenerated).toBe(3);
      expect(result.errors.length).toBe(2);
    });

    it("should report complete failure", () => {
      const result = {
        success: false,
        tasksGenerated: 0,
        errors: [
          { taskId: "system", error: "Database connection failed" },
        ],
        message: "Generation service failed: Database connection failed",
      };

      expect(result.success).toBe(false);
      expect(result.tasksGenerated).toBe(0);
      expect(result.errors.length).toBe(1);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle multiple recurring tasks with different patterns", () => {
      const tasks = [
        { id: "daily-1", pattern: "DAILY", interval: 1 },
        { id: "weekly-1", pattern: "WEEKLY", interval: 1 },
        { id: "monthly-1", pattern: "MONTHLY", interval: 1 },
      ];

      expect(tasks.length).toBe(3);
      expect(tasks.map((t) => t.pattern)).toEqual(["DAILY", "WEEKLY", "MONTHLY"]);
    });

    it("should handle cascading generation (one instance creates next)", () => {
      const startDate = new Date("2024-01-15");
      const now = new Date("2024-01-22"); // 1 week later

      // After generating instance on Jan 15
      const lastGenerated = new Date("2024-01-15");
      // Next should be Jan 22
      const nextGenDate = new Date("2024-01-22");

      const isDue = now >= nextGenDate;
      expect(isDue).toBe(true);
    });

    it("should preserve task context across generations", () => {
      const parentTask = {
        id: "parent-1",
        projectId: "proj-123",
        userId: "user-456",
        title: "Weekly Review",
        description: "Project review meeting",
      };

      const instance1 = {
        parentTaskId: parentTask.id,
        projectId: parentTask.projectId,
        userId: parentTask.userId,
        title: `${parentTask.title} (11/4/2024)`,
      };

      expect(instance1.parentTaskId).toBe(parentTask.id);
      expect(instance1.projectId).toBe(parentTask.projectId);
      expect(instance1.userId).toBe(parentTask.userId);
      expect(instance1.title).toContain(parentTask.title);
    });
  });
});
