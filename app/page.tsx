"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Task, Project } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { Navigation } from "@/components/Navigation";
import { TaskForm } from "@/components/TaskForm";
import { TaskCard } from "@/components/TaskCard";
import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";
import { UserSettings } from "@/components/UserSettings";
import { AuthPage } from "@/components/AuthPage";
import { ProjectTree } from "@/components/ProjectTree";
import { ProjectHierarchyModal, ProjectFormData } from "@/components/ProjectHierarchyModal";
import { ProjectBreadcrumb } from "@/components/ProjectBreadcrumb";
import { ProjectStats } from "@/components/ProjectStats";
import { getPendingTaskCount } from "@/lib/utils";

export default function Home() {
  const api = useApi();
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userPlan, setUserPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("FREE");
  const initialLoadDoneRef = useRef(false);

  // Navigation and UI state
  const [activeView, setActiveView] = useState<"dashboard" | "projects" | "all-tasks" | string>("dashboard");
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Editing state
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [parentProjectId, setParentProjectId] = useState<string | undefined>();
  const [defaultProjectId, setDefaultProjectId] = useState<string>("");

  // Load initial data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initialLoadDoneRef.current) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setHydrated(true);
      return;
    }

    initialLoadDoneRef.current = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch projects with hierarchy
        const projectsResponse = await api.getProjects();
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
        }

        // Fetch tasks
        const tasksResponse = await api.getTasks();
        if (tasksResponse.success && tasksResponse.data) {
          setTasks(tasksResponse.data);
        }

        // Get user subscription for plan limits
        try {
          const userResponse = await api.getCurrentUser();
          if (userResponse.success && userResponse.data?.subscription?.plan) {
            setUserPlan(userResponse.data.subscription.plan);
          }
        } catch (err) {
          console.warn("Could not fetch user subscription:", err);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
        setHydrated(true);
      }
    };

    loadData();
  }, []);

  // Handle auth success - reload data when user logs in
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthSuccess = () => {
      // Reset the load flag and reload data
      initialLoadDoneRef.current = false;

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      setIsLoading(true);

      // Immediately reload the data
      const loadData = async () => {
        try {
          const projectsResponse = await api.getProjects();
          if (projectsResponse.success && projectsResponse.data) {
            setProjects(projectsResponse.data);
          }

          const tasksResponse = await api.getTasks();
          if (tasksResponse.success && tasksResponse.data) {
            setTasks(tasksResponse.data);
          }
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    };

    window.addEventListener('authSuccess', handleAuthSuccess);
    return () => window.removeEventListener('authSuccess', handleAuthSuccess);
  }, [api]);

  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const pendingTaskCount = useMemo(() => getPendingTaskCount(tasks), [tasks]);

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
      } else if (!response.success && response.error) {
        const errorMsg = response.error?.message || "Failed to update task";
        alert(`Error: ${errorMsg}`);
        console.error("Task update failed:", response.error);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Error: An unexpected error occurred while updating the task");
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

  // Build hierarchical project tree (root projects only)
  const rootProjects = useMemo(() => {
    return projects.filter((p) => !p.parentProjectId);
  }, [projects]);

  // Find active project
  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId);
  }, [activeProjectId, projects]);

  // Get child projects of active project
  const childProjects = useMemo(() => {
    if (!activeProjectId) return [];
    return projects.filter((p) => p.parentProjectId === activeProjectId);
  }, [activeProjectId, projects]);

  // Project operations (hierarchical)
  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          color: data.color,
          parentProjectId: data.parentProjectId || undefined,
          startDate: data.startDate || undefined,
          endDate: data.endDate || undefined,
          owner: data.owner || undefined,
          budget: data.budget || undefined,
          budget_currency: data.budget_currency || "USD",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create project");
      }

      const result = await response.json();
      if (result.success) {
        setProjects([...projects, result.data]);
        alert("Project created successfully!");
      } else {
        throw new Error(result.error?.message || "Failed to create project");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      alert(`Error: ${errorMsg}`);
      console.error("Project creation failed:", error);
    }
  };

  const handleEditProject = async (data: ProjectFormData) => {
    if (!editingProject) return;

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          color: data.color,
          startDate: data.startDate || undefined,
          endDate: data.endDate || undefined,
          owner: data.owner || undefined,
          budget: data.budget || undefined,
          budget_currency: data.budget_currency || "USD",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update project");
      }

      const result = await response.json();
      if (result.success) {
        setProjects(projects.map((p) => (p.id === editingProject.id ? result.data : p)));
        alert("Project updated successfully!");
      } else {
        throw new Error(result.error?.message || "Failed to update project");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      alert(`Error: ${errorMsg}`);
      console.error("Project update failed:", error);
    }
  };


  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project and all its subprojects?")) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to delete project");
        }

        const result = await response.json();
        if (result.success) {
          // Remove all projects in the deleted hierarchy and their tasks
          const projectIdsToDelete = new Set<string>();
          const collectProjectIds = (pId: string) => {
            projectIdsToDelete.add(pId);
            projects.filter((p) => p.parentProjectId === pId).forEach((p) => {
              collectProjectIds(p.id);
            });
          };
          collectProjectIds(projectId);

          setProjects(projects.filter((p) => !projectIdsToDelete.has(p.id)));
          setTasks(tasks.filter((t) => !projectIdsToDelete.has(t.projectId)));
          setActiveProjectId("");
          alert("Project deleted successfully!");
        } else {
          throw new Error(result.error?.message || "Failed to delete project");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An error occurred";
        alert(`Error: ${errorMsg}`);
        console.error("Project deletion failed:", error);
      }
    }
  };


  const handleLogout = () => {
    api.logout();
    setProjects([]);
    setTasks([]);
    setActiveView("dashboard");
  };

  // Check if user has a token in localStorage
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  if (!hydrated || !hasToken) {
    return <AuthPage onAuthSuccess={() => {}} />;
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
        onProjectSelect={() => {}} // No-op callback - onViewChange handles the navigation
        pendingTaskCount={pendingTaskCount}
        userName={localStorage.getItem("userEmail") || "User"}
        userEmail={localStorage.getItem("userEmail") || ""}
        isAdmin={localStorage.getItem("isAdmin") === "true"}
        onLogout={handleLogout}
        onSettingsClick={() => setShowUserSettings(true)}
      />

      <div className="flex gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Left Sidebar - Project Tree Navigation */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-8">
            <button
              onClick={() => {
                setEditingProject(undefined);
                setParentProjectId(undefined);
                setShowProjectModal(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium mb-4"
            >
              + New Project
            </button>

            {rootProjects.length > 0 ? (
              <ProjectTree
                projects={rootProjects}
                activeProjectId={activeProjectId}
                onSelectProject={setActiveProjectId}
                onCreateSubproject={(parentId) => {
                  setEditingProject(undefined);
                  setParentProjectId(parentId);
                  setShowProjectModal(true);
                }}
                onEditProject={(projectId) => {
                  const project = projects.find((p) => p.id === projectId);
                  if (project) {
                    setEditingProject(project);
                    setShowProjectModal(true);
                  }
                }}
                onDeleteProject={handleDeleteProject}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No projects yet.</p>
                <p className="text-xs mt-2">Create your first project to get started!</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Dashboard View */}
          {activeView === "dashboard" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Eisenhower Matrix</h1>
                  <p className="text-gray-600 mt-2">Prioritize your tasks based on urgency and importance</p>
                </div>
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

              <EisenhowerMatrix
                tasks={tasks}
                projects={projectsMap}
                onTaskComplete={handleCompleteTask}
                onTaskEdit={handleEditTask}
                onTaskDelete={handleDeleteTask}
              />
            </div>
          )}

          {/* All Tasks View */}
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
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks yet. Create one to get started!</p>
                ) : (
                  tasks.map((task) => (
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

          {/* Active Project View with Hierarchical Details */}
          {activeProjectId && activeProject && (
            <div className="space-y-6">
              <ProjectBreadcrumb
                project={activeProject}
                allProjects={projects}
                onProjectClick={setActiveProjectId}
              />

              <ProjectStats
                project={activeProject}
                tasks={tasks.filter((t) => t.projectId === activeProjectId)}
                childProjects={childProjects}
                onEditProject={() => {
                  setEditingProject(activeProject);
                  setShowProjectModal(true);
                }}
              />

              {/* Tasks for this project */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Tasks</h3>
                  <button
                    onClick={() => {
                      setEditingTask(undefined);
                      setDefaultProjectId(activeProjectId);
                      setShowTaskForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                  >
                    ➕ Add Task
                  </button>
                </div>

                <div className="space-y-4">
                  {tasks.filter((t) => t.projectId === activeProjectId).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No tasks in this project yet.</p>
                  ) : (
                    tasks
                      .filter((t) => t.projectId === activeProjectId)
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={activeProject}
                          onComplete={() => handleCompleteTask(task.id)}
                          onEdit={() => handleEditTask(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                        />
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Default message when no project is selected */}
          {!activeProjectId && activeView !== "dashboard" && activeView !== "all-tasks" && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600">Select a project from the sidebar or create a new one to get started.</p>
            </div>
          )}
        </main>
      </div>

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

      {/* Project Hierarchy Modal */}
      <ProjectHierarchyModal
        isOpen={showProjectModal}
        isEditing={!!editingProject}
        project={editingProject}
        parentProjectId={parentProjectId}
        allProjects={projects}
        userPlan={userPlan}
        onSubmit={async (data) => {
          if (editingProject) {
            await handleEditProject(data);
          } else {
            await handleCreateProject(data);
          }
          setShowProjectModal(false);
          setEditingProject(undefined);
          setParentProjectId(undefined);
        }}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(undefined);
          setParentProjectId(undefined);
        }}
      />

      {/* User Settings Modal */}
      {showUserSettings && (
        <UserSettings
          userName={localStorage.getItem("userEmail") || "User"}
          userEmail={localStorage.getItem("userEmail") || ""}
          onClose={() => setShowUserSettings(false)}
        />
      )}
    </div>
  );
}
