"use client";

import { useState } from "react";
import { Repeat2, Calendar, Clock, CheckCircle2 } from "lucide-react";

interface RecurringTask {
  id: string;
  title: string;
  frequency: string;
  nextDue: string;
  lastCompleted?: string;
  completed: boolean;
}

export function HeroRecurringTasksPreview() {
  const [tasks, setTasks] = useState<RecurringTask[]>([
    {
      id: "1",
      title: "Weekly Team Standup",
      frequency: "Every Monday, 10:00 AM",
      nextDue: "Dec 9, 2024",
      lastCompleted: "Dec 2, 2024",
      completed: false,
    },
    {
      id: "2",
      title: "Monthly Performance Review",
      frequency: "First Friday of each month",
      nextDue: "Dec 6, 2024",
      lastCompleted: "Nov 1, 2024",
      completed: false,
    },
    {
      id: "3",
      title: "Daily Standup Report",
      frequency: "Every weekday at 5:00 PM",
      nextDue: "Today",
      lastCompleted: "Yesterday",
      completed: true,
    },
    {
      id: "4",
      title: "Quarterly Budget Review",
      frequency: "Every Q1, Q2, Q3, Q4",
      nextDue: "Mar 15, 2025",
      lastCompleted: "Sep 15, 2024",
      completed: false,
    },
  ]);

  const handleCompleteTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 md:px-8 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Repeat2 className="w-5 h-5" />
            Recurring Tasks
          </h3>
          <p className="text-purple-100 text-sm">Automate your workflow</p>
        </div>
        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
          <p className="text-white text-xs font-semibold">PRO FEATURE</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg p-4 border-2 transition-all cursor-pointer ${
                task.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => handleCompleteTask(task.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Checkbox */}
                  <div
                    className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 group-hover:border-purple-500"
                    }`}
                  >
                    {task.completed && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Task Details */}
                  <div className="flex-1">
                    <h4
                      className={`font-semibold ${
                        task.completed
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h4>

                    {/* Frequency and Timing */}
                    <div className="flex flex-col md:flex-row gap-3 mt-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Repeat2 className="w-4 h-4 text-purple-600" />
                        <span>{task.frequency}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Next: {task.nextDue}</span>
                      </div>
                    </div>

                    {/* Last Completed */}
                    {task.lastCompleted && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>Last: {task.lastCompleted}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900">
            <strong>✨ Benefits:</strong> Never miss a deadline. Recurring tasks automatically recreate themselves, keeping your workflow organized and your team aligned.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 md:px-8 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
        <p className="text-gray-600">Available in Pro and Enterprise plans</p>
        <span className="text-purple-600 font-medium">Learn more →</span>
      </div>
    </div>
  );
}
