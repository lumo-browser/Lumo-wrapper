/**
 * Home Page Store (Zustand)
 */

import { create } from 'zustand';
import { HomeState, RecentTask, QuickAction, AIProvider } from '../types/home.types';

export interface HomeStore extends HomeState {
  setRecentTasks: (tasks: RecentTask[]) => void;
  addRecentTask: (task: RecentTask) => void;
  setSuggestedActions: (actions: QuickAction[]) => void;
  setAIProviders: (providers: AIProvider[]) => void;
  setSystemStatus: (status: 'ready' | 'busy' | 'error') => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: HomeState = {
  recentTasks: [],
  suggestedActions: [],
  aiProviders: [],
  systemStatus: 'ready',
  loading: false,
};

export const useHomeStore = create<HomeStore>((set) => ({
  ...initialState,

  setRecentTasks: (tasks: RecentTask[]) => set({ recentTasks: tasks }),

  addRecentTask: (task: RecentTask) =>
    set((state) => ({
      recentTasks: [task, ...state.recentTasks].slice(0, 10), // Keep last 10
    })),

  setSuggestedActions: (actions: QuickAction[]) =>
    set({ suggestedActions: actions }),

  setAIProviders: (providers: AIProvider[]) =>
    set({ aiProviders: providers }),

  setSystemStatus: (status: 'ready' | 'busy' | 'error') =>
    set({ systemStatus: status }),

  setLoading: (loading: boolean) => set({ loading }),

  reset: () => set(initialState),
}));
