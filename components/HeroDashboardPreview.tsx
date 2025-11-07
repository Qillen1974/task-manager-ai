"use client";

import { useState } from "react";
import { CheckCircle2, Zap, AlertCircle, Calendar, Trash2 } from "lucide-react";

interface DemoTask {
  id: string;
  title: string;
  projectName: string;
  projectColor: string;
  completed: boolean;
}

interface QuadrantConfig {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  tasks: DemoTask[];
}

export function HeroDashboardPreview() {
  const [quadrants, setQuadrants] = useState<QuadrantConfig[]>([
    {
      id: "urgent-important",
      title: "Quadrant I",
      subtitle: "Urgent & Important",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      tasks: [
        {
          id: "1",
          title: "Fix critical bug",
          projectName: "Website",
          projectColor: "bg-blue-100",
          completed: false,
        },
        {
          id: "2",
          title: "Client deadline today",
          projectName: "Project A",
          projectColor: "bg-purple-100",
          completed: false,
        },
      ],
    },
    {
      id: "not-urgent-important",
      title: "Quadrant II",
      subtitle: "Not Urgent & Important",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      tasks: [
        {
          id: "3",
          title: "Plan Q4 strategy",
          projectName: "Planning",
          projectColor: "bg-green-100",
          completed: false,
        },
        {
          id: "4",
          title: "Team development",
          projectName: "HR",
          projectColor: "bg-orange-100",
          completed: false,
        },
      ],
    },
    {
      id: "urgent-not-important",
      title: "Quadrant III",
      subtitle: "Urgent & Not Important",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
      tasks: [
        {
          id: "5",
          title: "Respond to email",
          projectName: "Communication",
          projectColor: "bg-red-100",
          completed: false,
        },
        {
          id: "6",
          title: "Meeting prep",
          projectName: "Meetings",
          projectColor: "bg-pink-100",
          completed: false,
        },
      ],
    },
    {
      id: "not-urgent-not-important",
      title: "Quadrant IV",
      subtitle: "Not Urgent & Not Important",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      icon: <Trash2 className="w-5 h-5 text-gray-600" />,
      tasks: [
        {
          id: "7",
          title: "Reorganize files",
          projectName: "Maintenance",
          projectColor: "bg-slate-100",
          completed: false,
        },
      ],
    },
  ]);

  const handleCompleteTask = (quadrantId: string, taskId: string) => {
    setQuadrants(
      quadrants.map((q) =>
        q.id === quadrantId
          ? {
              ...q,
              tasks: q.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: true } : t
              ),
            }
          : q
      )
    );
  };

  const completedTasksCount = quadrants.reduce(
    (total, q) => total + q.tasks.filter((t) => t.completed).length,
    0
  );
  const totalTasksCount = quadrants.reduce((total, q) => total + q.tasks.length, 0);

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 md:px-8 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-lg">TaskQuadrant Dashboard</h3>
          <p className="text-blue-100 text-sm">Interactive Preview</p>
        </div>
        <div className="text-right">
          <p className="text-blue-100 text-xs">Progress</p>
          <p className="text-white font-semibold">
            {completedTasksCount}/{totalTasksCount} completed
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 md:px-8 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quadrants.map((quadrant) => {
            const activeTasks = quadrant.tasks.filter((t) => !t.completed);
            const completedCount = quadrant.tasks.filter((t) => t.completed).length;

            return (
              <div
                key={quadrant.id}
                className={`border-2 rounded-lg p-4 md:p-6 ${quadrant.bgColor} ${quadrant.borderColor}`}
              >
                {/* Quadrant Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {quadrant.icon}
                    <h4 className="font-bold text-gray-900">{quadrant.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{quadrant.subtitle}</p>
                  <p className="text-xs text-gray-500">
                    {activeTasks.length} active • {completedCount} completed
                  </p>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {activeTasks.length > 0 ? (
                    activeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() =>
                          handleCompleteTask(quadrant.id, task.id)
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex-shrink-0 mt-1 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center group-hover:border-green-500 transition-colors"
                          >
                            {/* Empty circle - click to complete */}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${task.projectColor} text-gray-700`}
                              >
                                {task.projectName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">No tasks in this quadrant</p>
                    </div>
                  )}

                  {/* Completed Tasks Preview */}
                  {completedCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">
                        {completedCount} Completed
                      </p>
                      {quadrant.tasks
                        .filter((t) => t.completed)
                        .slice(0, 2)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 text-sm text-gray-500 mb-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="line-through">{task.title}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Hint */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Click on any task to mark it as complete. This is how TaskQuadrant keeps your priorities organized!
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 md:px-8 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
        <p className="text-gray-600">Full dashboard with more features inside</p>
        <a
          href="/auth?mode=signup"
          className="text-blue-600 font-medium hover:text-blue-700 transition"
        >
          Try It Free →
        </a>
      </div>
    </div>
  );
}
