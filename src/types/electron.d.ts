import React from 'react';

// ── Security Monitor Types ────────────────────────────────────────────────────
export type SecurityEventType =
  | 'network_request'
  | 'dom_mutation'
  | 'browser_api'
  | 'wasm_exec'
  | 'file_io'
  | 'permission_request'
  | 'user_event';

export interface SecurityEvent {
  /** Category of the intercepted event */
  type: SecurityEventType;
  /** Human-readable description of what happened */
  details: string;
  /** ISO timestamp of when the event was captured */
  timestamp: string;
  /** Optional URL or source that triggered the event */
  source?: string;
  /** Whether the event was flagged as suspicious by heuristics */
  suspicious?: boolean;
  /** Phase 2: Detection result attached by the analysis engine */
  detection?: DetectionResult;
  /** Phase 3: Whether the threat was actively blocked/mitigated */
  mitigated?: boolean;
}

// ── Phase 2: Detection Types ──────────────────────────────────────────────────
export type DetectionCategory =
  | 'phishing'
  | 'malware'
  | 'cryptominer'
  | 'data_theft'
  | 'injection'
  | 'safe';

export type DetectionAction = 'allow' | 'warn' | 'block';

export interface DetectionResult {
  /** Whether the event is considered safe */
  safe: boolean;
  /** Human-readable threat description (undefined if safe) */
  threat?: string;
  /** Confidence level 0-100 */
  confidence: number;
  /** Threat classification category */
  category: DetectionCategory;
  /** Recommended action for Phase 3 Mitigate stage */
  action?: DetectionAction;
}

export interface SecurityAlert {
  /** Unique alert identifier */
  id: string;
  /** The original security event that triggered this alert */
  event: SecurityEvent;
  /** The detection engine's analysis result */
  detection: DetectionResult;
  /** ISO timestamp of when the alert was created */
  timestamp: string;
  /** Whether the user has acknowledged/dismissed this alert */
  acknowledged: boolean;
}

declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void;
      /** Subscribe to real-time security monitor events from the backend */
      onSecurityEvent: (callback: (event: SecurityEvent) => void) => () => void;
    };
    _lumoDisposablePartition?: string;
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        allowpopups?: string;
        partition?: string;
        useragent?: string;
        ref?: React.RefObject<HTMLWebViewElement>;
      };
    }
  }
}

// Minimal interface for Electron's WebViewElement
export interface HTMLWebViewElement extends HTMLElement {
  setZoomLevel: (level: number) => void;
  getZoomLevel: (callback: (level: number) => void) => void;
  print: () => void;
  reload: () => void;
  stop: () => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}
