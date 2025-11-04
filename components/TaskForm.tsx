"use client";

import { useState } from "react";
import { Task, Project, Priority, RecurringPattern, RecurringConfig } from "@/lib/types";
import { generateId, getPriorityLabel, formatRecurringDescription } from "@/lib/utils";
import { ProgressSlider } from "./ProgressSlider";

interface TaskFormProps {
  projects: Project[];
  tasks?: Task[]; // All tasks for dependency selection
  onTaskAdd?: (task: Task) => void;
  onClose: () => void;
  editingTask?: Task;
  onTaskUpdate?: (task: Task) => void;
  defaultProjectId?: string;
  onSubmit?: (task: Task) => void | Promise<void>;
  activeProjectId?: string;
  childProjects?: Project[];
  allProjects?: Project[]; // Flattened list of all projects including nested ones
  canCreateRecurringTasks?: boolean; // Whether user can create recurring tasks
}

export function TaskForm({
  projects,
  tasks = [],
  onTaskAdd,
  onClose,
  editingTask,
  onTaskUpdate,
  defaultProjectId,
  onSubmit,
  activeProjectId,
  childProjects = [],
  allProjects = [],
  canCreateRecurringTasks = false
}: TaskFormProps) {
  const [title, setTitle] = useState(editingTask?.title || "");
  const [description, setDescription] = useState(editingTask?.description || "");
  const [projectId, setProjectId] = useState(editingTask?.projectId || defaultProjectId || projects[0]?.id || "");
  const [priority, setPriority] = useState<Priority>(editingTask?.priority || "");
  const [startDate, setStartDate] = useState(
    editingTask?.startDate ? (editingTask.startDate.includes('T') ? editingTask.startDate.split('T')[0] : editingTask.startDate) : ""
  );
  const [startTime, setStartTime] = useState(editingTask?.startTime || "");
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ? editingTask.dueDate.split('T')[0] : "");
  const [dueTime, setDueTime] = useState(editingTask?.dueTime || "");
  const [progress, setProgress] = useState(editingTask?.progress || 0);
  const [resourceCount, setResourceCount] = useState<number | undefined>(editingTask?.resourceCount || undefined);
  const [manhours, setManhours] = useState<number | undefined>(editingTask?.manhours || undefined);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string | undefined>(editingTask?.dependsOnTaskId || undefined);

  // Recurring task fields - Initialize from editingTask recurringConfig if available
  const [isRecurring, setIsRecurring] = useState(editingTask?.isRecurring || false);

  // Parse recurringConfig from editingTask if available
  const parsedRecurringConfig = editingTask?.recurringConfig
    ? (() => {
        try {
          return JSON.parse(editingTask.recurringConfig);
        } catch {
          return null;
        }
      })()
    : null;

  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>(
    (parsedRecurringConfig?.pattern as RecurringPattern) ||
    (editingTask?.recurringPattern as RecurringPattern) ||
    "DAILY"
  );
  const [recurringInterval, setRecurringInterval] = useState<number>(
    parsedRecurringConfig?.interval || 1
  );
  const [recurringDaysOfWeek, setRecurringDaysOfWeek] = useState<number[]>(
    parsedRecurringConfig?.daysOfWeek || []
  );
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number>(
    parsedRecurringConfig?.dayOfMonth || 1
  );
  const [recurringStartDate, setRecurringStartDate] = useState(
    editingTask?.recurringStartDate
      ? (editingTask.recurringStartDate.includes('T')
          ? editingTask.recurringStartDate.split('T')[0]
          : editingTask.recurringStartDate)
      : startDate
  );
  const [recurringEndDate, setRecurringEndDate] = useState(
    editingTask?.recurringEndDate
      ? (editingTask.recurringEndDate.includes('T')
          ? editingTask.recurringEndDate.split('T')[0]
          : editingTask.recurringEndDate)
      : ""
  );
  const [showRecurringEndDate, setShowRecurringEndDate] = useState(
    !!editingTask?.recurringEndDate
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const priorities: Priority[] = [
    "urgent-important",
    "not-urgent-important",
    "urgent-not-important",
    "not-urgent-not-important",
  ];

  // Filter projects to show only active project and its subprojects
  // If activeProjectId is set, find it in allProjects and show with its children
  const availableProjects = activeProjectId
    ? [
        allProjects.find(p => p.id === activeProjectId),
        ...childProjects
      ].filter(Boolean) as Project[]
    : allProjects.length > 0 ? allProjects : projects;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!projectId) {
      newErrors.projectId = "Project is required";
    }

    if (dueDate && !isValidDate(dueDate)) {
      newErrors.dueDate = "Invalid date format";
    }

    if (dueDate && dueTime && !isValidTime(dueTime)) {
      newErrors.dueTime = "Invalid time format";
    }

    // Validate that due date is not before start date
    if (startDate && dueDate) {
      const start = new Date(startDate + (startTime ? `T${startTime}` : 'T00:00'));
      const due = new Date(dueDate + (dueTime ? `T${dueTime}` : 'T23:59'));

      if (due < start) {
        newErrors.dueDate = "Due date cannot be earlier than start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const isValidTime = (timeString: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Build recurring config if this is a recurring task
    let recurringConfig: RecurringConfig | null = null;
    if (isRecurring && canCreateRecurringTasks) {
      recurringConfig = {
        pattern: recurringPattern,
        interval: recurringInterval,
        daysOfWeek: recurringPattern === "WEEKLY" ? recurringDaysOfWeek : undefined,
        dayOfMonth: recurringPattern === "MONTHLY" ? recurringDayOfMonth : undefined,
      };
    }

    const task: Task = {
      id: editingTask?.id || generateId(),
      title,
      description,
      projectId,
      priority,
      startDate: startDate || undefined,
      startTime: startTime || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      completed: editingTask?.completed || false,
      progress: progress,
      resourceCount: resourceCount,
      manhours: manhours,
      dependsOnTaskId: dependsOnTaskId || undefined,
      // Recurring task fields
      isRecurring: isRecurring && canCreateRecurringTasks,
      recurringPattern: isRecurring && canCreateRecurringTasks ? recurringPattern : undefined,
      recurringConfig: recurringConfig ? JSON.stringify(recurringConfig) : undefined,
      recurringStartDate: isRecurring && canCreateRecurringTasks && recurringStartDate ? recurringStartDate : undefined,
      recurringEndDate: isRecurring && canCreateRecurringTasks && recurringEndDate ? recurringEndDate : undefined,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use onSubmit if provided (new way), otherwise use the old callbacks
    if (onSubmit) {
      await onSubmit(task);
    } else if (editingTask && onTaskUpdate) {
      onTaskUpdate(task);
    } else if (onTaskAdd) {
      onTaskAdd(task);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{editingTask ? "Edit Task" : "Add New Task"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">
                {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} found:
              </p>
              <ul className="text-red-600 text-sm mt-2 list-disc list-inside">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Project */}
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.projectId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a project</option>
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="text-red-500 text-sm mt-1">{errors.projectId}</p>}
          </div>

          {/* Priority/Quadrant */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Eisenhower Quadrant (Optional)
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">No Quadrant - Task will not appear in Eisenhower Matrix</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {getPriorityLabel(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Due Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.dueDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>}
            </div>

            <div>
              <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 mb-1">
                Due Time
              </label>
              <input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.dueTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.dueTime && <p className="text-red-500 text-sm mt-1">{errors.dueTime}</p>}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
              Progress Completion
            </label>
            <ProgressSlider
              value={progress}
              onChange={setProgress}
              showLabel={true}
              size="medium"
            />
          </div>

          {/* Task Dependencies */}
          <div>
            <label htmlFor="dependsOnTaskId" className="block text-sm font-medium text-gray-700 mb-1">
              Depends On Task (Optional)
            </label>
            <select
              id="dependsOnTaskId"
              value={dependsOnTaskId || ""}
              onChange={(e) => setDependsOnTaskId(e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">No dependency - This task can be started immediately</option>
              {tasks
                .filter((task) => {
                  // Only show tasks from the same project
                  if (task.projectId !== projectId) return false;
                  // Don't show the current task being edited
                  if (editingTask && task.id === editingTask.id) return false;
                  // Don't show completed tasks (optional - you can remove this line if you want to allow dependencies on completed tasks)
                  if (task.completed) return false;
                  return true;
                })
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
            </select>
            {projectId && tasks.filter((t) => t.projectId === projectId && !t.completed && (!editingTask || t.id !== editingTask.id)).length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No other tasks in this project yet. Create more tasks to set dependencies.
              </p>
            )}
          </div>

          {/* Resource Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="resourceCount" className="block text-sm font-medium text-gray-700 mb-1">
                Resource Count (Optional)
              </label>
              <input
                id="resourceCount"
                type="number"
                min="0"
                value={resourceCount || ""}
                onChange={(e) => setResourceCount(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Number of people assigned"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="manhours" className="block text-sm font-medium text-gray-700 mb-1">
                Manhours (Optional)
              </label>
              <input
                id="manhours"
                type="number"
                min="0"
                step="0.5"
                value={manhours || ""}
                onChange={(e) => setManhours(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Total manhours allocated"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Recurring Task Section */}
          {canCreateRecurringTasks && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  Make this a recurring task
                </label>
              </div>

              {isRecurring && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  {/* Recurrence Pattern */}
                  <div>
                    <label htmlFor="recurringPattern" className="block text-sm font-medium text-gray-700 mb-1">
                      Recurrence Pattern
                    </label>
                    <select
                      id="recurringPattern"
                      value={recurringPattern}
                      onChange={(e) => setRecurringPattern(e.target.value as RecurringPattern)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>

                  {/* Interval */}
                  <div>
                    <label htmlFor="recurringInterval" className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat Every
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="recurringInterval"
                        type="number"
                        min="1"
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                      <span className="text-sm text-gray-600">{recurringPattern.toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Weekly Days Selection */}
                  {recurringPattern === "WEEKLY" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days of Week
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (recurringDaysOfWeek.includes(index)) {
                                setRecurringDaysOfWeek(recurringDaysOfWeek.filter(d => d !== index));
                              } else {
                                setRecurringDaysOfWeek([...recurringDaysOfWeek, index].sort());
                              }
                            }}
                            className={`py-2 px-1 text-xs font-medium rounded ${
                              recurringDaysOfWeek.includes(index)
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Day Selection */}
                  {recurringPattern === "MONTHLY" && (
                    <div>
                      <label htmlFor="recurringDayOfMonth" className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Month
                      </label>
                      <input
                        id="recurringDayOfMonth"
                        type="number"
                        min="1"
                        max="31"
                        value={recurringDayOfMonth}
                        onChange={(e) => setRecurringDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  )}

                  {/* Start Date */}
                  <div>
                    <label htmlFor="recurringStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      id="recurringStartDate"
                      type="date"
                      value={recurringStartDate}
                      onChange={(e) => setRecurringStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* End Date Toggle and Input */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="showRecurringEndDate"
                        type="checkbox"
                        checked={showRecurringEndDate}
                        onChange={(e) => setShowRecurringEndDate(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="showRecurringEndDate" className="text-sm font-medium text-gray-700">
                        Set an end date (optional)
                      </label>
                    </div>
                    {showRecurringEndDate && (
                      <input
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    )}
                  </div>

                  {/* Preview */}
                  {recurringPattern && recurringInterval > 0 && (
                    <div className="bg-white p-3 rounded border border-blue-100 text-sm text-gray-700">
                      <p className="font-medium mb-1">Preview:</p>
                      <p>{formatRecurringDescription(recurringPattern, {
                        pattern: recurringPattern,
                        interval: recurringInterval,
                        daysOfWeek: recurringPattern === "WEEKLY" ? recurringDaysOfWeek : undefined,
                        dayOfMonth: recurringPattern === "MONTHLY" ? recurringDayOfMonth : undefined,
                      })}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {editingTask ? "Update Task" : "Add Task"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
