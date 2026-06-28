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
import { hookBrowserAPIs, monitorWasmExecution, observeDOMMutations, hookNetworkAPIs, isBrowserAPIsHooked, isNetworkAPIsHooked } from './security-hooks';

const reportEvent = (payload: any): void => {
  ipcRenderer.send('lumo:security-event-from-preload', {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  });
};

hookBrowserAPIs(reportEvent);
monitorWasmExecution(reportEvent);
observeDOMMutations(reportEvent);
hookNetworkAPIs(reportEvent);

// ── Runtime Integrity Checks ─────────────────────────────────────────────────
// Periodically verify hooks are still in place and re-apply if tampered with.

const HOOK_CHECK_INTERVAL_MS = 5000;
const MAX_REHOOK_ATTEMPTS = 3;
let rehookAttempts = 0;

function verifyHooks(): void {
  const hooksIntact = isBrowserAPIsHooked() && isNetworkAPIsHooked();

  if (!hooksIntact) {
    rehookAttempts++;
    console.warn(`[Lumo WebView] Security hooks tampered — re-applying (attempt ${rehookAttempts}/${MAX_REHOOK_ATTEMPTS})`);

    if (rehookAttempts <= MAX_REHOOK_ATTEMPTS) {
      hookBrowserAPIs(reportEvent);
      monitorWasmExecution(reportEvent);
      hookNetworkAPIs(reportEvent);
    } else {
      console.error('[Lumo WebView] Security hooks repeatedly tampered — possible sandbox escape');
      ipcRenderer.send('lumo:security-event-from-preload', {
        type: 'browser_api',
        details: 'CRITICAL: Security hooks repeatedly tampered — possible sandbox escape',
        source: window.location?.href || 'webview',
        suspicious: true,
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    rehookAttempts = 0;
  }
}

// Check hook integrity periodically
setInterval(verifyHooks, HOOK_CHECK_INTERVAL_MS);
