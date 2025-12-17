import { create } from 'zustand';
import { apiClient } from '../api/client';
import { Task } from '../types';
import { notificationService } from '../services/notificationService';
import { persist } from './persist';
import { offlineService } from '../services/offlineService';
import { syncQueue } from '../services/syncQueue';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
}

// Generate temporary ID for offline tasks
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useTaskStore = create<TaskStore>(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,
      lastSync: null,

      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          // Only fetch from API if online
          if (offlineService.getOnlineStatus()) {
            const tasks = await apiClient.getTasks();
            set({ tasks, isLoading: false, lastSync: Date.now() });

            // Schedule notifications and update badge count
            await notificationService.scheduleRemindersForTasks(tasks);
            await notificationService.updateBadgeForTasks(tasks);
          } else {
            // Use cached tasks when offline
            set({ isLoading: false });
            console.log('Offline: Using cached tasks');
          }
        } catch (error: any) {
          console.error('Failed to fetch tasks:', error);
          set({ error: error.message, isLoading: false });
          // Keep cached tasks on error
        }
      },

      createTask: async (taskData: Partial<Task>) => {
        set({ isLoading: true, error: null });

        const isOnline = offlineService.getOnlineStatus();

        try {
          if (isOnline) {
            // Online: Create via API
            const newTask = await apiClient.createTask(taskData);
            const updatedTasks = [...get().tasks, newTask];
            set({ tasks: updatedTasks, isLoading: false });

            // Schedule notification for the new task
            if (newTask.dueDate && !newTask.completed) {
              await notificationService.scheduleTaskReminder(newTask);
            }
            await notificationService.updateBadgeForTasks(updatedTasks);

            return newTask;
          } else {
            // Offline: Create optimistically with temp ID
            const tempId = generateTempId();
            const optimisticTask: Task = {
              id: tempId,
              title: taskData.title || '',
              description: taskData.description || '',
              completed: false,
              priority: taskData.priority || 'not-urgent-not-important',
              dueDate: taskData.dueDate || null,
              startDate: taskData.startDate || null,
              projectId: taskData.projectId || null,
              userId: '', // Will be set by server
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              progress: taskData.progress || 0,
              tags: taskData.tags || [],
            };

            // Add to local state immediately
            const updatedTasks = [...get().tasks, optimisticTask];
            set({ tasks: updatedTasks, isLoading: false });

            // Queue for sync
            await syncQueue.addOperation('CREATE', 'task', taskData);

            return optimisticTask;
          }
        } catch (error: any) {
          console.error('Failed to create task:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateTask: async (id: string, updates: Partial<Task>) => {
        const isOnline = offlineService.getOnlineStatus();

        // Optimistic update
        const originalTasks = get().tasks;
        const updatedTasks = originalTasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        );
        set({ tasks: updatedTasks, isLoading: true, error: null });

        try {
          if (isOnline) {
            // Online: Update via API
            const updatedTask = await apiClient.updateTask(id, updates);
            const finalTasks = get().tasks.map((task) =>
              task.id === id ? { ...task, ...updatedTask } : task
            );
            set({ tasks: finalTasks, isLoading: false });

            // Reschedule all notifications when a task is updated
            await notificationService.scheduleRemindersForTasks(finalTasks);
            await notificationService.updateBadgeForTasks(finalTasks);
          } else {
            // Offline: Queue for sync
            set({ isLoading: false });
            await syncQueue.addOperation('UPDATE', 'task', { id, updates });
          }
        } catch (error: any) {
          console.error('Failed to update task:', error);
          // Revert optimistic update on error
          set({ tasks: originalTasks, error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteTask: async (id: string) => {
        const isOnline = offlineService.getOnlineStatus();

        // Optimistic delete
        const originalTasks = get().tasks;
        const updatedTasks = originalTasks.filter((task) => task.id !== id);
        set({ tasks: updatedTasks });

        try {
          if (isOnline) {
            // Online: Delete via API
            await apiClient.deleteTask(id);

            // Reschedule notifications after deleting a task
            await notificationService.scheduleRemindersForTasks(updatedTasks);
            await notificationService.updateBadgeForTasks(updatedTasks);
          } else {
            // Offline: Queue for sync
            await syncQueue.addOperation('DELETE', 'task', { id });
          }
        } catch (error: any) {
          console.error('Failed to delete task:', error);
          // Revert optimistic delete on error
          set({ tasks: originalTasks });
          throw error;
        }
      },

      toggleComplete: async (id: string) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const newCompleted = !task.completed;
        await get().updateTask(id, { completed: newCompleted });
      },
    }),
    {
      name: '@task_store',
      partialize: (state) => ({
        tasks: state.tasks,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Register sync callbacks
syncQueue.registerSyncCallback('task_CREATE', async (operation) => {
  const newTask = await apiClient.createTask(operation.data);
  const store = useTaskStore.getState();

  // Replace temp task with real task from server
  const updatedTasks = store.tasks.map((task) =>
    task.id.startsWith('temp_') ? newTask : task
  );

  useTaskStore.setState({ tasks: updatedTasks });
});

syncQueue.registerSyncCallback('task_UPDATE', async (operation) => {
  const { id, updates } = operation.data;
  await apiClient.updateTask(id, updates);

  // Fetch fresh data to ensure consistency
  const tasks = await apiClient.getTasks();
  useTaskStore.setState({ tasks });
});

syncQueue.registerSyncCallback('task_DELETE', async (operation) => {
  const { id } = operation.data;
  await apiClient.deleteTask(id);

  // Remove from local state
  const store = useTaskStore.getState();
  const updatedTasks = store.tasks.filter((task) => task.id !== id);
  useTaskStore.setState({ tasks: updatedTasks });
});
