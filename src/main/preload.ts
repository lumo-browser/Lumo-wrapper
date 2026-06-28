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

  // App info
  appVersion: (): string => '0.2.0',

  // Platform info
  platform: process.platform,
  arch: process.arch,
});
