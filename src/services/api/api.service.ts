import axios, { AxiosInstance } from 'axios';
import type { HomePageData, Task, AIProvider } from '../../types/home.types';
import { logger } from '@utils/logger';

interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

class ApiService {
  client: AxiosInstance;

  constructor(baseURL: string = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001') {

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
      logger.info('ApiService', 'HomePageData fetched successfully');
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to fetch home data', error);
      throw error;
    }
  }

  async search(query: string): Promise<Task> {
    try {
      const response = await this.client.post<ApiResponse<Task>>('/home/search', { query });
      logger.info('ApiService', `Search initiated: ${query}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Search failed', error);
      throw error;
    }
  }

  async executeAction(actionId: string): Promise<{ taskId: string; executed: boolean }> {
    try {
      const response = await this.client.post<ApiResponse<{ taskId: string; executed: boolean }>>(
        `/home/action/${actionId}/execute`
      );
      logger.info('ApiService', `Action executed: ${actionId}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Action execution failed', error);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string): Promise<{ workflowId: string; executed: boolean }> {
    try {
      const response = await this.client.post<ApiResponse<{ workflowId: string; executed: boolean }>>(
        `/home/workflow/${workflowId}/execute`
      );
      logger.info('ApiService', `Workflow executed: ${workflowId}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Workflow execution failed', error);
      throw error;
    }
  }

  // Task endpoints
  async getTaskList(limit: number = 10): Promise<Task[]> {
    try {
      const response = await this.client.get<ApiResponse<Task[]>>('/tasks', { params: { limit } });
      logger.info('ApiService', `${response.data.data.length} tasks fetched`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to fetch tasks', error);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await this.client.get<ApiResponse<Task>>(`/tasks/${taskId}`);
      logger.info('ApiService', `Task fetched: ${taskId}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to fetch task', error);
      throw error;
    }
  }

  async createTask(goal: string, status: string = 'in-progress'): Promise<Task> {
    try {
      const response = await this.client.post<ApiResponse<Task>>('/tasks', { goal, status });
      logger.info('ApiService', `Task created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to create task', error);
      throw error;
    }
  }

  async updateTask(
    taskId: string,
    updates: Partial<{ status: string; result: string; confidence_score: number }>
  ): Promise<Partial<Task>> {
    try {
      const response = await this.client.patch<ApiResponse<Partial<Task>>>(`/tasks/${taskId}`, updates);
      logger.info('ApiService', `Task updated: ${taskId}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to update task', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.client.delete(`/tasks/${taskId}`);
      logger.info('ApiService', `Task deleted: ${taskId}`);
    } catch (error) {
      logger.error('ApiService', 'Failed to delete task', error);
      throw error;
    }
  }

  // Provider endpoints
  async getProviders(): Promise<AIProvider[]> {
    try {
      const response = await this.client.get<ApiResponse<AIProvider[]>>('/providers');
      logger.info('ApiService', `${response.data.data.length} providers fetched`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to fetch providers', error);
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
      logger.info('ApiService', `Provider added: ${name}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to add provider', error);
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
      logger.info('ApiService', `Provider status updated: ${providerId} -> ${status}`);
      return response.data.data;
    } catch (error) {
      logger.error('ApiService', 'Failed to update provider status', error);
      throw error;
    }
  }

  async deleteProvider(providerId: string): Promise<void> {
    try {
      await this.client.delete(`/providers/${providerId}`);
      logger.info('ApiService', `Provider deleted: ${providerId}`);
    } catch (error) {
      logger.error('ApiService', 'Failed to delete provider', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get<{ status: string; timestamp: string }>('/health');
      return response.data;
    } catch (error) {
      logger.error('ApiService', 'Health check failed', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
