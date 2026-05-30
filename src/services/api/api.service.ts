import axios, { AxiosInstance } from 'axios';
import { HomePageData, Task, AIProvider, QuickAction, Workflow } from '@types/home.types';
import { logger } from '@utils/logger';

interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.VITE_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor for auth token if available
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Home endpoints
  async getHomeData(): Promise<HomePageData> {
    try {
      const response = await this.client.get<ApiResponse<HomePageData>>('/home/data');
      logger.info('HomePageData fetched successfully');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to fetch home data:', error);
      throw error;
    }
  }

  async search(query: string): Promise<Task> {
    try {
      const response = await this.client.post<ApiResponse<Task>>('/home/search', { query });
      logger.info(`Search initiated: ${query}`);
      return response.data.data;
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  async executeAction(actionId: string): Promise<{ taskId: string; executed: boolean }> {
    try {
      const response = await this.client.post<ApiResponse<{ taskId: string; executed: boolean }>>(
        `/home/action/${actionId}/execute`
      );
      logger.info(`Action executed: ${actionId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Action execution failed:', error);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string): Promise<{ workflowId: string; executed: boolean }> {
    try {
      const response = await this.client.post<ApiResponse<{ workflowId: string; executed: boolean }>>(
        `/home/workflow/${workflowId}/execute`
      );
      logger.info(`Workflow executed: ${workflowId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Workflow execution failed:', error);
      throw error;
    }
  }

  // Task endpoints
  async getTaskList(limit: number = 10): Promise<Task[]> {
    try {
      const response = await this.client.get<ApiResponse<Task[]>>('/tasks', { params: { limit } });
      logger.info(`${response.data.data.length} tasks fetched`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to fetch tasks:', error);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await this.client.get<ApiResponse<Task>>(`/tasks/${taskId}`);
      logger.info(`Task fetched: ${taskId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to fetch task:', error);
      throw error;
    }
  }

  async createTask(goal: string, status: string = 'in-progress'): Promise<Task> {
    try {
      const response = await this.client.post<ApiResponse<Task>>('/tasks', { goal, status });
      logger.info(`Task created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(
    taskId: string,
    updates: Partial<{ status: string; result: string; confidence_score: number }>
  ): Promise<Partial<Task>> {
    try {
      const response = await this.client.patch<ApiResponse<Partial<Task>>>(`/tasks/${taskId}`, updates);
      logger.info(`Task updated: ${taskId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.client.delete(`/tasks/${taskId}`);
      logger.info(`Task deleted: ${taskId}`);
    } catch (error) {
      logger.error('Failed to delete task:', error);
      throw error;
    }
  }

  // Provider endpoints
  async getProviders(): Promise<AIProvider[]> {
    try {
      const response = await this.client.get<ApiResponse<AIProvider[]>>('/providers');
      logger.info(`${response.data.data.length} providers fetched`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to fetch providers:', error);
      throw error;
    }
  }

  async addProvider(name: string, provider_type: string, model?: string, api_key?: string): Promise<AIProvider> {
    try {
      const response = await this.client.post<ApiResponse<AIProvider>>('/providers', {
        name,
        provider_type,
        model,
        api_key,
      });
      logger.info(`Provider added: ${name}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to add provider:', error);
      throw error;
    }
  }

  async updateProviderStatus(
    providerId: string,
    status: 'connected' | 'disconnected' | 'error'
  ): Promise<{ providerId: string; status: string }> {
    try {
      const response = await this.client.patch<ApiResponse<{ providerId: string; status: string }>>(
        `/providers/${providerId}/status`,
        { status }
      );
      logger.info(`Provider status updated: ${providerId} -> ${status}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to update provider status:', error);
      throw error;
    }
  }

  async deleteProvider(providerId: string): Promise<void> {
    try {
      await this.client.delete(`/providers/${providerId}`);
      logger.info(`Provider deleted: ${providerId}`);
    } catch (error) {
      logger.error('Failed to delete provider:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get<{ status: string; timestamp: string }>('/health');
      return response.data;
    } catch (error) {
      logger.error('Health check failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
