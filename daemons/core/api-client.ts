import axios, { AxiosInstance, AxiosError } from "axios";
import { createLogger } from "./logger";

const log = createLogger("core.api-client");

// ── Response types (match lib/botResponseFormatter.ts) ──

export interface TaskQuadrantTask {
  id: string;
  title: string;
  description: string | null;
  quadrant: string | null;
  completed: boolean;
  completedAt: string | null;
  progress: number;
  status: string;
  startDate: string | null;
  startTime: string | null;
  dueDate: string | null;
  dueTime: string | null;
  projectId: string;
  projectName: string | null;
  assignedToBotId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  body: string;
  metadata: Record<string, unknown> | null;
  author: { type: string; id?: string; name?: string };
  createdAt: string;
  updatedAt: string;
}

export interface TaskArtifact {
  id: string;
  taskId: string;
  botId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface TaskDetail extends TaskQuadrantTask {
  comments: TaskComment[];
  artifacts: TaskArtifact[];
}

export interface BotInfo {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  projectIds: string[];
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code: string };
}

interface ListTasksParams {
  assignedToBot?: boolean;
  completed?: boolean;
  status?: string;
  limit?: number;
  cursor?: string;
}

interface ListTasksResponse {
  tasks: TaskQuadrantTask[];
  pagination: { limit: number; hasMore: boolean; nextCursor: string | null };
}

// ── Helper: sleep ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── API Client ──

export class TaskQuadrantClient {
  private http: AxiosInstance;
  private rateLimitRemaining: number = 60;
  private rateLimitResetAt: number = 0;

  constructor(baseUrl: string, apiKey: string) {
    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30_000,
    });

    // Read rate limit headers from every response
    this.http.interceptors.response.use((response) => {
      const remaining = response.headers["x-ratelimit-remaining"];
      const reset = response.headers["x-ratelimit-reset"];
      if (remaining !== undefined) this.rateLimitRemaining = parseInt(remaining, 10);
      if (reset !== undefined) this.rateLimitResetAt = parseInt(reset, 10);
      return response;
    });
  }

  // ── Core request method with retry logic ──

  private async request<T>(method: string, url: string, data?: unknown, attempt = 1): Promise<ApiResponse<T>> {
    const MAX_RETRIES = 3;

    try {
      const response = await this.http.request<ApiResponse<T>>({ method, url, data });
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<T>>;

      // Rate limited — wait and retry once
      if (axiosErr.response?.status === 429) {
        const waitMs = this.rateLimitResetAt > 0
          ? Math.max(0, this.rateLimitResetAt * 1000 - Date.now()) + 1000
          : 5000;
        log.warn("Rate limited, waiting", { waitMs, url });
        await sleep(waitMs);
        return this.request<T>(method, url, data, attempt);
      }

      // Server error — exponential backoff
      if (axiosErr.response && axiosErr.response.status >= 500 && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        log.warn("Server error, retrying", { status: axiosErr.response.status, delay, attempt, url });
        await sleep(delay);
        return this.request<T>(method, url, data, attempt + 1);
      }

      // Network error — exponential backoff
      if (!axiosErr.response && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        log.warn("Network error, retrying", { message: axiosErr.message, delay, attempt, url });
        await sleep(delay);
        return this.request<T>(method, url, data, attempt + 1);
      }

      // Return error response if available, otherwise throw
      if (axiosErr.response?.data) {
        return axiosErr.response.data;
      }

      throw err;
    }
  }

  // ── API Methods ──

  async verifyAuth(): Promise<ApiResponse<BotInfo>> {
    return this.request<BotInfo>("GET", "/api/v1/bot/me");
  }

  async listTasks(params: ListTasksParams = {}): Promise<ApiResponse<ListTasksResponse>> {
    const query = new URLSearchParams();
    if (params.assignedToBot !== undefined) query.set("assignedToBot", String(params.assignedToBot));
    if (params.completed !== undefined) query.set("completed", String(params.completed));
    if (params.status) query.set("status", params.status);
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);

    const qs = query.toString();
    return this.request<ListTasksResponse>("GET", `/api/v1/bot/tasks${qs ? `?${qs}` : ""}`);
  }

  async getTask(taskId: string): Promise<ApiResponse<TaskDetail>> {
    return this.request<TaskDetail>("GET", `/api/v1/bot/tasks/${taskId}`);
  }

  async updateTask(
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      quadrant: string;
      progress: number;
      completed: boolean;
      startDate: string;
      dueDate: string;
      status: string;
      assignedToBotId: string;
    }>
  ): Promise<ApiResponse<TaskQuadrantTask>> {
    return this.request<TaskQuadrantTask>("PATCH", `/api/v1/bot/tasks/${taskId}`, updates);
  }

  async addComment(
    taskId: string,
    body: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<TaskComment>> {
    return this.request<TaskComment>("POST", `/api/v1/bot/tasks/${taskId}/comments`, {
      body,
      ...(metadata ? { metadata } : {}),
    });
  }

  async uploadArtifact(
    taskId: string,
    fileName: string,
    mimeType: string,
    content: string
  ): Promise<ApiResponse<TaskArtifact>> {
    return this.request<TaskArtifact>("POST", `/api/v1/bot/tasks/${taskId}/artifacts`, {
      fileName,
      mimeType,
      content,
    });
  }

  async getArtifact(
    taskId: string,
    artifactId: string
  ): Promise<ApiResponse<TaskArtifact & { content: string }>> {
    return this.request<TaskArtifact & { content: string }>(
      "GET",
      `/api/v1/bot/tasks/${taskId}/artifacts/${artifactId}`
    );
  }

  async listArtifacts(taskId: string): Promise<ApiResponse<{ artifacts: TaskArtifact[] }>> {
    return this.request<{ artifacts: TaskArtifact[] }>(
      "GET",
      `/api/v1/bot/tasks/${taskId}/artifacts`
    );
  }
}
