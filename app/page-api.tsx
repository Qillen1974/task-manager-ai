"use client";

import { useState, useMemo, useEffect } from "react";
import { Task, Project } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { Navigation } from "@/components/Navigation";
import { TaskForm } from "@/components/TaskForm";
import { ProjectForm } from "@/components/ProjectForm";
import { TaskCard } from "@/components/TaskCard";
import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";
import { getPendingTaskCount, getTasksByProject } from "@/lib/utils";
import { AuthPage } from "@/components/AuthPage";

export default function Home() {
  const api = useApi();
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [activeView, setActiveView] = useState<"dashboard" | "projects" | "all-tasks" | string>("dashboard");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [defaultProjectId, setDefaultProjectId] = useState<string>("");

  // Load data from API on mount and when logged in
  useEffect(() => {
    const loadData = async () => {
      if (!api.isLoggedIn) {
        setHydrated(true);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch projects
        const projectsResponse = await api.getProjects();
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
        }

        // Fetch tasks
        const tasksResponse = await api.getTasks();
        if (tasksResponse.success && tasksResponse.data) {
          setTasks(tasksResponse.data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
        setHydrated(true);
      }
    };

    loadData();
  }, [api.isLoggedIn]);

  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const pendingTaskCount = useMemo(() => getPendingTaskCount(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    if (activeView.startsWith("project-")) {
      const projectId = activeView.replace("project-", "");
      return getTasksByProject(tasks, projectId).filter((t) => !t.completed);
    }
    if (activeView === "all-tasks") {
      return tasks.filter((t) => !t.completed);
    }
    return tasks;
  }, [activeView, tasks]);

  // Task operations
  const handleAddTask = async (task: Task) => {
    try {
      const response = await api.createTask({
        title: task.title,
        projectId: task.projectId,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
        dueTime: task.dueTime,
      });

      if (response.success && response.data) {
        setTasks([...tasks, response.data]);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const response = await api.updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        projectId: updatedTask.projectId,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        dueTime: updatedTask.dueTime,
        completed: updatedTask.completed,
      });

      if (response.success && response.data) {
        setTasks(tasks.map((t) => (t.id === updatedTask.id ? response.data : t)));
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const response = await api.updateTask(taskId, {
        completed: !task.completed,
      });

      if (response.success && response.data) {
        setTasks(
          tasks.map((t) =>
            t.id === taskId
              ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
              : t
          )
        );
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await api.deleteTask(taskId);
        if (response.success) {
          setTasks(tasks.filter((t) => t.id !== taskId));
        }
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // Project operations
  const handleAddProject = async (project: Project) => {
    try {
      const response = await api.createProject(project.name, project.color, project.description);
      if (response.success && response.data) {
        setProjects([...projects, response.data]);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      const response = await api.updateProject(
        updatedProject.id,
        updatedProject.name,
        updatedProject.color,
        updatedProject.description
      );

      if (response.success && response.data) {
        setProjects(projects.map((p) => (p.id === updatedProject.id ? response.data : p)));
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await api.deleteProject(projectId);
        if (response.success) {
          setProjects(projects.filter((p) => p.id !== projectId));
          setTasks(tasks.filter((t) => t.projectId !== projectId));
          setActiveView("dashboard");
        }
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  const handleAuthSuccess = () => {
    // Data will be loaded by useEffect when isLoggedIn changes
  };

  const handleLogout = () => {
    api.logout();
    setProjects([]);
    setTasks([]);
    setActiveView("dashboard");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center animate-spin">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600">Loading TaskMaster...</p>
        </div>
      </div>
    );
  }

  if (!api.isLoggedIn) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center animate-spin">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        projects={projects}
        activeView={activeView}
        onViewChange={setActiveView}
        pendingTaskCount={pendingTaskCount}
        userName={localStorage.getItem("userEmail") || "User"}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content sections */}
        {activeView === "dashboard" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Eisenhower Matrix</h1>
                <p className="text-gray-600 mt-2">Prioritize your tasks based on urgency and importance</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium flex items-center gap-2"
                >
                  📋 New Project
                </button>
                <button
                  onClick={() => {
                    setEditingTask(undefined);
                    setDefaultProjectId(projects[0]?.id || "");
                    setShowTaskForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  ➕ New Task
                </button>
              </div>
            </div>

            <EisenhowerMatrix
              tasks={tasks}
              projects={projectsMap}
              onCompleteTask={handleCompleteTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeView === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <button
                onClick={() => {
                  setEditingProject(undefined);
                  setShowProjectForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ➕ New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setShowProjectForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {tasks.filter((t) => t.projectId === project.id).length} tasks
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full`}
                      style={{
                        backgroundColor: {
                          blue: "#3b82f6",
                          red: "#ef4444",
                          green: "#10b981",
                          purple: "#a855f7",
                          pink: "#ec4899",
                          yellow: "#f59e0b",
                          indigo: "#6366f1",
                          cyan: "#06b6d4",
                        }[project.color as string] || "#3b82f6",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "all-tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
              <button
                onClick={() => {
                  setEditingTask(undefined);
                  setDefaultProjectId(projects[0]?.id || "");
                  setShowTaskForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ➕ New Task
              </button>
            </div>

            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks yet. Create one to get started!</p>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={projectsMap.get(task.projectId)}
                    onComplete={() => handleCompleteTask(task.id)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeView.startsWith("project-") && (
          <div className="space-y-6">
            {(() => {
              const projectId = activeView.replace("project-", "");
              const project = projectsMap.get(projectId);
              return (
                <>
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
                    <button
                      onClick={() => {
                        setDefaultProjectId(projectId);
                        setEditingTask(undefined);
                        setShowTaskForm(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      ➕ Add Task
                    </button>
                  </div>

                  <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No tasks in this project yet.</p>
                    ) : (
                      filteredTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          onComplete={() => handleCompleteTask(task.id)}
                          onEdit={() => handleEditTask(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                        />
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <TaskForm
              projects={projects}
              editingTask={editingTask}
              defaultProjectId={defaultProjectId}
              onClose={() => {
                setShowTaskForm(false);
                setEditingTask(undefined);
              }}
              onSubmit={async (task) => {
                if (editingTask) {
                  await handleUpdateTask(task);
                } else {
                  await handleAddTask(task);
                }
                setShowTaskForm(false);
                setEditingTask(undefined);
              }}
            />
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <ProjectForm
              editingProject={editingProject}
              onClose={() => {
                setShowProjectForm(false);
                setEditingProject(undefined);
              }}
              onSubmit={async (project) => {
                if (editingProject) {
                  await handleUpdateProject(project);
                } else {
                  await handleAddProject(project);
                }
                setShowProjectForm(false);
                setEditingProject(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
