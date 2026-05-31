/**
 * Electron preload script
 * Provides secure IPC bridge between renderer and main process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose only what's necessary through the bridge
contextBridge.exposeInMainWorld('electron', {
  // IPC communication
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (channel.startsWith('nova:')) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  send: (channel: string, ...args: unknown[]): void => {
    if (channel.startsWith('nova:')) {
      ipcRenderer.send(channel, ...args);
    } else {
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    }
  },

  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void): (() => void) => {
    if (channel.startsWith('nova:')) {
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  // App info
  appVersion: (): string => '0.1.0',

  // Platform info
  platform: process.platform,
  arch: process.arch,
});
