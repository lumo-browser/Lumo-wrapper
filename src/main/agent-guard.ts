/**
 * Agent Guard — validation layer for AI agent script injection
 *
 * Validates executeJavaScript calls from the agent before they reach the webview.
 * In zero-trust mode, blocks scripts that access Electron internals or use
 * dangerous patterns. In normal mode, logs violations.
 */

import { isZeroTrustMode } from './ipc-guard';

const LOG_PREFIX = '[AgentGuard]';

// Patterns that are always blocked (electron/node internals)
const BLOCKED_PATTERNS: RegExp[] = [
  /require\s*\(/,
  /process\s*\./,
  /__dirname/,
  /__filename/,
  /global\s*\./,
  /window\.electron/,
  /window\.require\s*\(/,
  /ipcRenderer/,
  /contextBridge/,
  /node:\w+/,
  /electron\s*\./,
  /remote\s*\./,
];

// Patterns that raise suspicion but are not always blocked
const SUSPICIOUS_PATTERNS: RegExp[] = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /document\.write\s*\(/,
  /atob\s*\(/,
  /innerHTML\s*=/,
  /outerHTML\s*=/,
  /insertAdjacentHTML/,
];

// Rate limiter per webview: max N script injections per second
const RATE_LIMIT_WINDOW_MS = 1000;
const MAX_INJECTIONS_PER_WINDOW = 10;
const injectionCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(webviewId: string): boolean {
  const now = Date.now();
  const entry = injectionCounts.get(webviewId);

  if (!entry || now > entry.resetTime) {
    injectionCounts.set(webviewId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_INJECTIONS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export interface AgentGuardResult {
  allowed: boolean;
  reason?: string;
  blockedPattern?: string;
}

export function validateScript(script: string, webviewLabel?: string): AgentGuardResult {
  if (!script || script.trim().length === 0) {
    return { allowed: false, reason: 'Empty script' };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(script)) {
      const msg = `Blocked pattern: ${pattern.source}`;
      console.warn(`${LOG_PREFIX} 🚫 ${msg} ${webviewLabel ? `[${webviewLabel}]` : ''}`);
      return { allowed: false, reason: msg, blockedPattern: pattern.source };
    }
  }

  if (isZeroTrustMode()) {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(script)) {
        const msg = `Suspicious pattern in ZT mode: ${pattern.source}`;
        console.warn(`${LOG_PREFIX} ⚠ ${msg} ${webviewLabel ? `[${webviewLabel}]` : ''}`);
        return { allowed: false, reason: msg, blockedPattern: pattern.source };
      }
    }
  }

  if (isZeroTrustMode() && script.length > 50000) {
    const msg = `Script too large for ZT mode: ${script.length} bytes (max 50000)`;
    console.warn(`${LOG_PREFIX} 🚫 ${msg}`);
    return { allowed: false, reason: msg };
  }

  return { allowed: true };
}

export function checkScriptInjectionRate(webviewId: string): AgentGuardResult {
  if (isZeroTrustMode() && !checkRateLimit(webviewId)) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: max ${MAX_INJECTIONS_PER_WINDOW} scripts per ${RATE_LIMIT_WINDOW_MS}ms`,
    };
  }
  return { allowed: true };
}
