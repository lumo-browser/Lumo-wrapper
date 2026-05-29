/**
 * Test setup and configuration
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock electron module
vi.mock('electron', () => ({
  app: {
    getName: () => 'Nova Browser',
    getVersion: () => '0.1.0',
  },
  ipcRenderer: {
    invoke: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
