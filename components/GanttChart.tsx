"use client";

import { Task, Project } from "@/lib/types";
import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface GanttChartProps {
  project: Project;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  userPlan?: "FREE" | "PRO" | "ENTERPRISE";
}

interface GanttTask {
  task: Task;
  startDate: Date | null;
  endDate: Date | null;
  durationDays: number;
  percentComplete: number;
}

export function GanttChart({ project, tasks, onTaskClick, userPlan = "FREE" }: GanttChartProps) {
  const ganttChartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const canExport = userPlan !== "FREE";

  const handleExportPNG = async () => {
    if (!canExport) {
      alert("PDF and PNG exports are only available on PRO and ENTERPRISE plans. Upgrade to unlock this feature.");
      return;
    }

    if (!ganttChartRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(ganttChartRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
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

  const handleExportPDF = async () => {
    if (!canExport) {
      alert("PDF and PNG exports are only available on PRO and ENTERPRISE plans. Upgrade to unlock this feature.");
      return;
    }

    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // PAGE 1: Gantt Chart
      if (ganttChartRef.current) {
        const canvas = await html2canvas(ganttChartRef.current, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
      }

      // PAGE 2: Project Details and Resources
      pdf.addPage();
      let yPosition = 15;

      // Title
      pdf.setFontSize(16);
      pdf.text(`Project Details & Resources`, 15, yPosition);
      yPosition += 8;

      // Project Name
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.text(`Project: ${project.name}`, 15, yPosition);
      yPosition += 6;

      // Export date
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(100);
      const generatedDate = new Date().toLocaleDateString();
      pdf.text(`Generated: ${generatedDate}`, 15, yPosition);
      yPosition += 8;

      // Add horizontal line
      pdf.setDrawColor(200);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;

      pdf.setTextColor(0);

      // Resources Summary Section
      pdf.setFontSize(11);
      pdf.setFont(undefined, "bold");
      pdf.text("Resources & Manpower Summary", 15, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");

      const totalResources = ganttData.items.reduce((sum, item) => sum + (item.task.resourceCount || 0), 0);
      const totalManpower = ganttData.items.reduce((sum, item) => sum + (item.task.manhours || 0), 0);

      pdf.text(`Total Resources Allocated: ${totalResources} people`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Total Manpower (Manhours): ${totalManpower.toLocaleString()} hours`, 15, yPosition);
      yPosition += 8;

      // Task Details with Resources Table
      pdf.setFontSize(11);
      pdf.setFont(undefined, "bold");
      pdf.text("Task Details", 15, yPosition);
      yPosition += 6;

      // Table headers
      const columnWidths = {
        taskName: 40,
        dates: 42,
        progress: 18,
        resources: 18,
        manpower: 22,
        description: pageWidth - 15 - 40 - 42 - 18 - 18 - 22 - 15,
      };

      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.setFillColor(60, 100, 150);
      pdf.rect(15, yPosition - 4, pageWidth - 30, 5, "F");
      pdf.setTextColor(255);
      pdf.text("Task", 16, yPosition);
      pdf.text("Dates", 16 + columnWidths.taskName, yPosition);
      pdf.text("Progress", 16 + columnWidths.taskName + columnWidths.dates, yPosition);
      pdf.text("Resources", 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress, yPosition);
      pdf.text("Manpower", 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress + columnWidths.resources, yPosition);
      pdf.text("Description", 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress + columnWidths.resources + columnWidths.manpower, yPosition);

      yPosition += 5;
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(20, 20, 20);

      // Task rows using ganttData.items (pre-sorted by start date and dependencies)
      ganttData.items.forEach((item, idx) => {
        const task = item.task;
        const startDate = item.startDate ? item.startDate.toLocaleDateString() : "N/A";
        const dueDate = item.endDate ? item.endDate.toLocaleDateString() : "N/A";
        const dateRange = `${startDate} - ${dueDate}`;
        const progress = `${task.progress || 0}%`;
        const description = task.description || "";
        const resources = `${task.resourceCount || 0}`;
        const manpower = `${task.manhours || 0}`;

        const taskNameSplit = pdf.splitTextToSize(task.title, columnWidths.taskName - 2);
        const descriptionSplit = pdf.splitTextToSize(description, columnWidths.description - 2);

        // Calculate proper row height with adequate spacing for multi-line content
        const lineHeight = 4.5; // Increased from 3 to 4.5mm for better readability
        const maxLines = Math.max(taskNameSplit.length, descriptionSplit.length, 1);
        const rowHeight = maxLines * lineHeight + 2; // Add 2mm padding

        // Check if we need a new page
        if (yPosition + rowHeight > pageHeight - 10) {
          pdf.addPage();
          yPosition = 15;

          // Redraw table headers on new page
          pdf.setFontSize(9);
          pdf.setFont(undefined, "bold");
          pdf.setFillColor(60, 100, 150);
          pdf.rect(15, yPosition - 4, pageWidth - 30, 5, "F");
          pdf.setTextColor(255);
          pdf.text("Task", 16, yPosition);
          pdf.text("Dates", 16 + columnWidths.taskName, yPosition);
          pdf.text("Progress", 16 + columnWidths.taskName + columnWidths.dates, yPosition);
          pdf.text("Resources", 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress, yPosition);
          pdf.text("Manpower", 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress + columnWidths.resources, yPosition);
          pdf.text("Description", 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress + columnWidths.resources + columnWidths.manpower, yPosition);
          yPosition += 5;
          pdf.setFont(undefined, "normal");
          pdf.setTextColor(20, 20, 20);
        }

        // Draw row background
        pdf.setFillColor(idx % 2 === 0 ? 240 : 255);
        pdf.rect(15, yPosition - 3, pageWidth - 30, rowHeight, "F");

        // Starting Y position for this row's content
        let contentY = yPosition;

        // Task name - render each line separately
        taskNameSplit.forEach((line: string, lineIdx: number) => {
          pdf.text(line, 16, contentY + (lineIdx * lineHeight));
        });

        // Dates - centered vertically in the row
        pdf.text(dateRange, 16 + columnWidths.taskName, contentY);

        // Progress - centered vertically in the row
        pdf.text(progress, 16 + columnWidths.taskName + columnWidths.dates, contentY);

        // Resources - centered vertically in the row
        pdf.text(resources, 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress, contentY);

        // Manpower - centered vertically in the row
        pdf.text(manpower, 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress + columnWidths.resources, contentY);

        // Description - render each line separately to prevent cutoff
        const descriptionX = 16 + columnWidths.taskName + columnWidths.dates + columnWidths.progress + columnWidths.resources + columnWidths.manpower;
        descriptionSplit.forEach((line: string, lineIdx: number) => {
          pdf.text(line, descriptionX, contentY + (lineIdx * lineHeight));
        });

        yPosition += rowHeight + 2;
      });

      // Save PDF
      const timestamp = new Date().toISOString().split("T")[0];
      pdf.save(`${project.name}-gantt-${timestamp}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
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

      // Parse start date - use local timezone to avoid date shifts
      if (task.startDate) {
        const dateStr = task.startDate.split('T')[0]; // Get just the date part (YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-').map(Number);
        startDate = new Date(year, month - 1, day); // month is 0-indexed in JS
      }

      // Parse due date - use local timezone to avoid date shifts
      if (task.dueDate) {
        const dateStr = task.dueDate.split('T')[0]; // Get just the date part (YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-').map(Number);
        endDate = new Date(year, month - 1, day, 23, 59, 59); // End of day
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

    // Calculate position based on months from start (same logic as mobile app)
    const startYear = ganttData.minDate.getFullYear();
    const startMonth = ganttData.minDate.getMonth();
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();

    const monthsDiff = (dateYear - startYear) * 12 + (dateMonth - startMonth);

    // Add fractional position within the month
    const daysInMonth = new Date(dateYear, dateMonth + 1, 0).getDate();
    const dayOfMonth = date.getDate();
    const fractionOfMonth = (dayOfMonth - 1) / daysInMonth;

    // Calculate total months in the gantt timeline
    const endYear = ganttData.maxDate.getFullYear();
    const endMonth = ganttData.maxDate.getMonth();
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    // Return as percentage of total timeline
    return ((monthsDiff + fractionOfMonth) / totalMonths) * 100;
  };

  const calculateWidth = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return 0;

    const startPos = calculatePosition(startDate);
    const endPos = calculatePosition(endDate);

    return Math.max(endPos - startPos, 0.5); // Minimum 0.5% width
  };

  // Generate month labels for timeline header (equal width like mobile app)
  const generateMonthLabels = () => {
    const labels = [];
    const current = new Date(ganttData.minDate.getFullYear(), ganttData.minDate.getMonth(), 1);
    const endDate = new Date(ganttData.maxDate.getFullYear(), ganttData.maxDate.getMonth(), 1);

    while (current <= endDate) {
      const monthName = current.toLocaleString("default", { month: "short" });
      const yearNum = current.getFullYear();
      labels.push(`${monthName} ${yearNum}`);
      current.setMonth(current.getMonth() + 1);
    }

    return labels;
  };

  const monthLabels = generateMonthLabels();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Project Timeline - {project.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExportPNG}
            disabled={isExporting || !canExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
              canExport
                ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                : "bg-gray-200 text-gray-600 cursor-not-allowed"
            }`}
            title={canExport ? "Export Gantt Chart as PNG" : "Available on PRO and ENTERPRISE plans"}
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
                {!canExport && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
                </svg>
                <span>PNG</span>
              </>
            )}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || !canExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
              canExport
                ? "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                : "bg-gray-200 text-gray-600 cursor-not-allowed"
            }`}
            title={canExport ? "Export as PDF with task descriptions" : "Available on PRO and ENTERPRISE plans"}
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
                {!canExport && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                )}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.5 13.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  <path fillRule="evenodd" d="M3 4a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm11 0H5v12h10V4z" />
                </svg>
                <span>PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={ganttChartRef} className="inline-block min-w-full bg-white p-4 rounded">
        {/* Timeline Header */}
        <div className="flex mb-4">
          <div className="w-80 flex-shrink-0 pr-4">
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
            className="flex mb-3 cursor-pointer hover:bg-gray-50 rounded transition items-start"
            onClick={() => onTaskClick?.(item.task)}
          >
            {/* Task Name Column */}
            <div className="w-80 flex-shrink-0 pr-4 pt-2">
              <div className="text-sm font-medium text-gray-900 break-words leading-tight">
                {item.task.title}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex gap-4">
                <span>{item.percentComplete}% complete</span>
                <span className="text-blue-600">👥 {item.task.resourceCount || 0}</span>
                <span className="text-purple-600">⏱️ {item.task.manhours || 0}hrs</span>
              </div>
            </div>

            {/* Gantt Bar Area */}
            <div className="flex-1 relative h-14 bg-gray-50 rounded border border-gray-200">
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

        {/* Resources & Manpower Summary */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <h4 className="text-md font-semibold text-gray-900 mb-4">📊 Resources & Manpower Summary</h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Total Resources Allocated</p>
              <p className="text-2xl font-bold text-blue-600">
                {ganttData.items.reduce((sum, item) => sum + (item.task.resourceCount || 0), 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">people</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Total Manpower (Manhours)</p>
              <p className="text-2xl font-bold text-purple-600">
                {ganttData.items.reduce((sum, item) => sum + (item.task.manhours || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
