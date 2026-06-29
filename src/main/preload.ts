/**
 * Electron preload script
 * Provides secure IPC bridge between renderer and main process,
 * plus Phase 1 security monitoring hooks (DOM mutations, API proxies, Wasm detection).
 */

import { contextBridge, ipcRenderer } from 'electron';
import path from 'path';
import { hookBrowserAPIs, monitorWasmExecution, observeDOMMutations } from './security-hooks';

// ── Initialize all Phase 1 hooks ─────────────────────────────────────────────
hookBrowserAPIs((payload) => {
  ipcRenderer.send('lumo:security-event-from-preload', payload);
});
monitorWasmExecution((payload) => {
  ipcRenderer.send('lumo:security-event-from-preload', payload);
});
observeDOMMutations((payload) => {
  ipcRenderer.send('lumo:security-event-from-preload', payload);
});

// ── Context Bridge ───────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('electron', {
  // IPC communication
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (channel.startsWith('lumo:')) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  send: (channel: string, ...args: unknown[]): void => {
    if (channel.startsWith('lumo:')) {
      ipcRenderer.send(channel, ...args);
    } else {
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    }
  },

  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void): (() => void) => {
    if (channel.startsWith('lumo:')) {
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  /**
   * Subscribe to real-time security events from the backend monitor.
   * Returns an unsubscribe function for cleanup.
   */
  onSecurityEvent: (callback: (event: any) => void): (() => void) => {
    const handler = (_ipcEvent: unknown, payload: any): void => {
      callback(payload);
    };
    ipcRenderer.on('lumo:security-event', handler);
    return () => {
      ipcRenderer.removeListener('lumo:security-event', handler);
    };
  },

  /**
   * Absolute file:// URL to the webview preload script.
   * Used by <webview> elements to enable security monitoring in guest pages.
   */
  webviewPreloadPath: `file://${path.join(__dirname, 'webview-preload.js')}`,

  // Zero-trust mode toggle
  setZeroTrustMode: (enabled: boolean): void => {
    ipcRenderer.send('lumo:set-zero-trust-mode', enabled);
  },
  getZeroTrustMode: (): Promise<boolean> => {
    return ipcRenderer.invoke('lumo:get-zero-trust-mode') as Promise<boolean>;
  },
  onZeroTrustModeChanged: (callback: (enabled: boolean) => void): (() => void) => {
    const handler = (_event: unknown, enabled: boolean) => callback(enabled);
    ipcRenderer.on('lumo:zero-trust-mode-changed', handler);
    return () => { ipcRenderer.removeListener('lumo:zero-trust-mode-changed', handler); };
  },
  monitorTabPartition: (partitionId: string): void => {
    ipcRenderer.send('lumo:monitor-tab-partition', partitionId);
  },
  monitorProfilePartition: (profileId: string): void => {
    ipcRenderer.send('lumo:monitor-profile-partition', profileId);
  },
  clearProfilePartition: (profileId: string): void => {
    ipcRenderer.send('lumo:clear-profile-partition', profileId);
  },

  // Password Vault
  vaultGetAll: (profileId: string): Promise<any[]> => {
    return ipcRenderer.invoke('lumo:vault-get-all', profileId) as Promise<any[]>;
  },
  vaultSave: (profileId: string, entry: any): Promise<any[]> => {
    return ipcRenderer.invoke('lumo:vault-save', { profileId, entry }) as Promise<any[]>;
  },
  vaultDelete: (profileId: string, id: string): Promise<any[]> => {
    return ipcRenderer.invoke('lumo:vault-delete', { profileId, id }) as Promise<any[]>;
  },

  // App info
  appVersion: (): string => '0.2.0',

  // Platform info
  platform: process.platform,
  arch: process.arch,
});
