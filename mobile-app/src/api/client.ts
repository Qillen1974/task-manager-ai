import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// IMPORTANT: Update this with your actual API URL
// Using Railway production URL for both dev and production
// This allows testing from anywhere (office, home, etc.)
export const API_BASE_URL = 'https://taskquadrant.io/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              const { token: newToken } = response.data;
              await SecureStore.setItemAsync('authToken', newToken);

              // Retry the original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              await SecureStore.deleteItemAsync('authToken');
              await SecureStore.deleteItemAsync('refreshToken');
              // TODO: Navigate to login screen
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    // Backend returns: { success: true, data: { user, tokens, subscription } }
    return response.data.data;
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    // Backend returns: { success: true, data: { user, tokens, subscription } }
    return response.data.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    // Backend returns: { success: true, data: user }
    return response.data.data;
  }

  async updateProfile(updates: { firstName?: string; lastName?: string; email?: string }) {
    const response = await this.client.patch('/auth/profile', updates);
    return response.data.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data.data;
  }

  async deleteAccount() {
    const response = await this.client.delete('/auth/account');
    return response.data.data;
  }

  // Task endpoints
  async getTasks() {
    const response = await this.client.get('/tasks');
    return response.data.data;
  }

  async getTask(id: string) {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data.data;
  }

  async createTask(task: any) {
    const response = await this.client.post('/tasks', task);
    return response.data.data;
  }

  async updateTask(id: string, task: any) {
    const response = await this.client.patch(`/tasks/${id}`, task);
    return response.data.data;
  }

  async deleteTask(id: string) {
    const response = await this.client.delete(`/tasks/${id}`);
    return response.data.data;
  }

  async completeTask(id: string) {
    const response = await this.client.patch(`/tasks/${id}`, { completed: true });
    return response.data.data;
  }

  // Project endpoints
  async getProjects() {
    const response = await this.client.get('/projects?includeChildren=true');
    return response.data.data;
  }

  async getProject(id: string) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data.data;
  }

  async createProject(project: any) {
    const response = await this.client.post('/projects', project);
    return response.data.data;
  }

  async updateProject(id: string, project: any) {
    const response = await this.client.patch(`/projects/${id}`, project);
    return response.data.data;
  }

  async deleteProject(id: string) {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data.data;
  }

  // Subscription endpoints
  async getCurrentSubscription() {
    const response = await this.client.get('/subscriptions/current');
    return response.data.data;
  }

  async getRecurringTaskCount() {
    const response = await this.client.get('/tasks');
    const tasks = response.data.data;
    // Count recurring task templates (isRecurring: true, parentTaskId: null)
    return tasks.filter((task: any) => task.isRecurring && !task.parentTaskId).length;
  }

  // Generic methods for additional endpoints
  async post(endpoint: string, data?: any) {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async get(endpoint: string) {
    const response = await this.client.get(endpoint);
    return response.data;
  }

  async patch(endpoint: string, data?: any) {
    const response = await this.client.patch(endpoint, data);
    return response.data;
  }

  async delete(endpoint: string) {
    const response = await this.client.delete(endpoint);
    return response.data;
  }
}

export const apiClient = new ApiClient();
