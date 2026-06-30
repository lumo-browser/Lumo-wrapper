/**
 * Home Service
 * Fetches and manages home page data from backend API
 */

import { Logger } from '@utils/logger';
import type { RecentTask, QuickAction, AIProvider } from '../../types/home.types';
import { apiService } from '@services/api/api.service';

const logger = Logger.getInstance();
const SCOPE = 'HomeService';

export class HomeService {
  /**
   * Fetch recent tasks from backend API
   */
  static async getRecentTasks(): Promise<RecentTask[]> {
    try {
      logger.debug(SCOPE, 'Fetching recent tasks from API');
      const tasks = await apiService.getTaskList(10);
      logger.info(SCOPE, `Fetched ${tasks.length} tasks`);
      return tasks as RecentTask[];
    } catch (error) {
      logger.error(SCOPE, 'Failed to fetch recent tasks, using fallback data', error);
      // Fallback to mock data if API is unavailable
      return HomeService.getMockRecentTasks();
    }
  }

  /**
   * Get suggested actions from backend or use defaults
   */
  static async getSuggestedActions(): Promise<QuickAction[]> {
    try {
      logger.debug(SCOPE, 'Fetching suggested actions from API');
      const actions = await apiService.client.get<{ data: QuickAction[] }>('/home/data');
      logger.info(SCOPE, `Fetched ${actions.data.data.length} actions`);
      return actions.data.data;
    } catch (error) {
      logger.warn(SCOPE, 'Failed to fetch actions from API, using defaults');
      return HomeService.getDefaultActions();
    }
  }

  /**
   * Get connected AI providers from backend
   */
  static async getAIProviders(): Promise<AIProvider[]> {
    try {
      logger.debug(SCOPE, 'Fetching AI providers from API');
      const providers = await apiService.getProviders();
      logger.info(SCOPE, `Fetched ${providers.length} providers`);
      return providers;
    } catch (error) {
      logger.error(SCOPE, 'Failed to fetch AI providers, using mock data', error);
      return HomeService.getMockAIProviders();
    }
  }

  /**
   * Get system status from backend health check
   */
  static async getSystemStatus(): Promise<'ready' | 'busy' | 'error'> {
    try {
      logger.debug(SCOPE, 'Checking system status');
      await apiService.healthCheck();
      return 'ready';
    } catch (error) {
      logger.warn(SCOPE, 'System health check failed');
      return 'error';
    }
  }

  /**
   * Execute a quick action via API
   */
  static async executeAction(actionId: string): Promise<void> {
    try {
      logger.info(SCOPE, `Executing action: ${actionId}`);
      await apiService.executeAction(actionId);
    } catch (error) {
      logger.error(SCOPE, `Failed to execute action: ${actionId}`, error);
      throw error;
    }
  }

  /**
   * Fallback mock data for recent tasks
   */
  private static getMockRecentTasks(): RecentTask[] {
    return [
      {
        id: '1',
        goal: 'Research TypeScript best practices',
        status: 'completed',
        timestamp: new Date(Date.now() - 3600000),
        result: 'Found 15 relevant articles',
        confidence: 0.92,
      },
      {
        id: '2',
        goal: 'Compare React state management libraries',
        status: 'completed',
        timestamp: new Date(Date.now() - 7200000),
        result: 'Evaluated Zustand, Jotai, and Valtio',
        confidence: 0.88,
      },
    ];
  }

  /**
   * Default suggested actions
   */
  private static getDefaultActions(): QuickAction[] {
    return [
      {
        id: 'research-company',
        title: 'Research a Company',
        description: 'Deep dive into company financials, news, and market position',
        icon: 'building-2',
        category: 'research',
        action: () => {
          logger.info(SCOPE, 'User clicked: Research Company');
        },
        tags: ['business', 'research', 'market'],
      },
      {
        id: 'find-product',
        title: 'Find Best Product',
        description: 'Search, compare, and find the best product matching your criteria',
        icon: 'shopping-bag',
        category: 'research',
        action: () => {
          logger.info(SCOPE, 'User clicked: Find Product');
        },
        tags: ['shopping', 'comparison', 'research'],
      },
      {
        id: 'summarize-content',
        title: 'Summarize Content',
        description: 'Extract key points from multiple web pages',
        icon: 'file-text',
        category: 'productivity',
        action: () => {
          logger.info(SCOPE, 'User clicked: Summarize');
        },
        tags: ['reading', 'summary', 'productivity'],
      },
      {
        id: 'compare-options',
        title: 'Compare Options',
        description: 'Side-by-side comparison of products, services, or ideas',
        icon: 'scale',
        category: 'productivity',
        action: () => {
          logger.info(SCOPE, 'User clicked: Compare');
        },
        tags: ['comparison', 'analysis', 'decision'],
      },
      {
        id: 'automate-workflow',
        title: 'Automate Task',
        description: 'Create a workflow to automate repetitive web tasks',
        icon: 'cog',
        category: 'automation',
        action: () => {
          logger.info(SCOPE, 'User clicked: Automate');
        },
        tags: ['automation', 'workflow', 'productivity'],
      },
      {
        id: 'track-changes',
        title: 'Monitor Website',
        description: 'Track changes on websites and get notifications',
        icon: 'eye',
        category: 'tools',
        action: () => {
          logger.info(SCOPE, 'User clicked: Monitor');
        },
        tags: ['monitoring', 'tracking', 'alerts'],
      },
    ];
  }

  /**
   * Mock AI providers for fallback
   */
  private static getMockAIProviders(): AIProvider[] {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        status: 'connected',
        model: 'GPT-4',
        lastUsed: new Date(Date.now() - 900000),
      },
      {
        id: 'claude',
        name: 'Claude',
        status: 'connected',
        model: 'Claude 3 Opus',
        lastUsed: new Date(Date.now() - 1800000),
      },
      {
        id: 'gemini',
        name: 'Gemini',
        status: 'disconnected',
      },
    ];
  }
}
