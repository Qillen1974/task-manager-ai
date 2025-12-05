"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Task, Project, TaskAssignmentRole } from "@/lib/types";

// Note: Metadata export removed because this component uses "use client"
// The metadata from root layout will be used for this page instead
import { useApi } from "@/lib/useApi";
import { Navigation } from "@/components/Navigation";
import { TaskForm } from "@/components/TaskForm";
import { TaskCard } from "@/components/TaskCard";
import { TaskAssignmentModal } from "@/components/TaskAssignmentModal";
import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";
import { UserSettings } from "@/components/UserSettings";
import { AuthPage } from "@/components/AuthPage";
import { ProjectTree } from "@/components/ProjectTree";
import { ProjectHierarchyModal, ProjectFormData } from "@/components/ProjectHierarchyModal";
import { ProjectBreadcrumb } from "@/components/ProjectBreadcrumb";
import { ProjectStats } from "@/components/ProjectStats";
import { GanttChart } from "@/components/GanttChart";
import { OnboardingWizard } from "@/components/Wizard/OnboardingWizard";
import { ChatBubble } from "@/components/AIButler";
import { getPendingTaskCount, getAutoPriority } from "@/lib/utils";
import { canCreateRecurringTask, canCreateRootProject, TASK_LIMITS } from "@/lib/projectLimits";

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
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userPlan, setUserPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("FREE");
  const initialLoadDoneRef = useRef(false);
  const wizardTriggeredRef = useRef(false);

  // Navigation and UI state
  const [activeView, setActiveView] = useState<"dashboard" | "projects" | "all-tasks" | string>("dashboard");
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [dashboardProjectFilter, setDashboardProjectFilter] = useState<string>(""); // "" means all projects
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Onboarding wizard state
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Editing state
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [parentProjectId, setParentProjectId] = useState<string | undefined>();
  const [defaultProjectId, setDefaultProjectId] = useState<string>("");

  // Task assignment state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<Task | undefined>();
  const [assignmentIsLoading, setAssignmentIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name?: string; email?: string; role: string }>>([]);
  const [userTeamRole, setUserTeamRole] = useState<string | undefined>();

  // User preferences state
  const [userPreferences, setUserPreferences] = useState<{
    enableAutoPrioritization: boolean;
    autoPrioritizationThresholdHours: number;
  }>({
    enableAutoPrioritization: true,
    autoPrioritizationThresholdHours: 48,
  });

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
        // Generate any due recurring task instances
        try {
          const genResponse = await api.post("/tasks/generate-recurring?action=generate-all", {});
          console.log("[Dashboard] Recurring tasks generation result:", genResponse);
          if (genResponse?.success === false || genResponse?.data?.tasksGenerated === 0) {
            console.log("[Dashboard] No recurring tasks were generated. Result:", genResponse?.data);
          }
        } catch (err) {
          console.warn("[Dashboard] Recurring task generation failed:", err);
          // Don't block task loading if generation fails
        }

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

        // Get user preferences for auto-prioritization
        try {
          const token = localStorage.getItem('accessToken');
          if (token) {
            const preferencesResponse = await fetch('/api/settings/preferences', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (preferencesResponse.ok) {
              const prefs = await preferencesResponse.json();
              if (prefs.success && prefs.data) {
                setUserPreferences({
                  enableAutoPrioritization: prefs.data.enableAutoPrioritization ?? true,
                  autoPrioritizationThresholdHours: prefs.data.autoPrioritizationThresholdHours ?? 48,
                });
              }
            }
          }
        } catch (err) {
          console.warn("Could not fetch user preferences:", err);
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
          // Generate any due recurring task instances
          try {
            const genResponse = await api.post("/tasks/generate-recurring?action=generate-all", {});
            console.log("[Dashboard] Recurring tasks generation result on auth:", genResponse);
            if (genResponse?.success === false || genResponse?.data?.tasksGenerated === 0) {
              console.log("[Dashboard] No recurring tasks were generated on auth. Result:", genResponse?.data);
            }
          } catch (err) {
            console.warn("[Dashboard] Recurring task generation failed on auth:", err);
            // Don't block task loading if generation fails
          }

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

  // Auto-refresh projects and tasks when window regains focus (prevents stale data)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = async () => {
      // Only refresh if the page becomes visible and user is authenticated
      if (!document.hidden && localStorage.getItem('accessToken')) {
        console.log("[Dashboard] Window regained focus - refreshing data to prevent stale state");
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
          console.warn("[Dashboard] Failed to refresh data on focus:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [api]);

  // Handle search params for initial view and project selection
  useEffect(() => {
    try {
      const searchParams = useSearchParams();
      if (searchParams) {
        const view = searchParams.get("view");
        const projectId = searchParams.get("projectId");

        if (view) {
          setActiveView(view);
        }
        if (projectId) {
          setActiveProjectId(projectId);
        }
      }
    } catch (e) {
      // useSearchParams not available, use defaults
      console.debug("useSearchParams not available, using defaults");
    }
  }, []);

  // Detect first-time users and show onboarding wizard
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydrated) return;
    if (isLoading) return; // Wait for initial load to complete

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Only trigger wizard once per session
    if (wizardTriggeredRef.current) return;

    // Check if user has already seen the wizard or has any existing projects
    const hasSeenWizard = localStorage.getItem('wizardCompleted');
    const hasProjects = projects.length > 0;

    if (!hasSeenWizard && !hasProjects) {
      wizardTriggeredRef.current = true;
      setShowOnboardingWizard(true);
    }
  }, [hydrated, isLoading, projects.length]);

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

  // Apply auto-prioritization to tasks if enabled
  const tasksWithAutoPriority = useMemo(() => {
    if (!userPreferences.enableAutoPrioritization) {
      return filteredTasksForDashboard;
    }

    return filteredTasksForDashboard.map((task) => ({
      ...task,
      priority: getAutoPriority(
        task.priority || "",
        task.dueDate,
        task.dueTime,
        userPreferences.autoPrioritizationThresholdHours
      ),
    }));
  }, [filteredTasksForDashboard, userPreferences]);

  // Task operations
  const handleAddTask = async (task: Task) => {
    try {
      // Check task limit for FREE users
      const taskLimit = TASK_LIMITS[userPlan];
      if (taskLimit.maxTasks !== -1 && tasks.length >= taskLimit.maxTasks) {
        alert(`You have reached your task limit (${taskLimit.maxTasks}) on the ${userPlan} plan. Upgrade to PRO or ENTERPRISE to create more tasks.`);
        return;
      }

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
          // Remove task from state immediately
          setTasks(tasks.filter((t) => t.id !== taskId));
          // Show success message
          alert("Task deleted successfully!");
        } else {
          alert("Failed to delete task: " + (response.error?.message || "Unknown error"));
          console.error("Delete task failed:", response.error);
        }
      } catch (error) {
        alert("Error deleting task: " + (error instanceof Error ? error.message : String(error)));
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleAssignTask = async (userId: string, role: TaskAssignmentRole) => {
    if (!taskToAssign) return;

    try {
      setAssignmentIsLoading(true);
      const response = await api.post(`/tasks/${taskToAssign.id}/assignments`, {
        userId,
        role,
      });

      if (response.success) {
        // Update the task with new assignment
        const updatedTask = await api.get(`/tasks/${taskToAssign.id}`);
        if (updatedTask.success && updatedTask.data) {
          setTasks(tasks.map((t) => (t.id === taskToAssign.id ? updatedTask.data : t)));
          setTaskToAssign(updatedTask.data);
        }
      }
    } catch (error) {
      console.error("Failed to assign task:", error);
      throw error;
    } finally {
      setAssignmentIsLoading(false);
    }
  };

  const handleUpdateAssignmentRole = async (assignmentId: string, role: TaskAssignmentRole) => {
    if (!taskToAssign) return;

    try {
      setAssignmentIsLoading(true);
      const response = await api.patch(`/tasks/${taskToAssign.id}/assignments/${assignmentId}`, {
        role,
      });

      if (response.success) {
        // Update the task with new assignment data
        const updatedTask = await api.get(`/tasks/${taskToAssign.id}`);
        if (updatedTask.success && updatedTask.data) {
          setTasks(tasks.map((t) => (t.id === taskToAssign.id ? updatedTask.data : t)));
          setTaskToAssign(updatedTask.data);
        }
      }
    } catch (error) {
      console.error("Failed to update assignment role:", error);
      throw error;
    } finally {
      setAssignmentIsLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!taskToAssign) return;

    try {
      setAssignmentIsLoading(true);
      const response = await api.delete(`/tasks/${taskToAssign.id}/assignments/${assignmentId}`);

      if (response.success) {
        // Update the task after removing assignment
        const updatedTask = await api.get(`/tasks/${taskToAssign.id}`);
        if (updatedTask.success && updatedTask.data) {
          setTasks(tasks.map((t) => (t.id === taskToAssign.id ? updatedTask.data : t)));
          setTaskToAssign(updatedTask.data);
        }
      }
    } catch (error) {
      console.error("Failed to remove assignment:", error);
      throw error;
    } finally {
      setAssignmentIsLoading(false);
    }
  };

  const openAssignmentModal = async (task: Task) => {
    setTaskToAssign(task);

    // Fetch team members for the project
    try {
      // Find the project - use flattenProjectTree to get all projects including nested ones
      const flatProjects = flattenProjectTree(projects);
      const project = flatProjects.find(p => p.id === task.projectId);

      console.log("Task project ID:", task.projectId);
      console.log("Found project:", project);
      console.log("Project teamId:", (project as any)?.teamId);

      if (project && (project as any).teamId) {
        const teamId = (project as any).teamId;
        console.log("Fetching members for team:", teamId);
        const response = await api.get(`/teams/${teamId}/members`);
        console.log("Members response:", response);
        if (response.success && response.data) {
          setTeamMembers(response.data);

          // Find current user's role in this team
          const currentUserId = localStorage.getItem("userId");
          const currentMember = response.data.find((m: any) => m.userId === currentUserId);
          setUserTeamRole(currentMember?.role);
        }
      } else {
        // Personal project - user is the owner, can edit assignments
        console.log("Personal project - user is owner");
        setTeamMembers([]);
        setUserTeamRole("OWNER");
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      setTeamMembers([]);
    }

    setShowAssignmentModal(true);
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
      // Check if user is trying to create a root project (no parentProjectId)
      if (!data.parentProjectId) {
        const canCreate = canCreateRootProject(userPlan, rootProjects.length);
        if (!canCreate.allowed) {
          alert(`${canCreate.message}`);
          return;
        }
      }

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
          // Special handling for 404 - the project may have been already deleted or doesn't exist
          if (response.status === 404) {
            console.warn(`Project ${projectId} not found in database - refreshing project list`);

            // Refresh projects and tasks to sync with current database state
            const projectsResponse = await api.getProjects();
            if (projectsResponse.success && projectsResponse.data) {
              setProjects(projectsResponse.data);
            }

            const tasksResponse = await api.getTasks();
            if (tasksResponse.success && tasksResponse.data) {
              setTasks(tasksResponse.data);
            }

            setActiveProjectId("");
            alert("This project no longer exists in the database. The project list has been refreshed to show current data.");
            return;
          }

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
    router.push("/");
  };

  const handleWizardComplete = async (wizardData: {
    name: string;
    color: string;
    description: string;
    taskTitle: string;
    quadrant: string;
  }) => {
    try {
      console.log("[Wizard] Starting wizard completion with data:", wizardData);

      // Create the project
      console.log("[Wizard] Creating project with:", { name: wizardData.name, color: wizardData.color, description: wizardData.description });
      const projectResponse = await api.createProject({
        name: wizardData.name,
        description: wizardData.description,
        color: wizardData.color,
      });

      console.log("[Wizard] Project response:", projectResponse);

      if (projectResponse.success && projectResponse.data) {
        const newProject = projectResponse.data;
        console.log("[Wizard] Project created successfully:", newProject);

        // Create the task
        // Map wizard quadrant IDs to priority values
        const quadrantMap: Record<string, string> = {
          "do-first": "urgent-important",
          "schedule": "not-urgent-important",
          "delegate": "urgent-not-important",
          "eliminate": "not-urgent-not-important",
        };
        const mappedPriority = quadrantMap[wizardData.quadrant] || "not-urgent-important";

        console.log("[Wizard] Creating task with:", { title: wizardData.taskTitle, projectId: newProject.id, priority: mappedPriority });
        const taskResponse = await api.createTask({
          title: wizardData.taskTitle,
          projectId: newProject.id,
          priority: mappedPriority,
        });

        console.log("[Wizard] Task response:", taskResponse);

        if (taskResponse.success) {
          // Mark wizard as completed
          localStorage.setItem('wizardCompleted', 'true');

          // Hide wizard and reload projects/tasks
          setShowOnboardingWizard(false);

          // Reload data to show new project and task
          const projectsResponse = await api.getProjects();
          if (projectsResponse.success && projectsResponse.data) {
            setProjects(projectsResponse.data);
            if (projectsResponse.data.length > 0) {
              setActiveProjectId(projectsResponse.data[0].id);
              setActiveView("dashboard");
            }
          }

          const tasksResponse = await api.getTasks();
          if (tasksResponse.success && tasksResponse.data) {
            setTasks(tasksResponse.data);
          }
        } else {
          console.error("[Wizard] Task creation failed:", taskResponse.error);
          alert("Failed to create task: " + (taskResponse.error?.message || "Unknown error"));
        }
      } else {
        console.error("[Wizard] Project creation failed:", projectResponse.error);
        alert("Failed to create project: " + (projectResponse.error?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("[Wizard] Failed to complete wizard:", error);
      alert("Wizard error: " + (error instanceof Error ? error.message : "Unknown error"));
      // Still mark as completed so wizard doesn't keep showing
      localStorage.setItem('wizardCompleted', 'true');
      setShowOnboardingWizard(false);
    }
  };

  const handleWizardSkip = () => {
    localStorage.setItem('wizardCompleted', 'true');
    setShowOnboardingWizard(false);
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
      {/* Onboarding Wizard */}
      {showOnboardingWizard && (
        <OnboardingWizard
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      )}

      <Navigation
        projects={projects}
        activeView={activeView}
        activeProjectId={activeProjectId}
        onViewChange={(view) => {
          setActiveView(view);
        }}
        onProjectSelect={setActiveProjectId}
        pendingTaskCount={pendingTaskCount}
        userName={localStorage.getItem("userEmail") || "User"}
        userEmail={localStorage.getItem("userEmail") || ""}
        isAdmin={localStorage.getItem("isAdmin") === "true"}
        onLogout={handleLogout}
        onSettingsClick={() => setShowUserSettings(true)}
        onCreateProject={() => {
          setEditingProject(undefined);
          setParentProjectId(undefined);
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
        onCreateSubproject={(parentId) => {
          setEditingProject(undefined);
          setParentProjectId(parentId);
          setShowProjectModal(true);
        }}
        onWizardClick={() => setShowOnboardingWizard(true)}
      />

      <div className="w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Main Content Area */}
        <main>
          {/* Dashboard View */}
          {activeView === "dashboard" && (
            <div className="space-y-4 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Eisenhower Matrix</h1>
                  <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Prioritize your tasks based on urgency and importance</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTask(undefined);
                    setDefaultProjectId(projects[0]?.id || "");
                    setShowTaskForm(true);
                  }}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"
                >
                  ➕ New Task
                </button>
              </div>

              {/* Project Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Filter by Project:</label>
                <select
                  value={dashboardProjectFilter}
                  onChange={(e) => setDashboardProjectFilter(e.target.value)}
                  className="w-full sm:w-auto px-2 sm:px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                tasks={tasksWithAutoPriority}
                projects={projectsMap}
                onTaskComplete={handleCompleteTask}
                onTaskEdit={handleEditTask}
                onTaskDelete={handleDeleteTask}
                onTaskAssign={openAssignmentModal}
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
                      onAssign={() => openAssignmentModal(task)}
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

                  {/* Gantt Chart - Pro/Enterprise only */}
                  {userPlan !== "FREE" ? (
                    <GanttChart
                      project={activeProject}
                      tasks={tasks.filter((t) => t.projectId === activeProjectId)}
                      onTaskClick={handleEditTask}
                      userPlan={userPlan}
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8 text-center">
                      <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Gantt Chart</h3>
                      <p className="text-gray-600 mb-6">
                        Visualize your project timeline with our interactive Gantt chart. Available on Pro and Enterprise plans.
                      </p>
                      <a
                        href="/upgrade"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Upgrade to Pro
                      </a>
                    </div>
                  )}

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
                          onAssign={() => openAssignmentModal(task)}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {projects.length === 0 ? "Create Your First Project" : "No Project Selected"}
              </h3>
              <p className="text-gray-600 mb-6">
                {projects.length === 0
                  ? "Get started by creating your first project. Click the 'New' button in the navigation bar above."
                  : "Select a project from the top tabs or create a new one to get started."}
              </p>
              {projects.length === 0 && (
                <button
                  onClick={() => {
                    setEditingProject(undefined);
                    setParentProjectId(undefined);
                    setShowProjectModal(true);
                  }}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  ➕ Create Project
                </button>
              )}
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
        onDelete={async (projectId) => {
          await handleDeleteProject(projectId);
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

      {/* Task Assignment Modal */}
      {showAssignmentModal && taskToAssign && (
        <TaskAssignmentModal
          task={taskToAssign}
          teamMembers={teamMembers}
          onAssign={handleAssignTask}
          onRoleChange={handleUpdateAssignmentRole}
          onRemoveAssignment={handleRemoveAssignment}
          canEditAssignments={userTeamRole === "ADMIN" || userTeamRole === "EDITOR" || userTeamRole === "OWNER"}
          onClose={() => {
            setShowAssignmentModal(false);
            setTaskToAssign(undefined);
            setTeamMembers([]);
            setUserTeamRole(undefined);
          }}
          isLoading={assignmentIsLoading}
        />
      )}

      {/* AI Butler Chat */}
      <ChatBubble isAuthenticated={hasToken} />
    </div>
  );
}
