/**
 * Root App component — Nova Browser
 * Full browser chrome: tabs, toolbar, extensions, account, AI chat & assistant
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Home, Zap, BarChart3, Settings } from 'lucide-react';
import { logger } from '@utils/logger';
import { AIPlannerPanel, StatusPanel, SettingsPanel } from '@ui/components';
import { HomePage } from './pages/HomePage';
import { BrowserTabBar, type BrowserTab } from '@ui/components/BrowserTabBar';
import { BrowserToolbar } from '@ui/components/BrowserToolbar';
import { ExtensionsPanel } from '@ui/components/ExtensionsPanel';
import { AccountModal, type UserAccount } from '@ui/components/AccountModal';
import { AIChatPanel } from '@ui/components/AIChatPanel';
import { AIAssistantBar } from '@ui/components/AIAssistantBar';

const SCOPE = 'App';

type ViewType = 'home' | 'planner' | 'status' | 'settings';

let tabCounter = 2;

const createDefaultTab = (): BrowserTab => ({
  id: `tab-${++tabCounter}`,
  title: 'New Tab',
  url: '',
  isActive: false,
  isLoading: false,
});

const INITIAL_TABS: BrowserTab[] = [
  { id: 'tab-1', title: 'Home', url: 'nova://home', isActive: true, isLoading: false },
];

export default function App(): React.ReactElement {
  // Theme
  const [isDark, setIsDark] = useState(true);

  // Browser tabs
  const [tabs, setTabs] = useState<BrowserTab[]>(INITIAL_TABS);
  const activeTabId = tabs.find((t) => t.isActive)?.id ?? tabs[0]?.id;
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Navigation
  const [currentUrl, setCurrentUrl] = useState('nova://home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Inner app view (for nova:// pages)
  const [activeView, setActiveView] = useState<ViewType>('home');

  // Panels
  const [showExtensions, setShowExtensions] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();

  // Account
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Extensions panel ref for outside click
  const extBtnRef = useRef<HTMLDivElement>(null);

  // ---- Theme ----
  useEffect(() => {
    logger.info(SCOPE, 'Nova Browser mounted');
    document.documentElement.classList.toggle('dark', isDark);

    const saved = localStorage.getItem('nova-browser-settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        const dark = s.theme !== 'light';
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
      } catch {
        logger.error(SCOPE, 'Failed to parse settings');
      }
    }

    const savedUser = localStorage.getItem('nova-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        /* noop */
      }
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      const saved = localStorage.getItem('nova-browser-settings');
      const settings = saved ? JSON.parse(saved) : {};
      localStorage.setItem('nova-browser-settings', JSON.stringify({ ...settings, theme: next ? 'dark' : 'light' }));
      return next;
    });
  }, []);

  const handleThemeChange = (theme: 'dark' | 'light') => {
    const dark = theme === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  };

  // ---- Tabs ----
  const handleTabSelect = (id: string) => {
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
  };

  const handleTabClose = (id: string) => {
    setTabs((prev) => {
      if (prev.length === 1) return prev;
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (prev[idx]?.isActive && next.length > 0) {
        const newActive = idx > 0 ? idx - 1 : 0;
        next[newActive] = { ...next[newActive], isActive: true };
      }
      return next;
    });
  };

  const handleTabAdd = () => {
    const newTab = createDefaultTab();
    setTabs((prev) => [
      ...prev.map((t) => ({ ...t, isActive: false })),
      { ...newTab, isActive: true },
    ]);
    setCurrentUrl('');
    setActiveView('home');
  };

  // ---- Navigation ----
  const handleNavigate = (url: string) => {
    setCurrentUrl(url);
    setTabs((prev) =>
      prev.map((t) =>
        t.isActive
          ? { ...t, url, title: url.replace(/^https?:\/\//, '').split('/')[0] || 'New Tab', isLoading: true }
          : t
      )
    );
    setCanGoBack(true);
    // Simulate page load
    setTimeout(() => {
      setTabs((prev) => prev.map((t) => (t.isActive ? { ...t, isLoading: false } : t)));
    }, 1200);
  };

  // ---- Account ----
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('nova-user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nova-user');
  };

  // ---- AI Chat ----
  const handleOpenChat = (prompt?: string) => {
    setChatInitialPrompt(prompt);
    setShowChat(true);
  };

  const handleRequestLogin = () => {
    setShowAccount(true);
  };

  // ---- Views ----
  const navViews: Array<{ id: ViewType; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'planner', label: 'AI Planner', Icon: Zap },
    { id: 'status', label: 'Status', Icon: BarChart3 },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ];

  const isNovaPage = !currentUrl || currentUrl.startsWith('nova://');
  const isSecure = currentUrl.startsWith('https://');

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 overflow-hidden">
      {/* ---- Browser Tab Bar ---- */}
      <BrowserTabBar
        tabs={tabs}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onTabAdd={handleTabAdd}
      />

      {/* ---- Browser Toolbar (Address Bar) ---- */}
      <div className="relative">
        <BrowserToolbar
          url={currentUrl}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          isLoading={activeTab?.isLoading ?? false}
          isSecure={isSecure}
          isDark={isDark}
          isLoggedIn={!!currentUser}
          userEmail={currentUser?.email}
          onBack={() => setCanGoBack(false)}
          onForward={() => {}}
          onRefresh={() => handleNavigate(currentUrl)}
          onNavigate={handleNavigate}
          onToggleTheme={handleToggleTheme}
          onOpenExtensions={() => setShowExtensions((v) => !v)}
          onOpenAccount={() => setShowAccount(true)}
        />

        {/* Extensions Dropdown */}
        {showExtensions && (
          <div ref={extBtnRef} className="absolute right-0 top-full">
            <ExtensionsPanel onClose={() => setShowExtensions(false)} />
          </div>
        )}
      </div>

      {/* ---- App View Nav (only for nova:// pages) ---- */}
      {isNovaPage && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
          <nav className="flex gap-1">
            {navViews.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`px-4 py-2.5 font-medium text-sm transition-colors duration-150 border-b-2 flex items-center gap-2 ${
                  activeView === id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* ---- Main Content ---- */}
      <main className="flex-1 overflow-auto">
        {isNovaPage ? (
          <div className="h-full">
            {activeView === 'home' && <HomePage />}
            {activeView === 'planner' && (
              <div className="p-4 h-full">
                <AIPlannerPanel />
              </div>
            )}
            {activeView === 'status' && (
              <div className="p-4 h-full">
                <StatusPanel />
              </div>
            )}
            {activeView === 'settings' && (
              <div className="p-4 h-full">
                <SettingsPanel onThemeChange={handleThemeChange} />
              </div>
            )}
          </div>
        ) : (
          // External page placeholder (would be Electron WebContentsView in production)
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 flex-col gap-3">
            <div className="w-12 h-12 border-2 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm">Loading {currentUrl}</p>
            <p className="text-xs text-gray-300 dark:text-gray-700">Chromium WebView renders here in production</p>
          </div>
        )}
      </main>

      {/* ---- Status Bar ---- */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>System Ready</span>
          </div>
          {currentUser && (
            <span className="text-blue-600 dark:text-blue-400">{currentUser.email}</span>
          )}
        </div>
        <span>Nova Browser v0.1.0</span>
      </footer>

      {/* ---- Floating AI Assistant Button ---- */}
      <AIAssistantBar
        isLoggedIn={!!currentUser}
        onOpenChat={handleOpenChat}
        onRequestLogin={handleRequestLogin}
      />

      {/* ---- AI Chat Panel ---- */}
      <AIChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        isLoggedIn={!!currentUser}
        onRequestLogin={handleRequestLogin}
      />

      {/* ---- Account Modal ---- */}
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
