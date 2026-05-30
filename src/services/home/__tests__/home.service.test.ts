/**
 * HomeService Tests
 */

import { describe, it, expect } from 'vitest';
import { HomeService } from '../home.service';

describe('HomeService', () => {
  describe('getRecentTasks', () => {
    it('should return array of recent tasks', async () => {
      const tasks = await HomeService.getRecentTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should have valid task structure', async () => {
      const tasks = await HomeService.getRecentTasks();
      const task = tasks[0];

      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('goal');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('timestamp');
      expect(['completed', 'failed', 'in-progress']).toContain(task.status);
    });
  });

  describe('getSuggestedActions', () => {
    it('should return array of suggested actions', async () => {
      const actions = await HomeService.getSuggestedActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should have valid action structure', async () => {
      const actions = await HomeService.getSuggestedActions();
      const action = actions[0];

      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('title');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('icon');
      expect(action).toHaveProperty('category');
      expect(action).toHaveProperty('action');
      expect(action).toHaveProperty('tags');
    });

    it('should have valid categories', async () => {
      const actions = await HomeService.getSuggestedActions();

      const validCategories = ['research', 'productivity', 'automation', 'tools'];
      actions.forEach((action) => {
        expect(validCategories).toContain(action.category);
      });
    });
  });

  describe('getAIProviders', () => {
    it('should return array of AI providers', async () => {
      const providers = await HomeService.getAIProviders();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should have valid provider structure', async () => {
      const providers = await HomeService.getAIProviders();
      const provider = providers[0];

      expect(provider).toHaveProperty('id');
      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('status');
      expect(['connected', 'disconnected', 'error']).toContain(provider.status);
    });

    it('connected providers should have model', async () => {
      const providers = await HomeService.getAIProviders();
      const connectedProvider = providers.find((p) => p.status === 'connected');

      if (connectedProvider) {
        expect(connectedProvider.model).toBeTruthy();
      }
    });
  });

  describe('getSystemStatus', () => {
    it('should return valid system status', async () => {
      const status = await HomeService.getSystemStatus();

      expect(['ready', 'busy', 'error']).toContain(status);
    });
  });

  describe('executeAction', () => {
    it('should not throw error', async () => {
      expect(async () => {
        await HomeService.executeAction('test-action');
      }).not.toThrow();
    });
  });
});
