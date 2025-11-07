"use client";

import { useState } from "react";
import { Calendar, TrendingUp, CheckCircle } from "lucide-react";

interface GanttTask {
  id: string;
  title: string;
  project: string;
  startDate: number; // percentage from left
  duration: number; // percentage width
  progress: number; // 0-100
  status: "completed" | "in-progress" | "pending";
}

export function HeroGanttChartPreview() {
  const [tasks] = useState<GanttTask[]>([
    {
      id: "1",
      title: "Project Kickoff & Planning",
      project: "Website Redesign",
      startDate: 0,
      duration: 15,
      progress: 100,
      status: "completed",
    },
    {
      id: "2",
      title: "Design Phase",
      project: "Website Redesign",
      startDate: 12,
      duration: 25,
      progress: 100,
      status: "completed",
    },
    {
      id: "3",
      title: "Frontend Development",
      project: "Website Redesign",
      startDate: 35,
      duration: 35,
      progress: 65,
      status: "in-progress",
    },
    {
      id: "4",
      title: "Backend Integration",
      project: "Website Redesign",
      startDate: 60,
      duration: 25,
      progress: 0,
      status: "pending",
    },
    {
      id: "5",
      title: "Requirements Analysis",
      project: "Mobile App",
      startDate: 0,
      duration: 12,
      progress: 100,
      status: "completed",
    },
    {
      id: "6",
      title: "Wireframes & Mockups",
      project: "Mobile App",
      startDate: 10,
      duration: 20,
      progress: 85,
      status: "in-progress",
    },
    {
      id: "7",
      title: "Development Sprint 1",
      project: "Mobile App",
      startDate: 28,
      duration: 30,
      progress: 40,
      status: "in-progress",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "pending":
        return "bg-gray-300";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 md:px-8 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Gantt Chart & Timeline
          </h3>
          <p className="text-teal-100 text-sm">Visualize project progress at a glance</p>
        </div>
        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
          <p className="text-white text-xs font-semibold">PRO FEATURE</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-700">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-gray-700">Pending</span>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="space-y-6">
          {/* Project 1 */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Website Redesign
            </h4>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.project === "Website Redesign")
                .map((task) => (
                  <div key={task.id} className="flex gap-3">
                    {/* Task Label */}
                    <div className="w-40 flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.progress}% {getStatusLabel(task.status)}
                      </p>
                    </div>

                    {/* Gantt Bar */}
                    <div className="flex-1 h-10 bg-gray-100 rounded-lg relative border border-gray-200">
                      {/* Bar */}
                      <div
                        className={`h-full rounded-lg transition-all ${getStatusColor(
                          task.status
                        )}`}
                        style={{
                          marginLeft: `${task.startDate}%`,
                          width: `${task.duration}%`,
                          opacity: task.progress / 100 + 0.3,
                        }}
                      >
                        {/* Progress overlay */}
                        {task.status !== "completed" && (
                          <div
                            className="h-full bg-white opacity-30"
                            style={{ width: `${100 - task.progress}%` }}
                          ></div>
                        )}
                      </div>
                      {task.status === "completed" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Project 2 */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Mobile App
            </h4>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.project === "Mobile App")
                .map((task) => (
                  <div key={task.id} className="flex gap-3">
                    {/* Task Label */}
                    <div className="w-40 flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.progress}% {getStatusLabel(task.status)}
                      </p>
                    </div>

                    {/* Gantt Bar */}
                    <div className="flex-1 h-10 bg-gray-100 rounded-lg relative border border-gray-200">
                      {/* Bar */}
                      <div
                        className={`h-full rounded-lg transition-all ${getStatusColor(
                          task.status
                        )}`}
                        style={{
                          marginLeft: `${task.startDate}%`,
                          width: `${task.duration}%`,
                          opacity: task.progress / 100 + 0.3,
                        }}
                      >
                        {/* Progress overlay */}
                        {task.status !== "completed" && (
                          <div
                            className="h-full bg-white opacity-30"
                            style={{ width: `${100 - task.progress}%` }}
                          ></div>
                        )}
                      </div>
                      {task.status === "completed" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Time axis indicator */}
        <div className="mt-6 flex justify-between text-xs text-gray-500 px-43 ml-40">
          <span>Week 1</span>
          <span>Week 3</span>
          <span>Week 5</span>
          <span>Week 7</span>
        </div>

        {/* Benefits */}
        <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-sm text-teal-900">
            <strong>✨ Benefits:</strong> Visualize project timelines, track dependencies, monitor progress across multiple projects, and identify bottlenecks at a glance.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 md:px-8 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
        <p className="text-gray-600">Available in Pro and Enterprise plans</p>
        <span className="text-teal-600 font-medium">Learn more →</span>
      </div>
    </div>
  );
}
