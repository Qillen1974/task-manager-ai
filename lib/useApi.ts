import { useState, useCallback, useEffect } from 'react';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export function useApi() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  });

  // Listen for storage changes (from other components/tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        setAccessToken(e.newValue);
      } else if (e.key === 'refreshToken') {
        setRefreshToken(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        localStorage.setItem('accessToken', data.data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [refreshToken]);

  /**
   * Make API call with automatic token refresh
   */
  const call = useCallback(
    async <T = any>(
      method: string,
      endpoint: string,
      body?: any
    ): Promise<ApiResponse<T>> => {
      try {
        // Always get fresh token from localStorage to ensure we have the latest token
        const currentToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        const response = await fetch(`/api${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken && { 'Authorization': `Bearer ${currentToken}` }),
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data: ApiResponse<T> = await response.json();

        // If unauthorized, try to refresh token
        if (response.status === 401 && refreshToken) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // Get the updated token from localStorage (it was just set by refreshAccessToken)
            const updatedToken = localStorage.getItem('accessToken');
            if (updatedToken) {
              // Retry the original request with new token
              const retryResponse = await fetch(`/api${endpoint}`, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${updatedToken}`,
                },
                body: body ? JSON.stringify(body) : undefined,
              });
              return retryResponse.json();
            }
          }
        }

        return data;
      } catch (error) {
        console.error('API call failed:', error);
        return {
          success: false,
          error: {
            message: 'Network error',
            code: 'NETWORK_ERROR',
          },
        };
      }
    },
    [refreshToken, refreshAccessToken]
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await call<{
        user: { id: string; email: string; name: string };
        tokens: { accessToken: string; refreshToken: string };
      }>('POST', '/auth/register', { email, password, name });

      if (response.success && response.data) {
        setAccessToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('userEmail', response.data.user.email);
      }

      return response;
    },
    [call]
  );

  /**
   * Login user
   */
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await call<{
        user: { id: string; email: string; name: string };
        tokens: { accessToken: string; refreshToken: string };
      }>('POST', '/auth/login', { email, password });

      if (response.success && response.data) {
        setAccessToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('userEmail', response.data.user.email);
      }

      return response;
    },
    [call]
  );

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
  }, []);

  /**
   * Get current user profile
   */
  const getCurrentUser = useCallback(
    async () => call('GET', '/auth/me'),
    [call]
  );

  /**
   * Change user password
   */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string, confirmPassword: string) =>
      call('POST', '/auth/change-password', { currentPassword, newPassword, confirmPassword }),
    [call]
  );

  // Projects
  const getProjects = useCallback(
    async () => call('GET', '/projects'),
    [call]
  );

  const createProject = useCallback(
    async (name: string, color: string, description?: string) =>
      call('POST', '/projects', { name, color, description }),
    [call]
  );

  const updateProject = useCallback(
    async (id: string, name: string, color: string, description?: string) =>
      call('PATCH', `/projects/${id}`, { name, color, description }),
    [call]
  );

  const deleteProject = useCallback(
    async (id: string) => call('DELETE', `/projects/${id}`),
    [call]
  );

  // Tasks
  const getTasks = useCallback(
    async (projectId?: string, completed?: boolean) => {
      let endpoint = '/tasks';
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (completed !== undefined) params.append('completed', String(completed));
      if (params.toString()) endpoint += `?${params.toString()}`;
      return call('GET', endpoint);
    },
    [call]
  );

  const createTask = useCallback(
    async (data: {
      title: string;
      projectId: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      dueTime?: string;
    }) => call('POST', '/tasks', data),
    [call]
  );

  const updateTask = useCallback(
    async (
      id: string,
      data: {
        title?: string;
        description?: string;
        projectId?: string;
        priority?: string;
        dueDate?: string | null;
        dueTime?: string;
        completed?: boolean;
      }
    ) => call('PATCH', `/tasks/${id}`, data),
    [call]
  );

  const deleteTask = useCallback(
    async (id: string) => call('DELETE', `/tasks/${id}`),
    [call]
  );

  // Admin methods
  const upgradeUserSubscription = useCallback(
    async (email: string) =>
      call('POST', '/admin/upgrade-subscription', { email }),
    [call]
  );

  return {
    // State
    accessToken,
    refreshToken,
    isLoggedIn: !!accessToken,

    // Auth methods
    register,
    login,
    logout,
    getCurrentUser,
    changePassword,

    // Project methods
    getProjects,
    createProject,
    updateProject,
    deleteProject,

    // Task methods
    getTasks,
    createTask,
    updateTask,
    deleteTask,

    // Admin methods
    upgradeUserSubscription,

    // Utility methods
    call,
    refreshAccessToken,
  };
}
