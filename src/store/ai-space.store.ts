import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProviderId, AISpaceTab } from '../types/ai-space.types';

interface AISpaceStore {
  tabs: AISpaceTab[];
  activeTabId: string | null;
  addTab: (providerId: AIProviderId, customUrl?: string, customName?: string) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  togglePin: (tabId: string) => void;
}

const DEFAULT_TABS: AISpaceTab[] = [
  { id: 'tab-nova-main', providerId: 'nova', isPinned: true },
];

export const useAISpaceStore = create<AISpaceStore>()(
  persist(
    (set, get) => ({
      tabs: DEFAULT_TABS,
      activeTabId: 'tab-nova-main',

      addTab: (providerId, customUrl, customName) => {
        const id = `ai-tab-${Date.now()}`;
        set((state) => ({
          tabs: [...state.tabs, { id, providerId, customUrl, customName, isPinned: false }],
          activeTabId: id,
        }));
      },

      removeTab: (tabId) => {
        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== tabId);
          let newActive = state.activeTabId;
          if (newActive === tabId) {
            newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
          }
          return { tabs: newTabs, activeTabId: newActive };
        });
      },

      setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
      },

      togglePin: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, isPinned: !t.isPinned } : t
          ),
        }));
      },
    }),
    {
      name: 'nova-ai-space',
    }
  )
);
