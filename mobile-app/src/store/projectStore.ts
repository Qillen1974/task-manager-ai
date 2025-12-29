import { create } from 'zustand';
import { apiClient } from '../api/client';
import { Project } from '../types';
import { persist } from './persist';
import { offlineService } from '../services/offlineService';
import { syncQueue } from '../services/syncQueue';

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
  fetchProjects: () => Promise<void>;
  createProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useProjectStore = create<ProjectStore>(
  persist(
    (set, get) => ({
      projects: [],
      isLoading: false,
      error: null,
      lastSync: null,

      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          if (offlineService.getOnlineStatus()) {
            const projects = await apiClient.getProjects();
            set({ projects, isLoading: false, lastSync: Date.now() });
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      createProject: async (projectData: Partial<Project>) => {
        set({ isLoading: true, error: null });
        const isOnline = offlineService.getOnlineStatus();

        try {
          if (isOnline) {
            const newProject = await apiClient.createProject(projectData);
            set((state) => ({
              projects: [...state.projects, newProject],
              isLoading: false,
            }));
            return newProject;
          } else {
            // Offline: Create optimistically
            const tempId = generateTempId();
            const optimisticProject: Project = {
              id: tempId,
              name: projectData.name || '',
              description: projectData.description || '',
              color: projectData.color || '#3B82F6',
              teamId: projectData.teamId || null,
              parentProjectId: projectData.parentProjectId || null,
              projectLevel: projectData.projectLevel || 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            set((state) => ({
              projects: [...state.projects, optimisticProject],
              isLoading: false,
            }));

            await syncQueue.addOperation('CREATE', 'project', projectData);
            return optimisticProject;
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateProject: async (id: string, updates: Partial<Project>) => {
        const isOnline = offlineService.getOnlineStatus();
        const originalProjects = get().projects;

        // Optimistic update
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, ...updates } : project
          ),
          isLoading: true,
          error: null,
        }));

        try {
          if (isOnline) {
            const updatedProject = await apiClient.updateProject(id, updates);
            set((state) => ({
              projects: state.projects.map((project) =>
                project.id === id ? { ...project, ...updatedProject } : project
              ),
              isLoading: false,
            }));
          } else {
            set({ isLoading: false });
            await syncQueue.addOperation('UPDATE', 'project', { id, updates });
          }
        } catch (error: any) {
          set({ projects: originalProjects, error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteProject: async (id: string) => {
        const isOnline = offlineService.getOnlineStatus();
        const originalProjects = get().projects;

        // Optimistic delete
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
        }));

        try {
          if (isOnline) {
            await apiClient.deleteProject(id);
          } else {
            await syncQueue.addOperation('DELETE', 'project', { id });
          }
        } catch (error: any) {
          set({ projects: originalProjects });
          throw error;
        }
      },
    }),
    {
      name: '@project_store',
      partialize: (state) => ({
        projects: state.projects,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Register sync callbacks
syncQueue.registerSyncCallback('project_CREATE', async (operation) => {
  const newProject = await apiClient.createProject(operation.data);
  const store = useProjectStore.getState();

  const updatedProjects = store.projects.map((project) =>
    project.id.startsWith('temp_') ? newProject : project
  );

  useProjectStore.setState({ projects: updatedProjects });
});

syncQueue.registerSyncCallback('project_UPDATE', async (operation) => {
  const { id, updates } = operation.data;
  await apiClient.updateProject(id, updates);

  const projects = await apiClient.getProjects();
  useProjectStore.setState({ projects });
});

syncQueue.registerSyncCallback('project_DELETE', async (operation) => {
  const { id } = operation.data;
  await apiClient.deleteProject(id);

  const store = useProjectStore.getState();
  const updatedProjects = store.projects.filter((project) => project.id !== id);
  useProjectStore.setState({ projects: updatedProjects });
});
