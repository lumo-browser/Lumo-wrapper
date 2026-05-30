/**
 * Home Store Tests
 */

import { describe, it, expect } from 'vitest';
import { useHomeStore } from '../home.store';
import { RecentTask, QuickAction, AIProvider } from '@types/home.types';

describe('useHomeStore', () => {
  it('should have initial state', () => {
    const store = useHomeStore.getState();

    expect(store.recentTasks).toEqual([]);
    expect(store.suggestedActions).toEqual([]);
    expect(store.aiProviders).toEqual([]);
    expect(store.systemStatus).toBe('ready');
    expect(store.loading).toBe(false);
  });

  it('should set recent tasks', () => {
    const store = useHomeStore.getState();
    const mockTasks: RecentTask[] = [
      {
        id: '1',
        goal: 'Test goal',
        status: 'completed',
        timestamp: new Date(),
      },
    ];

    store.setRecentTasks(mockTasks);

    expect(useHomeStore.getState().recentTasks).toEqual(mockTasks);
  });

  it('should add recent task', () => {
    useHomeStore.getState().reset();
    const store = useHomeStore.getState();

    const newTask: RecentTask = {
      id: '1',
      goal: 'New task',
      status: 'in-progress',
      timestamp: new Date(),
    };

    store.addRecentTask(newTask);

    expect(useHomeStore.getState().recentTasks).toContainEqual(newTask);
  });

  it('should keep only last 10 recent tasks', () => {
    useHomeStore.getState().reset();
    const store = useHomeStore.getState();

    for (let i = 0; i < 15; i++) {
      store.addRecentTask({
        id: `${i}`,
        goal: `Task ${i}`,
        status: 'completed',
        timestamp: new Date(),
      });
    }

    expect(useHomeStore.getState().recentTasks.length).toBe(10);
  });

  it('should set suggested actions', () => {
    const store = useHomeStore.getState();
    const mockActions: QuickAction[] = [
      {
        id: 'action-1',
        title: 'Action',
        description: 'Description',
        icon: '🎯',
        category: 'research',
        action: () => {},
        tags: ['test'],
      },
    ];

    store.setSuggestedActions(mockActions);

    expect(useHomeStore.getState().suggestedActions).toEqual(mockActions);
  });

  it('should set AI providers', () => {
    const store = useHomeStore.getState();
    const mockProviders: AIProvider[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        status: 'connected',
      },
    ];

    store.setAIProviders(mockProviders);

    expect(useHomeStore.getState().aiProviders).toEqual(mockProviders);
  });

  it('should set system status', () => {
    const store = useHomeStore.getState();

    store.setSystemStatus('busy');
    expect(useHomeStore.getState().systemStatus).toBe('busy');

    store.setSystemStatus('error');
    expect(useHomeStore.getState().systemStatus).toBe('error');

    store.setSystemStatus('ready');
    expect(useHomeStore.getState().systemStatus).toBe('ready');
  });

  it('should set loading state', () => {
    const store = useHomeStore.getState();

    store.setLoading(true);
    expect(useHomeStore.getState().loading).toBe(true);

    store.setLoading(false);
    expect(useHomeStore.getState().loading).toBe(false);
  });

  it('should reset to initial state', () => {
    const store = useHomeStore.getState();

    store.setLoading(true);
    store.setSystemStatus('busy');
    store.setRecentTasks([
      {
        id: '1',
        goal: 'Test',
        status: 'completed',
        timestamp: new Date(),
      },
    ]);

    store.reset();

    const resetState = useHomeStore.getState();
    expect(resetState.loading).toBe(false);
    expect(resetState.systemStatus).toBe('ready');
    expect(resetState.recentTasks).toEqual([]);
  });
});
