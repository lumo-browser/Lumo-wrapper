/**
 * WebView preload script
 *
 * Loaded inside every <webview> guest page to provide Phase 1 security
 * monitoring hooks (DOM mutations, clipboard API, WebAssembly execution).
 *
 * Events are forwarded to the main process via IPC, where they enter the
 * Phase 2 detection pipeline (securityDetector.ts) and are relayed to the
 * SecurityDashboard in the main renderer.
 */

import { ipcRenderer } from 'electron';
import { hookBrowserAPIs, monitorWasmExecution, observeDOMMutations } from './security-hooks';

const reportEvent = (payload: any): void => {
  ipcRenderer.send('lumo:security-event-from-preload', {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  });
};

hookBrowserAPIs(reportEvent);
monitorWasmExecution(reportEvent);
observeDOMMutations(reportEvent);
