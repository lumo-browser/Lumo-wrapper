/**
 * Electron preload script
 * Provides secure IPC bridge between renderer and main process,
 * plus Phase 1 security monitoring hooks (DOM mutations, API proxies, Wasm detection).
 */

import { contextBridge, ipcRenderer } from 'electron';

// ── Security Monitor Helpers ──────────────────────────────────────────────────

/**
 * Send a security event to the main process for relay to the UI.
 */
function reportSecurityEvent(
  type: 'dom_mutation' | 'browser_api' | 'wasm_exec' | 'file_io' | 'permission_request' | 'user_event',
  details: string,
  source?: string,
  suspicious?: boolean
): void {
  ipcRenderer.send('lumo:security-event-from-preload', {
    type,
    details,
    timestamp: new Date().toISOString(),
    source: source || window.location?.href || 'preload',
    suspicious: suspicious || false,
  });
}

// ── Phase 1 Hook: Browser API Proxy (Clipboard) ──────────────────────────────

function hookBrowserAPIs(): void {
  // Only hook if navigator.clipboard exists (secure contexts)
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    const originalReadText = navigator.clipboard.readText.bind(navigator.clipboard);
    const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);

    navigator.clipboard.readText = async function (): Promise<string> {
      reportSecurityEvent(
        'browser_api',
        'Clipboard readText() accessed by page script',
        window.location?.href,
        true // clipboard reads from scripts are always suspicious
      );
      return originalReadText();
    };

    navigator.clipboard.writeText = async function (data: string): Promise<void> {
      const preview = data.length > 60 ? data.substring(0, 60) + '...' : data;
      reportSecurityEvent(
        'browser_api',
        `Clipboard writeText() called — content: "${preview}"`,
        window.location?.href,
        false
      );
      return originalWriteText(data);
    };
  }
}

// ── Phase 1 Hook: WebAssembly Execution Monitor ──────────────────────────────

function monitorWasmExecution(): void {
  if (typeof WebAssembly !== 'undefined') {
    const originalInstantiate = WebAssembly.instantiate.bind(WebAssembly);
    const originalInstantiateStreaming = WebAssembly.instantiateStreaming?.bind(WebAssembly);

    WebAssembly.instantiate = async function (
      bufferSource: BufferSource | WebAssembly.Module,
      importObject?: WebAssembly.Imports
    ): Promise<WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance> {
      const size = bufferSource instanceof ArrayBuffer
        ? `${(bufferSource.byteLength / 1024).toFixed(1)}KB`
        : 'Module';
      reportSecurityEvent(
        'wasm_exec',
        `WebAssembly.instantiate() called — binary size: ${size}`,
        window.location?.href,
        true // wasm instantiation is always worth flagging
      );
      return originalInstantiate(bufferSource, importObject);
    } as typeof WebAssembly.instantiate;

    if (originalInstantiateStreaming) {
      WebAssembly.instantiateStreaming = async function (
        source: Response | PromiseLike<Response>,
        importObject?: WebAssembly.Imports
      ): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
        reportSecurityEvent(
          'wasm_exec',
          'WebAssembly.instantiateStreaming() called — streaming binary compilation',
          window.location?.href,
          true
        );
        return originalInstantiateStreaming(source, importObject);
      };
    }
  }
}

// ── Phase 1 Hook: DOM Mutation Observer ───────────────────────────────────────

function observeDOMMutations(): void {
  // Wait for DOM to be ready
  const attach = (): void => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;

          const tag = node.tagName?.toLowerCase();

          if (tag === 'script') {
            const src = (node as HTMLScriptElement).src;
            reportSecurityEvent(
              'dom_mutation',
              src
                ? `Dynamic <script> injected: ${src}`
                : `Inline <script> injected (${(node.textContent || '').length} chars)`,
              window.location?.href,
              true
            );
          }

          if (tag === 'iframe') {
            const src = (node as HTMLIFrameElement).src;
            const isHidden =
              node.style.display === 'none' ||
              node.style.visibility === 'hidden' ||
              node.style.opacity === '0' ||
              (node.offsetWidth === 0 && node.offsetHeight === 0);

            reportSecurityEvent(
              'dom_mutation',
              `Dynamic <iframe> injected: ${src || '(no src)'}${isHidden ? ' [HIDDEN]' : ''}`,
              window.location?.href,
              isHidden // hidden iframes are suspicious
            );
          }

          // Also check if the element contains deeply nested scripts/iframes
          const innerScripts = node.querySelectorAll?.('script, iframe');
          if (innerScripts && innerScripts.length > 0) {
            reportSecurityEvent(
              'dom_mutation',
              `Container element <${tag}> injected with ${innerScripts.length} nested script/iframe element(s)`,
              window.location?.href,
              true
            );
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
}

// ── Initialize all Phase 1 hooks ─────────────────────────────────────────────
hookBrowserAPIs();
monitorWasmExecution();
observeDOMMutations();

// ── Context Bridge ───────────────────────────────────────────────────────────
// Expose only what's necessary through the bridge
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

  // App info
  appVersion: (): string => '0.2.0',

  // Platform info
  platform: process.platform,
  arch: process.arch,
});

