/**
 * Security Monitor — Phase 1: The Monitor Stage
 * 
 * Attaches real-time interception hooks to Electron sessions and relays
 * structured SecurityEvent payloads to the renderer process over IPC.
 * 
 * This module is passive — it observes and reports, but does NOT block.
 * Blocking is handled separately in Phase 3 (Mitigate).
 */

import { ipcMain, BrowserWindow } from 'electron';

// ── Types (mirrored from src/types/electron.d.ts) ─────────────────────────────
interface SecurityEvent {
  type: 'network_request' | 'dom_mutation' | 'browser_api' | 'wasm_exec' | 'file_io' | 'permission_request' | 'user_event';
  details: string;
  timestamp: string;
  source?: string;
  suspicious?: boolean;
}

// ── State ─────────────────────────────────────────────────────────────────────
let monitorEnabled = true;

// Rate-limit: don't flood the renderer with events faster than it can process
const THROTTLE_INTERVAL_MS = 100;
let lastSendTimestamp = 0;
const eventQueue: SecurityEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

/**
 * Send a security event to the active renderer window.
 * Events are batched and rate-limited to avoid IPC flooding.
 */
function emitSecurityEvent(win: BrowserWindow | null, event: SecurityEvent): void {
  if (!monitorEnabled || !win || win.isDestroyed()) return;

  eventQueue.push(event);

  const now = Date.now();
  if (now - lastSendTimestamp >= THROTTLE_INTERVAL_MS) {
    flushEvents(win);
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushEvents(win);
    }, THROTTLE_INTERVAL_MS);
  }
}

function flushEvents(win: BrowserWindow | null): void {
  if (!win || win.isDestroyed() || eventQueue.length === 0) return;

  // Send all queued events in a batch
  for (const event of eventQueue) {
    win.webContents.send('lumo:security-event', event);
  }
  eventQueue.length = 0;
  lastSendTimestamp = Date.now();
  flushTimer = null;
}

/**
 * Truncate a URL to a reasonable display length for log readability.
 */
function truncateUrl(url: string, maxLen = 120): string {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen - 3) + '...';
}

/**
 * Classify a network request by its resource type for human-readable logging.
 */
function classifyResourceType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.match(/\.(js|mjs|cjs)(\?|$)/)) return 'Script';
  if (lower.match(/\.(css)(\?|$)/)) return 'Stylesheet';
  if (lower.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|avif)(\?|$)/)) return 'Image';
  if (lower.match(/\.(woff2?|ttf|otf|eot)(\?|$)/)) return 'Font';
  if (lower.match(/\.(mp4|webm|ogg|mp3|wav|flac)(\?|$)/)) return 'Media';
  if (lower.match(/\.(json|xml)(\?|$)/)) return 'Data';
  if (lower.match(/\.(wasm)(\?|$)/)) return 'WebAssembly';
  if (lower.includes('/api/') || lower.includes('/graphql')) return 'API';
  return 'Document';
}

// ── Network Request Monitor ───────────────────────────────────────────────────

/**
 * Attach network request monitoring to an Electron session.
 * Logs all outbound requests and emits SecurityEvent payloads.
 */
export function monitorNetworkRequests(
  sess: Electron.Session,
  getMainWindow: () => BrowserWindow | null,
  sessionLabel: string
): void {
  // Use onBeforeSendHeaders so we can see the final request details
  // without interfering with the existing adBlocker's onBeforeRequest
  sess.webRequest.onBeforeSendHeaders(
    { urls: ['<all_urls>'] },
    (details, callback) => {
      if (monitorEnabled) {
        const resourceType = classifyResourceType(details.url);

        // Skip noise: don't log every image/font/stylesheet to keep logs useful
        const isNoise = ['Image', 'Font', 'Stylesheet'].includes(resourceType);

        if (!isNoise) {
          const event: SecurityEvent = {
            type: 'network_request',
            details: `[${resourceType}] ${details.method} ${truncateUrl(details.url)}`,
            timestamp: new Date().toISOString(),
            source: sessionLabel,
          };

          emitSecurityEvent(getMainWindow(), event);
        }
      }

      // IMPORTANT: Always pass through — we are monitoring, not blocking
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  console.log(`[SecurityMonitor] Network monitoring attached to session: ${sessionLabel}`);
}

// ── IPC Handlers for Preload Bridge ───────────────────────────────────────────

/**
 * Register IPC handlers that the preload script uses to relay
 * DOM mutations, API hooks, and WebAssembly interceptions.
 */
export function registerSecurityIPC(getMainWindow: () => BrowserWindow | null): void {
  // Receive security events from the preload script (runs inside webview/renderer)
  ipcMain.on('lumo:security-event-from-preload', (_ipcEvent, payload: SecurityEvent) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      emitSecurityEvent(win, {
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      });
    }
  });

  // Toggle monitoring on/off from the frontend
  ipcMain.on('lumo:set-security-monitor', (_event, enabled: boolean) => {
    monitorEnabled = enabled;
    console.log(`[SecurityMonitor] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  });

  // Provide current monitor state to the frontend
  ipcMain.handle('lumo:get-security-monitor-state', () => {
    return { enabled: monitorEnabled };
  });

  console.log('[SecurityMonitor] IPC handlers registered');
}
