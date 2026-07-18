import { useEffect, useRef } from 'react';
import { BrowserTab } from '../ui/components/BrowserTabBar';

export interface AppShortcutHandlers {
  activeTab: BrowserTab | null;
  addTab: (url?: string) => void;
  closeTab: (id: string) => void;
  navigate: (url: string) => void;
  handleRefresh: () => void;
  handleGoBack: () => void;
  handleGoForward: () => void;
  handleStop: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePrint: () => void;
  groupTabsWithAI: () => void;
  toggleBookmark: () => void;
  setRecentlyClosedTabs: React.Dispatch<React.SetStateAction<BrowserTab[]>>;
  setTabs: React.Dispatch<React.SetStateAction<BrowserTab[]>>;
  currentUrl: string;
  setShowAI: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAgent: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useAppShortcuts(handlers: AppShortcutHandlers) {
  const handlersRef = useRef(handlers);
  
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;
      
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        if (e.shiftKey) {
          // Reopen closed tab (Ctrl+Shift+T)
          e.preventDefault();
          h.setRecentlyClosedTabs(prev => {
            if (prev.length === 0) return prev;
            const toRestore = prev[prev.length - 1];
            const remaining = prev.slice(0, -1);
            h.setTabs(ts => [...ts.map(t => ({ ...t, isActive: false })), { ...toRestore, isActive: true, id: `tab-${Date.now()}` }]);
            return remaining;
          });
        } else {
          e.preventDefault();
          h.addTab();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (h.activeTab) h.closeTab(h.activeTab.id);
      } else if (e.ctrlKey && e.key === 'Tab') {
        // Cycle tabs (Ctrl+Tab / Ctrl+Shift+Tab)
        e.preventDefault();
        h.setTabs(prev => {
          const idx = prev.findIndex(t => t.isActive);
          const nextIdx = e.shiftKey ? (idx - 1 + prev.length) % prev.length : (idx + 1) % prev.length;
          return prev.map((t, i) => ({ ...t, isActive: i === nextIdx }));
        });
      } else if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        // Jump to tab (Ctrl+1...9)
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        h.setTabs(prev => {
          if (!prev[idx]) return prev;
          return prev.map((t, i) => ({ ...t, isActive: i === idx }));
        });
      } else if ((e.ctrlKey && e.key.toLowerCase() === 'l') || (e.altKey && e.key.toLowerCase() === 'd')) {
        // Focus address bar
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('lumo:focus-address-bar'));
      } else if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        // Find in page
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('lumo:find-in-page'));
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        // Incognito (Coming soon alert)
        e.preventDefault();
        alert('Incognito mode is coming in the next Lumo update!');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        h.navigate('lumo://settings');
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        h.setShowAI((v) => !v);
        h.setShowAgent(false);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        h.setShowAgent(v => !v);
        h.setShowAI(false);
      } else if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        h.handleRefresh();
      } else if (e.key === 'Escape') {
        h.handleStop();
      } else if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        h.handleZoomIn();
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        h.handleZoomOut();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        h.navigate('lumo://bookmarks');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        h.navigate('lumo://history');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        e.stopPropagation();
        // Toggle downloads page (Chrome-style Ctrl+J behaviour)
        if (h.currentUrl === 'lumo://downloads') {
          h.handleGoBack();
        } else {
          h.navigate('lumo://downloads');
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        h.handlePrint();
      } else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        h.navigate('lumo://settings');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        h.navigate('lumo://settings');
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        h.groupTabsWithAI();
      } else if (e.altKey && e.key.toLowerCase() === 'home') {
        e.preventDefault();
        h.navigate('lumo://newtab');
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        h.handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        h.handleGoForward();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        h.toggleBookmark();
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const wv = h.activeTab ? document.getElementById(`webview-${h.activeTab.id}`) as any : null;
        if (wv?.getURL && wv?.downloadURL) {
          wv.downloadURL(wv.getURL());
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        if (h.activeTab?.url && !h.activeTab.url.startsWith('lumo://')) {
          h.addTab('view-source:' + h.activeTab.url);
        }
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        (window as any).electron?.send?.('lumo:toggle-devtools');
      } else if (e.key === 'F11') {
        e.preventDefault();
        const el = document.documentElement;
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          el.requestFullscreen();
        }
      }
    };

    // Use capture phase so Lumo intercepts Ctrl+J/B/H/etc BEFORE the
    // webview or OS (e.g. Brave/Chrome) can steal the shortcut.
    window.addEventListener('keydown', handleKeyDown, true);

    // Handlers for custom events dispatched by the global shortcut IPC listener
    const onGoBack   = () => handlersRef.current.handleGoBack();
    const onGoForward = () => handlersRef.current.handleGoForward();
    const onOpenPage = (e: Event) => handlersRef.current.navigate((e as CustomEvent).detail as string);
    const onCloseTab = () => { if (handlersRef.current.activeTab) handlersRef.current.closeTab(handlersRef.current.activeTab.id); };
    const onNewTab   = () => handlersRef.current.addTab();
    window.addEventListener('lumo:go-back',   onGoBack);
    window.addEventListener('lumo:go-forward', onGoForward);
    window.addEventListener('lumo:open-page', onOpenPage);
    window.addEventListener('lumo:close-tab', onCloseTab);
    window.addEventListener('lumo:new-tab',   onNewTab);

    return () => {
      window.removeEventListener('keydown',        handleKeyDown, true);
      window.removeEventListener('lumo:go-back',   onGoBack);
      window.removeEventListener('lumo:go-forward', onGoForward);
      window.removeEventListener('lumo:open-page', onOpenPage);
      window.removeEventListener('lumo:close-tab', onCloseTab);
      window.removeEventListener('lumo:new-tab',   onNewTab);
    };
  }, []);
}
