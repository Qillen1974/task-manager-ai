"use client";

import { useState } from "react";
import { Task, Project, Priority } from "@/lib/types";
import { generateId, getPriorityLabel } from "@/lib/utils";

interface TaskFormProps {
  projects: Project[];
  onTaskAdd?: (task: Task) => void;
  onClose: () => void;
  editingTask?: Task;
  onTaskUpdate?: (task: Task) => void;
  defaultProjectId?: string;
  onSubmit?: (task: Task) => void | Promise<void>;
}

export function TaskForm({ projects, onTaskAdd, onClose, editingTask, onTaskUpdate, defaultProjectId, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState(editingTask?.title || "");
  const [description, setDescription] = useState(editingTask?.description || "");
  const [projectId, setProjectId] = useState(editingTask?.projectId || defaultProjectId || projects[0]?.id || "");
  const [priority, setPriority] = useState<Priority>(editingTask?.priority || "not-urgent-not-important");
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ? editingTask.dueDate.split('T')[0] : "");
  const [dueTime, setDueTime] = useState(editingTask?.dueTime || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const priorities: Priority[] = [
    "urgent-important",
    "not-urgent-important",
    "urgent-not-important",
    "not-urgent-not-important",
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    console.log("Validating form with:", { title, projectId, dueDate, dueTime });

    if (!title.trim()) {
      newErrors.title = "Task title is required";
      console.log("Title validation failed");
    }

    if (!projectId) {
      newErrors.projectId = "Project is required";
      console.log("ProjectId validation failed");
    }

    if (dueDate && !isValidDate(dueDate)) {
      newErrors.dueDate = "Invalid date format";
      console.log("Date validation failed for:", dueDate);
    }

    if (dueDate && dueTime && !isValidTime(dueTime)) {
      newErrors.dueTime = "Invalid time format";
      console.log("Time validation failed for:", dueTime);
    }

    console.log("Validation errors:", newErrors);
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

    const task: Task = {
      id: editingTask?.id || generateId(),
      title,
      description,
      projectId,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      completed: editingTask?.completed || false,
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
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="text-red-500 text-sm mt-1">{errors.projectId}</p>}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {getPriorityLabel(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
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
