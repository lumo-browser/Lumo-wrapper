import React from 'react';

declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void;
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
