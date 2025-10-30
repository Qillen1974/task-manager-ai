// Admin analytics utilities
import { User } from "./auth";

export interface UserStats {
  userId: string;
  email: string;
  createdAt: string;
  projectCount: number;
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  lastActivity?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  averageTasksPerUser: number;
  averageCompletionRate: number;
}

export function getUserStats(users: User[]): UserStats[] {
  return users.map((user) => {
    const projectKey = `${user.id}_taskmaster_projects`;
    const tasksKey = `${user.id}_taskmaster_tasks`;

    const projectsJson = localStorage.getItem(projectKey);
    const tasksJson = localStorage.getItem(tasksKey);

    const projects = projectsJson ? JSON.parse(projectsJson) : [];
    const tasks = tasksJson ? JSON.parse(tasksJson) : [];

    const completedTasks = tasks.filter((t: any) => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;

    // Find last activity timestamp
    const allTimestamps = [
      ...projects.map((p: any) => new Date(p.updatedAt).getTime()),
      ...tasks.map((t: any) => new Date(t.updatedAt).getTime()),
    ];
    const lastActivity = allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)).toISOString() : undefined;

    return {
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt,
      projectCount: projects.length,
      taskCount: tasks.length,
      completedTaskCount: completedTasks,
      pendingTaskCount: pendingTasks,
      lastActivity,
    };
  });
}

export function getSystemStats(users: User[]): SystemStats {
  const userStats = getUserStats(users);

  const totalProjects = userStats.reduce((sum, u) => sum + u.projectCount, 0);
  const totalTasks = userStats.reduce((sum, u) => sum + u.taskCount, 0);
  const completedTasks = userStats.reduce((sum, u) => sum + u.completedTaskCount, 0);
  const pendingTasks = userStats.reduce((sum, u) => sum + u.pendingTaskCount, 0);

  return {
    totalUsers: users.length,
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    averageTasksPerUser: users.length > 0 ? totalTasks / users.length : 0,
    averageCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
  };
}

export function getRecentUsers(users: User[], limit: number = 5): User[] {
  return [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getMostActiveUsers(users: User[], limit: number = 5): UserStats[] {
  const stats = getUserStats(users);
  return stats
    .sort((a, b) => (b.taskCount + b.projectCount) - (a.taskCount + a.projectCount))
    .slice(0, limit);
}

export function getUserGrowthData(users: User[]): Array<{ date: string; count: number }> {
  // Group users by creation date
  const grouped: Record<string, number> = {};

  users.forEach((user) => {
    const date = new Date(user.createdAt).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });

  // Sort by date and calculate cumulative
  const sorted = Object.entries(grouped)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .reduce((acc: Array<{ date: string; count: number }>, [date, count], idx) => {
      const prevCount = idx > 0 ? acc[idx - 1].count : 0;
      acc.push({ date, count: prevCount + count });
      return acc;
    }, []);

  return sorted;
}

export function getActivityReport(users: User[]): { date: string; activeUsers: number }[] {
  const grouped: Record<string, Set<string>> = {};

  users.forEach((user) => {
    const projectKey = `${user.id}_taskmaster_projects`;
    const tasksKey = `${user.id}_taskmaster_tasks`;

    const projectsJson = localStorage.getItem(projectKey);
    const tasksJson = localStorage.getItem(tasksKey);

    const projects = projectsJson ? JSON.parse(projectsJson) : [];
    const tasks = tasksJson ? JSON.parse(tasksJson) : [];

    const allTimestamps = [
      ...projects.map((p: any) => new Date(p.updatedAt).toISOString().split('T')[0]),
      ...tasks.map((t: any) => new Date(t.updatedAt).toISOString().split('T')[0]),
    ];

    allTimestamps.forEach((date) => {
      if (!grouped[date]) grouped[date] = new Set();
      grouped[date].add(user.id);
    });
  });

  return Object.entries(grouped)
    .map(([date, userIds]) => ({
      date,
      activeUsers: userIds.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days
}
