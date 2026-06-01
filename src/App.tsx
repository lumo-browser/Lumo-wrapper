/**
 * Nova Browser — Root Application Shell
 *
 * Structure (top → bottom):
 *   [Tab Bar] — Chrome-style tabs
 *   [Toolbar] — Address bar + nav controls
 *   [Content + optional AI Sidebar] — flex row
 *
 * The AI is a sidebar accessed from the toolbar ✨ button.
 * There are NO developer panels, no admin dashboards, no "AI Planner" nav tabs.
 * Settings lives in the 3-dot menu.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@utils/logger';

import { BrowserTabBar, type BrowserTab } from '@ui/components/BrowserTabBar';
import { BrowserToolbar } from '@ui/components/BrowserToolbar';
import { ExtensionsPanel } from '@ui/components/ExtensionsPanel';
import { AccountModal, type UserAccount } from '@ui/components/AccountModal';
import { AISidebar } from '@ui/components/AISidebar';
import { AgentSidebar } from '@ui/components/AgentSidebar';
import { ComparePage } from '@ui/components/ComparePage';
import { BrowserMenu } from '@ui/components/BrowserMenu';
import { NewTabPage } from './pages/NewTabPage';
import { HistoryPage, type HistoryEntry } from './pages/HistoryPage';
import { BookmarksPage, type BookmarkEntry } from './pages/BookmarksPage';
import { SettingsPage, type BrowserSettings, SEARCH_ENGINES } from './pages/SettingsPage';
import { ExtensionsPage } from './pages/ExtensionsPage';

// ── Internal Pages ─────────────────────────────────────────────────────────
function InternalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#f8f9fa] dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 p-8">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      <div className="max-w-md text-center text-gray-500 dark:text-gray-400">
        {children}
      </div>
    </div>
  );
}

const SCOPE = 'App';

// ── WebviewTab — wraps <webview> with imperative navigation ──────────────────
interface WebviewTabProps {
  tabId: string;
  url: string;
  onTitleChange: (title: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onUrlChange: (url: string) => void;
  onNavStateChange: (canGoBack: boolean, canGoForward: boolean) => void;
}

function WebviewTab({ tabId, url, onTitleChange, onLoadingChange, onUrlChange, onNavStateChange }: WebviewTabProps) {
  const ref = useRef<any>(null);
  const initialUrl = useRef(url);

  // Wire up webview events once on mount
  useEffect(() => {
    const wv = ref.current;
    if (!wv) return;

    const onStartLoad = () => onLoadingChange(true);
    const onStopLoad  = () => onLoadingChange(false);
    const onTitleUpd  = (e: any) => onTitleChange(e.title || '');
    const onNavigated = (e: any) => {
      onUrlChange(e.url || '');
      onLoadingChange(false);
      if (wv && typeof wv.canGoBack === 'function') {
        onNavStateChange(wv.canGoBack(), wv.canGoForward());
      }
    };

    wv.addEventListener('did-start-loading', onStartLoad);
    wv.addEventListener('did-stop-loading',  onStopLoad);
    wv.addEventListener('page-title-updated', onTitleUpd);
    wv.addEventListener('did-navigate',      onNavigated);
    wv.addEventListener('did-navigate-in-page', onNavigated);

    return () => {
      wv.removeEventListener('did-start-loading', onStartLoad);
      wv.removeEventListener('did-stop-loading',  onStopLoad);
      wv.removeEventListener('page-title-updated', onTitleUpd);
      wv.removeEventListener('did-navigate',      onNavigated);
      wv.removeEventListener('did-navigate-in-page', onNavigated);
    };
  }, []);

  return (
    <webview
      ref={ref}
      id={`webview-${tabId}`}
      src={initialUrl.current || 'about:blank'}
      className="w-full h-full border-none bg-white"
      allowpopups="true"
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      partition="persist:nova-main"
    />
  );
}


// ── Tab helpers ────────────────────────────────────────────────────────────
let _tabId = 1;
const mkTab = (overrides: Partial<BrowserTab> = {}): BrowserTab => ({
  id: `tab-${++_tabId}`,
  title: 'New Tab',
  url: '',
  isActive: false,
  isLoading: false,
  ...overrides,
});

const INITIAL_TABS: BrowserTab[] = [
  mkTab({ id: 'tab-1', title: 'New Tab', url: '', isActive: true }),
];

// ── Navigation history per tab ─────────────────────────────────────────────
interface NavHistory {
  stack: string[];
  cursor: number;
}
const emptyHistory = (): NavHistory => ({ stack: [], cursor: -1 });

// ── App ────────────────────────────────────────────────────────────────────
export default function App(): React.ReactElement {
  // Theme
  const [isDark, setIsDark] = useState(true);

  // Tabs
  const [tabs, setTabs] = useState<BrowserTab[]>(INITIAL_TABS);
  const activeTab = tabs.find((t) => t.isActive) ?? tabs[0];

  // Per-tab nav history
  const [navHistories, setNavHistories] = useState<Record<string, NavHistory>>({
    'tab-1': emptyHistory(),
  });

  // Bookmark state — rich entries with title and timestamp
  const [bookmarkEntries, setBookmarkEntries] = useState<BookmarkEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('nova-bookmarks') || '[]'); } catch { return []; }
  });

  // History state
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('nova-history') || '[]'); } catch { return []; }
  });

  // Settings
  const [settings, setSettings] = useState<BrowserSettings>(() => {
    const defaults: BrowserSettings = {
      theme: 'dark', searchEngine: 'google', fontSize: 14,
      openRouterApiKey: '',
      blockAds: true, blockPopups: true, doNotTrack: true, clearOnExit: false,
    };
    try { 
      const parsed = JSON.parse(localStorage.getItem('nova-settings') || '{}');
      return { ...defaults, ...parsed, openRouterApiKey: '' }; // Keep api key blank initially
    } catch { return defaults; }
  });

  // Securely load API Key on boot
  useEffect(() => {
    const encryptedKey = localStorage.getItem('nova-api-key-secure');
    if (encryptedKey && window.electron?.invoke) {
      window.electron.invoke('nova:load-key', encryptedKey).then(decrypted => {
        if (decrypted) setSettings(s => ({ ...s, openRouterApiKey: decrypted }));
      });
    }
  }, []);

  // Panels
  const [showExtensions, setShowExtensions] = useState(false);
  const [showAccount, setShowAccount]       = useState(false);
  const [showAI, setShowAI]                 = useState(false);
  const [showAgent, setShowAgent]           = useState(false);
  const [showMenu, setShowMenu]             = useState(false);

  // Account
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Refs for outside-click dismissal
  const menuRef       = useRef<HTMLDivElement>(null);
  const extRef        = useRef<HTMLDivElement>(null);
  const loadTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    logger.info(SCOPE, 'Nova Browser started');

    // Restore theme from settings
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.fontSize = `${settings.fontSize}px`;

    // Sync initial ad blocker state to main process
    if (window.electron?.send) {
      window.electron.send('nova:set-ad-blocker', settings.blockAds);
      window.electron.send('nova:set-theme', settings.theme);
    }

    // Restore user
    const savedUser = localStorage.getItem('nova-user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch { /* noop */ }
    }

    // Outside-click handler
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (extRef.current  && !extRef.current.contains(e.target as Node))  setShowExtensions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Persist bookmarks/history/settings to localStorage
  useEffect(() => { localStorage.setItem('nova-bookmarks', JSON.stringify(bookmarkEntries)); }, [bookmarkEntries]);
  useEffect(() => { localStorage.setItem('nova-history', JSON.stringify(historyEntries)); }, [historyEntries]);
  
  useEffect(() => { 
    const { openRouterApiKey, ...safeSettings } = settings;
    localStorage.setItem('nova-settings', JSON.stringify(safeSettings)); 
    
    // Securely encrypt the key if it exists
    if (window.electron?.invoke && openRouterApiKey) {
      window.electron.invoke('nova:save-key', openRouterApiKey).then(encrypted => {
        if (encrypted) localStorage.setItem('nova-api-key-secure', encrypted);
      });
    } else if (!openRouterApiKey) {
      localStorage.removeItem('nova-api-key-secure');
    }
  }, [settings]);

  // ── Theme ────────────────────────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      const theme = next ? 'dark' : 'light';
      setSettings((s) => ({ ...s, theme }));
      if (window.electron?.send) {
        window.electron.send('nova:set-theme', theme);
      }
      return next;
    });
  }, []);

  // Settings update handler
  const handleUpdateSettings = useCallback((updates: Partial<BrowserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      // Apply theme change immediately
      if (updates.theme) {
        const dark = updates.theme === 'dark' || (updates.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
        if (window.electron?.send) {
          window.electron.send('nova:set-theme', updates.theme);
        }
      }
      if (updates.fontSize) {
        document.documentElement.style.fontSize = `${updates.fontSize}px`;
      }
      if (updates.blockAds !== undefined && window.electron?.send) {
        window.electron.send('nova:set-ad-blocker', updates.blockAds);
      }
      return next;
    });
  }, []);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const selectTab = useCallback((id: string) =>
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === id }))), []);

  const closeTab = useCallback((id: string) =>
    setTabs((prev) => {
      if (prev.length === 1) return prev; // never close last tab
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (prev[idx]?.isActive && next.length > 0) {
        const ni = Math.max(0, idx - 1);
        next[ni] = { ...next[ni], isActive: true };
      }
      return next;
    }), []);

  const addTab = useCallback(() => {
    const t = mkTab({ isActive: true });
    setTabs((prev) => [...prev.map((x) => ({ ...x, isActive: false })), t]);
    setNavHistories((prev) => ({ ...prev, [t.id]: emptyHistory() }));
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate = useCallback((url: string) => {
    if (!activeTab) return;
    const tabId = activeTab.id;

    // Don't add internal pages to history
    const isInternal = url.startsWith('nova://');

    // Add to browsing history
    if (!isInternal && url) {
      const entry: HistoryEntry = {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url,
        title: url.replace(/^https?:\/\//, '').split('/')[0],
        timestamp: Date.now(),
      };
      setHistoryEntries((prev) => [entry, ...prev].slice(0, 1000));
    }

    // Update tab immediately with loading state
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? { ...t, url, title: url ? url.replace(/^https?:\/\//, '').split('/')[0] : 'New Tab', isLoading: true }
          : t
      )
    );

    // Update history for this tab
    setNavHistories((prev) => {
      const h = prev[tabId] ?? emptyHistory();
      const newStack = [...h.stack.slice(0, h.cursor + 1), url];
      return { ...prev, [tabId]: { stack: newStack, cursor: newStack.length - 1 } };
    });

    // Imperatively tell the webview to navigate
    const wv = document.getElementById(`webview-${tabId}`) as any;
    if (wv && typeof wv.loadURL === 'function') {
      wv.loadURL(url).catch(() => {});
    }

    // Fallback: simulate load completion for internal pages
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isLoading: false } : t)));
    }, 3000);
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (!activeTab) return;
    const h = navHistories[activeTab.id];
    if (!h || h.cursor <= 0) return;
    const newCursor = h.cursor - 1;
    const url = h.stack[newCursor];
    setNavHistories((prev) => ({ ...prev, [activeTab.id]: { ...h, cursor: newCursor } }));
    setTabs((prev) => prev.map((t) => t.id === activeTab.id ? { ...t, url, title: url.replace(/^https?:\/\//, '').split('/')[0] } : t));
  }, [activeTab, navHistories]);

  const goForward = useCallback(() => {
    if (!activeTab) return;
    const h = navHistories[activeTab.id];
    if (!h || h.cursor >= h.stack.length - 1) return;
    const newCursor = h.cursor + 1;
    const url = h.stack[newCursor];
    setNavHistories((prev) => ({ ...prev, [activeTab.id]: { ...h, cursor: newCursor } }));
    setTabs((prev) => prev.map((t) => t.id === activeTab.id ? { ...t, url, title: url.replace(/^https?:\/\//, '').split('/')[0] } : t));
  }, [activeTab, navHistories]);

  const handleRefresh = () => {
    if (!activeTab?.url) return;
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.reload === 'function') {
      wv.reload();
    } else {
      navigate(activeTab.url);
    }
  };

  const handleStop = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    const wv = document.getElementById(`webview-${activeTab?.id}`) as any;
    if (wv && typeof wv.stop === 'function') wv.stop();
    setTabs((prev) => prev.map((t) => t.isActive ? { ...t, isLoading: false } : t));
  };

  const handleGoBack = () => {
    if (!activeTab) return;
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.goBack === 'function') {
      wv.goBack();
    } else {
      goBack();
    }
  };

  const handleGoForward = () => {
    if (!activeTab) return;
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.goForward === 'function') {
      wv.goForward();
    } else {
      goForward();
    }
  };

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  const toggleBookmark = () => {
    const url = activeTab?.url;
    if (!url) return;
    const exists = bookmarkEntries.find((b) => b.url === url);
    if (exists) {
      setBookmarkEntries((prev) => prev.filter((b) => b.url !== url));
    } else {
      setBookmarkEntries((prev) => [{
        id: `bm-${Date.now()}`,
        url,
        title: activeTab?.title || url,
        timestamp: Date.now(),
      }, ...prev]);
    }
  };

  const isBookmarked = bookmarkEntries.some((b) => b.url === activeTab?.url);

  // ── Account ───────────────────────────────────────────────────────────────
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('nova-user', JSON.stringify(user));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nova-user');
  };

  // ── Menu Actions ──────────────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => {
    if (!activeTab) return;
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.setZoomLevel === 'function') {
      try {
        const result = wv.getZoomLevel();
        if (result && typeof result.then === 'function') {
          result.then((level: number) => wv.setZoomLevel(level + 0.5));
        } else {
          wv.setZoomLevel(Number(result) + 0.5);
        }
      } catch (e) {
        console.warn('Zoom not supported in this environment', e);
      }
    } else {
      console.warn('Zoom not supported in this environment');
    }
  }, [activeTab]);

  const handleZoomOut = useCallback(() => {
    if (!activeTab) return;
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.setZoomLevel === 'function') {
      try {
        const result = wv.getZoomLevel();
        if (result && typeof result.then === 'function') {
          result.then((level: number) => wv.setZoomLevel(level - 0.5));
        } else {
          wv.setZoomLevel(Number(result) - 0.5);
        }
      } catch (e) {
        console.warn('Zoom not supported in this environment', e);
      }
    } else {
      console.warn('Zoom not supported in this environment');
    }
  }, [activeTab]);

  const handlePrint = useCallback(() => {
    if (!activeTab) return;
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.print === 'function') {
      wv.print();
    } else {
      window.print();
    }
  }, [activeTab]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        addTab();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTab) closeTab(activeTab.id);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAI((v) => !v);
        setShowAgent(false);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setShowAgent(v => !v);
        setShowAI(false);
      } else if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        handleRefresh();
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      } else if (e.key === 'Escape') {
        handleStop();
      } else if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        navigate('nova://bookmarks');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate('nova://history');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        navigate('nova://downloads');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        navigate('nova://settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, addTab, closeTab, handleRefresh, handleGoBack, handleGoForward, handleStop, handleZoomIn, handleZoomOut, navigate, handlePrint]);

  const currentUrl = activeTab?.url ?? '';
  const currentHistory = navHistories[activeTab?.id ?? ''] ?? emptyHistory();
  const canGoBack    = activeTab?.canGoBack ?? (currentHistory.cursor > 0);
  const canGoForward = activeTab?.canGoForward ?? (currentHistory.cursor < currentHistory.stack.length - 1);
  const isSecure     = currentUrl.startsWith('https://');
  const isNtpPage    = !currentUrl;

  // Search engine URL from settings
  const searchEngineUrl = SEARCH_ENGINES.find((e) => e.id === settings.searchEngine)?.url
    || 'https://www.google.com/search?q=';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-white dark:bg-[#1e1e1e]">

      {/* ── Tab Strip ── */}
      <BrowserTabBar
        tabs={tabs}
        onTabSelect={selectTab}
        onTabClose={closeTab}
        onTabAdd={addTab}
      />

      {/* ── Toolbar ── */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <BrowserToolbar
          url={currentUrl}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          isLoading={activeTab?.isLoading ?? false}
          isSecure={isSecure}
          isDark={isDark}
          isLoggedIn={!!currentUser}
          userEmail={currentUser?.email}
          isBookmarked={isBookmarked}
          isAISidebarOpen={showAI}
          isAgentOpen={showAgent}
          onBack={handleGoBack}
          onForward={handleGoForward}
          onRefresh={handleRefresh}
          onStop={handleStop}
          onNavigate={navigate}
          onToggleTheme={handleToggleTheme}
          onToggleExtensions={() => setShowExtensions((v) => !v)}
          onOpenAccount={() => setShowAccount(true)}
          onToggleAI={() => { setShowAI((v) => !v); setShowAgent(false); }}
          onToggleAgent={() => { setShowAgent((v) => !v); setShowAI(false); }}
          onToggleBookmark={toggleBookmark}
          onOpenMenu={() => setShowMenu((v) => !v)}
          searchEngineUrl={searchEngineUrl}
        />

        {/* Extensions dropdown */}
        {showExtensions && (
          <div ref={extRef} className="absolute right-0 top-full z-50">
            <ExtensionsPanel 
              onClose={() => setShowExtensions(false)} 
              onNavigate={(url) => {
                navigate(url);
                setShowExtensions(false);
              }}
            />
          </div>
        )}

        {/* 3-dot menu */}
        {showMenu && (
          <BrowserMenu
            isDark={isDark}
            isLoggedIn={!!currentUser}
            userEmail={currentUser?.email}
            onClose={() => setShowMenu(false)}
            onToggleTheme={handleToggleTheme}
            onOpenAccount={() => { setShowAccount(true); setShowMenu(false); }}
            onOpenSettings={() => { navigate('nova://settings'); setShowMenu(false); }}
            onNavigate={navigate}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPrint={handlePrint}
          />
        )}
      </div>

      {/* ── Content area + optional AI sidebar ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Page content (WebViews) */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e] relative">
          {tabs.map((tab) => {
            const isNtp = !tab.url || tab.url === 'nova://newtab';
            const isSettings = tab.url === 'nova://settings';
            const isHistory    = tab.url === 'nova://history';
            const isBookmarks  = tab.url === 'nova://bookmarks';
            const isAbout      = tab.url === 'nova://about';
            const isExtensions = tab.url === 'nova://extensions';
            const isCompare    = tab.url.startsWith('nova://compare');
            const isInternal = isNtp || isSettings || isHistory || isBookmarks || isAbout || isExtensions || isCompare;

            return (
              <div
                key={tab.id}
                className={`absolute inset-0 flex flex-col ${tab.isActive ? 'z-10 visible' : 'z-0 hidden'}`}
              >
                {isNtp && <NewTabPage onNavigate={navigate} />}
                {isSettings && (
                  <SettingsPage
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onClearBrowsingData={() => {
                      setHistoryEntries([]);
                      setBookmarkEntries([]);
                    }}
                    historyCount={historyEntries.length}
                    bookmarkCount={bookmarkEntries.length}
                  />
                )}
                {isHistory && (
                  <HistoryPage
                    entries={historyEntries}
                    onNavigate={navigate}
                    onDeleteEntry={(id) => setHistoryEntries((prev) => prev.filter((e) => e.id !== id))}
                    onClearAll={() => setHistoryEntries([])}
                  />
                )}
                {isBookmarks && (
                  <BookmarksPage
                    bookmarks={bookmarkEntries}
                    onNavigate={navigate}
                    onDeleteBookmark={(id) => setBookmarkEntries((prev) => prev.filter((b) => b.id !== id))}
                    onClearAll={() => setBookmarkEntries([])}
                  />
                )}
                {isExtensions && (
                  <ExtensionsPage onNavigate={navigate} />
                )}
                {isCompare && (
                  <ComparePage query={new URL(tab.url).searchParams.get('q') || ''} />
                )}
                {isAbout && (
                  <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#f8f9fa] dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-2xl font-bold text-white">N</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-1">Nova Browser</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Version 0.1.0</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-sm">
                      An AI-native, privacy-first browser built with Chromium and Electron.<br/>
                      No cloud accounts. No API keys. Your data stays local.
                    </p>
                  </div>
                )}
                
                {!isInternal && (
                  <WebviewTab
                    key={tab.id}
                    tabId={tab.id}
                    url={tab.url}
                    onTitleChange={(title) =>
                      setTabs((prev) => prev.map((t) => t.id === tab.id ? { ...t, title } : t))
                    }
                    onLoadingChange={(loading) =>
                      setTabs((prev) => prev.map((t) => t.id === tab.id ? { ...t, isLoading: loading } : t))
                    }
                    onUrlChange={(newUrl) =>
                      setTabs((prev) => prev.map((t) => t.id === tab.id ? { ...t, url: newUrl } : t))
                    }
                    onNavStateChange={(canBack, canForward) =>
                      setTabs((prev) => prev.map((t) => t.id === tab.id ? { ...t, canGoBack: canBack, canGoForward: canForward } : t))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* AI sidebar — slides in from right (BYOA: no Nova account needed) */}
        {showAI && (
          <AISidebar
            isOpen={showAI}
            onClose={() => setShowAI(false)}
            currentUrl={currentUrl}
            pageTitle={activeTab?.title ?? ''}
          />
        )}
        
        {/* Auto-Agent sidebar */}
        {showAgent && (
          <AgentSidebar
            onClose={() => setShowAgent(false)}
            activeTab={activeTab}
            openRouterApiKey={settings.openRouterApiKey}
          />
        )}
      </div>

      {/* ── Account modal ── */}
      <AccountModal
        isOpen={showAccount}
        currentUser={currentUser}
        onClose={() => setShowAccount(false)}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
}
