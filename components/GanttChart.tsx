"use client";

import { Task, Project } from "@/lib/types";
import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

interface GanttChartProps {
  project: Project;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

interface GanttTask {
  task: Task;
  startDate: Date | null;
  endDate: Date | null;
  durationDays: number;
  percentComplete: number;
}

export function GanttChart({ project, tasks, onTaskClick }: GanttChartProps) {
  const ganttChartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = async () => {
    if (!ganttChartRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(ganttChartRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];
      link.href = canvas.toDataURL("image/png");
      link.download = `${project.name}-gantt-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export Gantt chart:", error);
      alert("Failed to export Gantt chart. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const ganttData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        items: [],
        minDate: new Date(),
        maxDate: new Date(),
        totalDays: 0,
      };
    }

    // Process tasks to get dates
    const items: GanttTask[] = tasks.map((task) => {
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      // Parse start date - ensure we handle date-only strings correctly
      if (task.startDate) {
        const dateStr = task.startDate.split('T')[0]; // Get just the date part, ignore time
        startDate = new Date(dateStr + 'T00:00:00'); // Add midnight time to avoid timezone issues
      }

      // Parse due date - ensure we handle date-only strings correctly
      if (task.dueDate) {
        const dateStr = task.dueDate.split('T')[0]; // Get just the date part, ignore time
        endDate = new Date(dateStr + 'T23:59:59'); // Add end of day time
      }

      // If we have both dates, calculate duration
      let durationDays = 0;
      if (startDate && endDate) {
        durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // If we only have start date, default end to 7 days later
      if (startDate && !endDate) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        durationDays = 7;
      }

      // If we only have due date, default start to 7 days before
      if (!startDate && endDate) {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        durationDays = 7;
      }

      return {
        task,
        startDate,
        endDate,
        durationDays: Math.max(1, durationDays),
        percentComplete: task.progress || 0,
      };
    });

    // Calculate min and max dates
    const validDates = items
      .filter((item) => item.startDate)
      .map((item) => item.startDate as Date);

    if (validDates.length === 0) {
      const today = new Date();
      return {
        items,
        minDate: today,
        maxDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalDays: 30,
      };
    }

    const minDate = new Date(Math.min(...validDates.map((d) => d.getTime())));
    const maxDate = new Date(
      Math.max(
        ...items
          .filter((item) => item.endDate)
          .map((item) => (item.endDate as Date).getTime())
      )
    );

    // Ensure minDate is before maxDate
    if (minDate >= maxDate) {
      maxDate.setDate(maxDate.getDate() + 30);
    }

    const totalDays = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Sort items by task dependencies and start date
    // Create a map for quick lookup of tasks by ID
    const taskMap = new Map<string, GanttTask>();
    items.forEach((item) => taskMap.set(item.task.id, item));

    // Create a dependency graph to ensure dependent tasks come after their dependencies
    const sorted: GanttTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    // Topological sort with depth-first search to respect dependencies
    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) return; // Cycle detection

      visiting.add(taskId);

      const item = taskMap.get(taskId);
      if (!item) return;

      // Visit dependency first (so it appears before this task)
      if (item.task.dependsOnTaskId) {
        visit(item.task.dependsOnTaskId);
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(item);
    };

    // Sort by start date first, then apply topological sort
    const itemsSortedByDate = [...items].sort((a, b) => {
      if (!a.startDate && !b.startDate) return a.task.title.localeCompare(b.task.title);
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate.getTime() - b.startDate.getTime();
    });

    // Apply topological sort while preserving date order where possible
    const sortedItems: GanttTask[] = [];
    const addedIds = new Set<string>();

    for (const item of itemsSortedByDate) {
      if (!addedIds.has(item.task.id)) {
        // Add all dependencies first
        if (item.task.dependsOnTaskId && !addedIds.has(item.task.dependsOnTaskId)) {
          const depItem = taskMap.get(item.task.dependsOnTaskId);
          if (depItem && !addedIds.has(depItem.task.id)) {
            sortedItems.push(depItem);
            addedIds.add(depItem.task.id);
          }
        }
        sortedItems.push(item);
        addedIds.add(item.task.id);
      }
    }

    return {
      items: sortedItems,
      minDate,
      maxDate,
      totalDays,
    };
  }, [tasks]);

  if (ganttData.items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No tasks with start or due dates to display in Gantt chart</p>
        <p className="text-gray-400 text-sm mt-2">Add start dates or due dates to your tasks to see them on the timeline</p>
      </div>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress === 0) return { backgroundColor: "#d1d5db" }; // gray-300
    if (progress < 33) return { backgroundColor: "#ef4444" }; // red-500
    if (progress < 100) return { backgroundColor: "#eab308" }; // yellow-500
    return { backgroundColor: "#22c55e" }; // green-500
  };

  const calculatePosition = (date: Date | null) => {
    if (!date) return 0;
    const daysDiff = Math.ceil(
      (date.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const percentage = (daysDiff / ganttData.totalDays) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const calculateWidth = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return 0;
    const durationMs = endDate.getTime() - startDate.getTime();
    const totalMs = ganttData.maxDate.getTime() - ganttData.minDate.getTime();
    return (durationMs / totalMs) * 100;
  };

  // Generate month labels for timeline header
  const generateMonthLabels = () => {
    const labels = [];
    const current = new Date(ganttData.minDate);

    while (current <= ganttData.maxDate) {
      const monthName = current.toLocaleString("default", { month: "short" });
      const yearNum = current.getFullYear();
      labels.push(`${monthName} ${yearNum}`);

      current.setMonth(current.getMonth() + 1);
    }

    return [...new Set(labels)]; // Remove duplicates
  };

  const monthLabels = generateMonthLabels();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Project Timeline - {project.name}</h3>
        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium text-sm"
          title="Export Gantt Chart as PNG"
        >
          {isExporting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
              </svg>
              <span>Export as PNG</span>
            </>
          )}
        </button>
      </div>

      <div ref={ganttChartRef} className="inline-block min-w-full bg-white p-4 rounded">
        {/* Timeline Header */}
        <div className="flex mb-4">
          <div className="w-64 flex-shrink-0 pr-4">
            <div className="text-xs font-semibold text-gray-600">Task Name</div>
          </div>
          <div className="flex-1 relative">
            <div className="text-xs font-semibold text-gray-600 mb-2">Timeline</div>
            <div className="flex text-xs text-gray-500 border-l border-gray-300">
              {monthLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="flex-1 px-2 py-1 border-r border-gray-300"
                  style={{ minWidth: `${100 / monthLabels.length}%` }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Bars */}
        {ganttData.items.map((item) => (
          <div
            key={item.task.id}
            className="flex mb-3 cursor-pointer hover:bg-gray-50 rounded transition"
            onClick={() => onTaskClick?.(item.task)}
          >
            {/* Task Name Column */}
            <div className="w-64 flex-shrink-0 pr-4">
              <div className="text-sm font-medium text-gray-900 truncate">
                {item.task.title}
              </div>
              <div className="text-xs text-gray-500">
                {item.percentComplete}% complete
              </div>
            </div>

            {/* Gantt Bar Area */}
            <div className="flex-1 relative h-12 bg-gray-50 rounded border border-gray-200">
              {/* Progress Bar */}
              {item.startDate && (
                <div
                  className="absolute h-full rounded flex items-center justify-center text-white text-xs font-semibold transition-all hover:shadow-md"
                  style={{
                    ...getProgressColor(item.percentComplete),
                    left: `${calculatePosition(item.startDate)}%`,
                    width: `${calculateWidth(item.startDate, item.endDate)}%`,
                    minWidth: "2px",
                  }}
                  title={`${item.task.title}: ${item.percentComplete}% complete`}
                >
                  {calculateWidth(item.startDate, item.endDate) > 8 && (
                    <span>{item.percentComplete}%</span>
                  )}
                </div>
              )}

              {/* Due Date Indicator */}
              {item.startDate && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-600 opacity-50"
                  style={{
                    left: `${calculatePosition(item.endDate)}%`,
                  }}
                  title={`Due: ${item.endDate?.toLocaleDateString()}`}
                />
              )}
            </div>
          </div>
        ))}

        {/* Summary Row */}
        <div className="flex mt-6 pt-4 border-t border-gray-300">
          <div className="w-64 flex-shrink-0 pr-4">
            <div className="text-sm font-semibold text-gray-900">Project Progress</div>
          </div>
          <div className="flex-1">
            <div className="h-8 bg-gray-100 rounded border border-gray-300 overflow-hidden">
              {tasks.length > 0 && (
                <div
                  className="h-full flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{
                    ...getProgressColor(
                      Math.round(
                        tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length
                      )
                    ),
                    width: `${Math.round(
                      tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length
                    )}%`,
                  }}
                >
                  {Math.round(
                    tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length
                  )}
                  %
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">0-32% (Not Started)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">33-66% (In Progress)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">67-100% (Near Complete)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600"></div>
            <span className="text-gray-600">Due Date</span>
          </div>
        </div>
      </div>
    </div>
  );
}
