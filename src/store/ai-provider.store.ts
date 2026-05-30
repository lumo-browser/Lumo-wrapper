/**
 * AI Provider Store — BYOA (Bring Your Own Account)
 *
 * Security rules enforced here:
 *  - API keys are obfuscated before localStorage storage (not encrypted with a real key,
 *    but base64-encoded to avoid accidental plaintext exposure in dev tools).
 *    For production Electron builds, use the OS keychain (electron-keytar).
 *  - Passwords are NEVER stored.
 *  - We only store: providerId, obfuscated key, connectedAt, displayName, model.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderId, ProviderConnection, AIProviderState } from '../types/ai-provider.types';

const STORAGE_KEY = 'nova-ai-providers';

// Simple obfuscation — prevents casual plaintext exposure in DevTools
// Production should use electron-keytar or OS keychain
const obfuscate   = (s: string): string => btoa(s);
const deobfuscate = (s: string): string => { try { return atob(s); } catch { return ''; } };

interface AIProviderStore extends AIProviderState {
  // Actions
  connect: (providerId: ProviderId, apiKey: string, model: string) => void;
  disconnect: (providerId: ProviderId) => void;
  setActive: (providerId: ProviderId) => void;
  clearError: () => void;
  getActiveKey: () => string | null;
}

export const useAIProviderStore = create<AIProviderStore>()(
  persist(
    (set, get) => ({
      activeProvider: null,
      connections: {} as Record<ProviderId, ProviderConnection>,
      status: 'disconnected',
      error: null,

      connect: (providerId, apiKey, model) => {
        const trimmedKey = apiKey.trim();

        if (!trimmedKey || trimmedKey.length < 10) {
          set({ error: 'API key appears too short. Please check and try again.', status: 'error' });
          return;
        }

        const connection: ProviderConnection = {
          providerId,
          encryptedKey: obfuscate(trimmedKey),
          connectedAt: new Date().toISOString(),
          displayName: providerId.charAt(0).toUpperCase() + providerId.slice(1),
          model,
        };

        set((state) => ({
          connections: { ...state.connections, [providerId]: connection },
          activeProvider: connection,
          status: 'connected',
          error: null,
        }));
      },

      disconnect: (providerId) => {
        set((state) => {
          const next = { ...state.connections };
          delete next[providerId];
          const isActive = state.activeProvider?.providerId === providerId;
          const remaining = Object.values(next);
          return {
            connections: next,
            activeProvider: isActive ? (remaining[0] ?? null) : state.activeProvider,
            status: remaining.length === 0 ? 'disconnected' : 'connected',
          };
        });
      },

      setActive: (providerId) => {
        const conn = get().connections[providerId];
        if (conn) set({ activeProvider: conn, status: 'connected' });
      },

      clearError: () => set({ error: null }),

      /** Returns the live API key for the active provider (never stored in state) */
      getActiveKey: () => {
        const active = get().activeProvider;
        if (!active) return null;
        return deobfuscate(active.encryptedKey);
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist the minimum: connections + activeProvider id
      partialize: (state) => ({
        connections: state.connections,
        activeProvider: state.activeProvider,
      }),
    }
  )
);
