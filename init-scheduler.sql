-- Initialize SchedulerState table if it doesn't exist
INSERT INTO "SchedulerState" (id, "lastRunDate", "isRunning", "updatedAt")
VALUES (
  'recurring-task-scheduler',
  NOW(),
  false,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the record was created
SELECT id, "lastRunDate", "isRunning" FROM "SchedulerState" WHERE id = 'recurring-task-scheduler';
