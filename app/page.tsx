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
import { GanttChart } from "@/components/GanttChart";
import { getPendingTaskCount } from "@/lib/utils";
import { canCreateRecurringTask } from "@/lib/projectLimits";

// Helper function to recursively find a project in the hierarchy
function findProjectInTree(projects: Project[], projectId: string): Project | undefined {
  for (const project of projects) {
    if (project.id === projectId) {
      return project;
    }
    if ((project as any).children && (project as any).children.length > 0) {
      const found = findProjectInTree((project as any).children, projectId);
      if (found) return found;
    }
  }
  return undefined;
}

// Helper function to get all projects (root and nested) in a flat list
function flattenProjectTree(projects: Project[]): Project[] {
  const flat: Project[] = [];
  for (const project of projects) {
    flat.push(project);
    if ((project as any).children && (project as any).children.length > 0) {
      flat.push(...flattenProjectTree((project as any).children));
    }
  }
  return flat;
}

// Helper function to get all subproject IDs (including the project itself) recursively
function getProjectAndSubprojectIds(projects: Project[], projectId: string): string[] {
  const ids: string[] = [projectId];
  const project = findProjectInTree(projects, projectId);

  if (project && (project as any).children && (project as any).children.length > 0) {
    for (const child of (project as any).children) {
      ids.push(...getProjectAndSubprojectIds([child], child.id));
    }
  }

  return ids;
}

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
  const [dashboardProjectFilter, setDashboardProjectFilter] = useState<string>(""); // "" means all projects
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

          // Fetch user subscription plan
          const userResponse = await api.getCurrentUser();
          if (userResponse.success && userResponse.data?.subscription?.plan) {
            setUserPlan(userResponse.data.subscription.plan);
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

  // Count recurring tasks and check if user can create more
  const recurringTaskCount = useMemo(() => {
    return tasks.filter(t => t.isRecurring && !t.parentTaskId).length;
  }, [tasks]);

  const canCreateRecurringTasks = useMemo(() => {
    const result = canCreateRecurringTask(userPlan, recurringTaskCount);
    return result.allowed;
  }, [userPlan, recurringTaskCount]);

  // Filter tasks based on dashboard project filter (including subprojects)
  const filteredTasksForDashboard = useMemo(() => {
    if (!dashboardProjectFilter) {
      return tasks; // Show all tasks
    }
    // Get all project IDs including subprojects
    const projectIds = getProjectAndSubprojectIds(projects, dashboardProjectFilter);
    // Filter tasks that belong to the selected project or any of its subprojects
    return tasks.filter((t) => projectIds.includes(t.projectId));
  }, [tasks, dashboardProjectFilter, projects]);

  // Task operations
  const handleAddTask = async (task: Task) => {
    try {
      const response = await api.createTask({
        title: task.title,
        projectId: task.projectId,
        description: task.description,
        priority: task.priority,
        startDate: task.startDate,
        startTime: task.startTime,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        resourceCount: task.resourceCount,
        manhours: task.manhours,
        dependsOnTaskId: task.dependsOnTaskId,
        isRecurring: task.isRecurring,
        recurringPattern: task.recurringPattern,
        recurringConfig: task.recurringConfig,
        recurringStartDate: task.recurringStartDate,
        recurringEndDate: task.recurringEndDate,
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
        startDate: updatedTask.startDate,
        startTime: updatedTask.startTime,
        dueDate: updatedTask.dueDate,
        dueTime: updatedTask.dueTime,
        progress: updatedTask.progress,
        completed: updatedTask.completed,
        resourceCount: updatedTask.resourceCount,
        manhours: updatedTask.manhours,
        dependsOnTaskId: updatedTask.dependsOnTaskId,
        isRecurring: updatedTask.isRecurring,
        recurringPattern: updatedTask.recurringPattern,
        recurringConfig: updatedTask.recurringConfig,
        recurringStartDate: updatedTask.recurringStartDate,
        recurringEndDate: updatedTask.recurringEndDate,
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
      const isBeingCompleted = !task.completed;
      const response = await api.updateTask(taskId, {
        completed: isBeingCompleted,
        // When completing a task, automatically set progress to 100
        ...(isBeingCompleted && { progress: 100 }),
      });

      if (response.success && response.data) {
        // Use the server response data which has the updated progress from the backend
        setTasks(
          tasks.map((t) =>
            t.id === taskId ? response.data : t
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

  // Get all projects flattened (for dropdown selections)
  const allProjectsFlattened = useMemo(() => {
    return flattenProjectTree(projects);
  }, [projects]);

  // Find active project (search recursively through hierarchy)
  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return findProjectInTree(projects, activeProjectId);
  }, [activeProjectId, projects]);

  // Get child projects of active project
  const childProjects = useMemo(() => {
    if (!activeProjectId) return [];
    const active = findProjectInTree(projects, activeProjectId);
    return active && (active as any).children ? (active as any).children : [];
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
        // Reload projects to maintain proper hierarchy
        const projectsResponse = await api.getProjects();
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
        }
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
        // Reload projects to maintain proper hierarchy
        const projectsResponse = await api.getProjects();
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
        }
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
          // Reload projects and tasks to reflect the deletion
          const projectsResponse = await api.getProjects();
          if (projectsResponse.success && projectsResponse.data) {
            setProjects(projectsResponse.data);
          }

          const tasksResponse = await api.getTasks();
          if (tasksResponse.success && tasksResponse.data) {
            setTasks(tasksResponse.data);
          }

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
        activeProjectId={activeProjectId}
        onViewChange={setActiveView}
        onProjectSelect={setActiveProjectId}
        pendingTaskCount={pendingTaskCount}
        userName={localStorage.getItem("userEmail") || "User"}
        userEmail={localStorage.getItem("userEmail") || ""}
        isAdmin={localStorage.getItem("isAdmin") === "true"}
        onLogout={handleLogout}
        onSettingsClick={() => setShowUserSettings(true)}
      />

      <div className="flex gap-6 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-20 left-4 z-40 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition lg:hidden"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Left Sidebar - Project Tree Navigation */}
        <aside className={`transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-0"} flex-shrink-0 overflow-hidden`}>
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
              <>
                <ProjectTree
                  projects={rootProjects}
                  activeProjectId={activeProjectId}
                  onSelectProject={(projectId) => {
                    setActiveProjectId(projectId);
                    setActiveView("projects");
                  }}
                onCreateSubproject={(parentId) => {
                  setEditingProject(undefined);
                  setParentProjectId(parentId);
                  setShowProjectModal(true);
                }}
                onEditProject={(projectId) => {
                  const project = findProjectInTree(projects, projectId);
                  if (project) {
                    setEditingProject(project);
                    setShowProjectModal(true);
                  }
                }}
                onDeleteProject={handleDeleteProject}
              />
              </>
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

              {/* Project Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Filter by Project:</label>
                <select
                  value={dashboardProjectFilter}
                  onChange={(e) => setDashboardProjectFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">All Projects</option>
                  {rootProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <EisenhowerMatrix
                tasks={filteredTasksForDashboard}
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
          {activeView === "projects" && activeProjectId && activeProject && (
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
                    onSelectSubproject={setActiveProjectId}
                    onCreateSubproject={() => {
                      setEditingProject(undefined);
                      setParentProjectId(activeProjectId);
                      setShowProjectModal(true);
                    }}
                  />

                  {/* Gantt Chart */}
                  <GanttChart
                    project={activeProject}
                    tasks={tasks.filter((t) => t.projectId === activeProjectId)}
                    onTaskClick={handleEditTask}
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

          {/* Default message when no project is selected in projects view */}
          {activeView === "projects" && !activeProjectId && (
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
              tasks={tasks}
              allProjects={allProjectsFlattened}
              editingTask={editingTask}
              defaultProjectId={defaultProjectId}
              activeProjectId={activeProjectId}
              childProjects={childProjects}
              canCreateRecurringTasks={canCreateRecurringTasks}
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
