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
import { BrowserMenu } from '@ui/components/BrowserMenu';
import { NewTabPage } from './pages/NewTabPage';

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

  // Bookmark state (per URL)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Panels
  const [showExtensions, setShowExtensions] = useState(false);
  const [showAccount, setShowAccount]       = useState(false);
  const [showAI, setShowAI]                 = useState(false);
  const [showMenu, setShowMenu]             = useState(false);
  const [showSettings, setShowSettings]     = useState(false);

  // Account
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Refs for outside-click dismissal
  const menuRef       = useRef<HTMLDivElement>(null);
  const extRef        = useRef<HTMLDivElement>(null);
  const loadTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    logger.info(SCOPE, 'Nova Browser started');

    // Restore theme
    const saved = localStorage.getItem('nova-settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        const dark = s.theme !== 'light';
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
      } catch { /* noop */ }
    } else {
      document.documentElement.classList.add('dark');
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

  // ── Theme ────────────────────────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      const saved = localStorage.getItem('nova-settings');
      const s = saved ? JSON.parse(saved) : {};
      localStorage.setItem('nova-settings', JSON.stringify({ ...s, theme: next ? 'dark' : 'light' }));
      return next;
    });
  }, []);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const selectTab = (id: string) =>
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));

  const closeTab = (id: string) =>
    setTabs((prev) => {
      if (prev.length === 1) return prev; // never close last tab
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (prev[idx]?.isActive && next.length > 0) {
        const ni = Math.max(0, idx - 1);
        next[ni] = { ...next[ni], isActive: true };
      }
      return next;
    });

  const addTab = () => {
    const t = mkTab({ isActive: true });
    setTabs((prev) => [...prev.map((x) => ({ ...x, isActive: false })), t]);
    setNavHistories((prev) => ({ ...prev, [t.id]: emptyHistory() }));
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate = useCallback((url: string) => {
    if (!activeTab) return;
    const tabId = activeTab.id;

    // Update tab immediately
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

    // Simulate load completion
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isLoading: false } : t)));
    }, 1000);
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

  const handleRefresh = () => { if (activeTab?.url) navigate(activeTab.url); };
  const handleStop    = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setTabs((prev) => prev.map((t) => t.isActive ? { ...t, isLoading: false } : t));
  };

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  const toggleBookmark = () => {
    const url = activeTab?.url;
    if (!url) return;
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

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
        wv.getZoomLevel((level: number) => wv.setZoomLevel(level + 1));
      } catch (e) {
        console.warn('Zoom not supported in this environment');
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
        wv.getZoomLevel((level: number) => wv.setZoomLevel(level - 1));
      } catch (e) {
        console.warn('Zoom not supported in this environment');
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const currentUrl = activeTab?.url ?? '';
  const currentHistory = navHistories[activeTab?.id ?? ''] ?? emptyHistory();
  const canGoBack    = currentHistory.cursor > 0;
  const canGoForward = currentHistory.cursor < currentHistory.stack.length - 1;
  const isSecure     = currentUrl.startsWith('https://');
  const isNtpPage    = !currentUrl;
  const isBookmarked = bookmarks.has(currentUrl);

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
          onBack={goBack}
          onForward={goForward}
          onRefresh={handleRefresh}
          onStop={handleStop}
          onNavigate={navigate}
          onToggleTheme={handleToggleTheme}
          onToggleExtensions={() => setShowExtensions((v) => !v)}
          onOpenAccount={() => setShowAccount(true)}
          onToggleAI={() => setShowAI((v) => !v)}
          onToggleBookmark={toggleBookmark}
          onOpenMenu={() => setShowMenu((v) => !v)}
        />

        {/* Extensions dropdown */}
        {showExtensions && (
          <div ref={extRef} className="absolute right-0 top-full z-50">
            <ExtensionsPanel onClose={() => setShowExtensions(false)} />
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
            const isHistory = tab.url === 'nova://history';
            const isBookmarks = tab.url === 'nova://bookmarks';
            const isAbout = tab.url === 'nova://about';
            const isInternal = isNtp || isSettings || isHistory || isBookmarks || isAbout;

            return (
              <div
                key={tab.id}
                className={`absolute inset-0 flex flex-col ${tab.isActive ? 'z-10 visible' : 'z-0 hidden'}`}
              >
                {isNtp && <NewTabPage onNavigate={navigate} />}
                {isSettings && <InternalPage title="Settings">Manage your browser preferences, search engine, and privacy settings here.</InternalPage>}
                {isHistory && <InternalPage title="History">Your browsing history will appear here. Powered by SQLite.</InternalPage>}
                {isBookmarks && <InternalPage title="Bookmarks">Your saved pages and reading list will appear here.</InternalPage>}
                {isAbout && <InternalPage title="About Nova Browser">Version 0.1.0<br/>A production-ready AI-native browser built with Chromium and Electron.</InternalPage>}
                
                {!isInternal && (
                  <webview
                    id={`webview-${tab.id}`}
                    src={tab.url}
                    className="w-full h-full flex-1 border-none bg-white"
                    allowpopups="true"
                    partition="persist:nova-main"
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
