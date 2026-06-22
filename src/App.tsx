/**
 * Nova Browser — Root Application Shell
 *
 * Structure (top → bottom):
 *   [Tab Bar] — Chrome-style tabs
 *   [Toolbar] — Address bar + nav controls
 *   [Content + optional AI Sidebar] — flex row
 *
 * The AI is a sidebar accessed from the toolbar  button.
 * There are NO developer panels, no admin dashboards, no "AI Planner" nav tabs.
 * Settings lives in the 3-dot menu.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@utils/logger';
import { ArrowLeft, ArrowRight, RotateCw, Sparkles, Copy, Code, Printer, Camera, Download, FileText } from 'lucide-react';

import { BrowserTabBar, type BrowserTab } from '@ui/components/BrowserTabBar';
import { BrowserToolbar } from '@ui/components/BrowserToolbar';
import { ExtensionsPanel } from '@ui/components/ExtensionsPanel';
import { AccountModal, type UserAccount } from '@ui/components/AccountModal';
import { ContextMenu } from '@ui/components/ContextMenu';
import { WelcomePage, type OnboardingPrefs } from '@ui/components/WelcomePage';
import { AISidebar } from '@ui/components/AISidebar';
import { AgentSidebar } from '@ui/components/AgentSidebar';
import { ComparePage } from '@ui/components/ComparePage';
import { BrowserMenu } from '@ui/components/BrowserMenu';
import { TabGroupModal, GROUP_COLOR_PALETTE, type TabGroup } from '@ui/components/TabGroupModal';

import type { HistoryEntry } from './pages/HistoryPage';
import type { BookmarkEntry } from './pages/BookmarksPage';
import { SEARCH_ENGINES, type BrowserSettings } from './pages/SettingsPage';

// Lazy load heavy internal pages
const NewTabPage = React.lazy(() => import('./pages/NewTabPage').then(m => ({ default: m.NewTabPage })));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const BookmarksPage = React.lazy(() => import('./pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ExtensionsPage = React.lazy(() => import('./pages/ExtensionsPage').then(m => ({ default: m.ExtensionsPage })));
const DownloadsPage = React.lazy(() => import('./pages/DownloadsPage').then(m => ({ default: m.DownloadsPage })));

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
  isDark: boolean;
  onTitleChange: (title: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onUrlChange: (url: string) => void;
  onNavStateChange: (canGoBack: boolean, canGoForward: boolean) => void;
}

function WebviewTab({ tabId, url, isDark, onTitleChange, onLoadingChange, onUrlChange, onNavStateChange }: WebviewTabProps) {
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

    const onDomReady = () => {
      // ── Picture-in-Picture overlay ──────────────────────────────────────────
      // Wrapped in outer try/catch — any failure is silently swallowed so it
      // never surfaces as "Script failed to execute" in the console.
      const pipScript = `
        (function() {
          try {
            if (window._lumoPipSetup) return;
            window._lumoPipSetup = true;

            var btn = document.createElement('button');
            btn.className = 'lumo-pip-btn';
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="12" y="12" width="8" height="6" rx="1" ry="1"/></svg>';
            btn.title = "Picture-in-Picture";

            Object.assign(btn.style, {
              position: 'fixed', zIndex: '2147483647',
              background: 'rgba(28,28,30,0.75)', color: 'white',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              padding: '6px', cursor: 'pointer', opacity: '0',
              backdropFilter: 'blur(8px)',
              transition: 'opacity 0.2s ease, transform 0.1s ease',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            });

            btn.onmouseover = function() { btn.style.transform = 'scale(1.05)'; };
            btn.onmouseout  = function() { btn.style.transform = 'scale(1)'; };

            var currentTargetVideo = null;
            var hoverTimeout = null;
            var isHovering = false;

            btn.onclick = function(e) {
              e.preventDefault(); e.stopPropagation();
              if (!currentTargetVideo) return;
              try {
                if (document.pictureInPictureElement) {
                  document.exitPictureInPicture().catch(function(){});
                } else {
                  currentTargetVideo.requestPictureInPicture().catch(function(){});
                }
              } catch(err) {}
            };

            function ensureButton() {
              try {
                if (!btn.isConnected && document.body) document.body.appendChild(btn);
              } catch(e) {}
            }

            function updateButtonPosition() {
              try {
                var isFullscreen = false;
                try { isFullscreen = !!document.fullscreenElement; } catch(e) {}
                if (!currentTargetVideo || isFullscreen) { btn.style.display = 'none'; return; }
                ensureButton();
                btn.style.display = 'flex';
                var rect = currentTargetVideo.getBoundingClientRect();
                btn.style.top  = (rect.top  + 12) + 'px';
                btn.style.left = (rect.right - 44) + 'px';
              } catch(e) {}
            }

            // Use WeakSet instead of setting property on DOM node (avoids strict-mode throws)
            var observed = new WeakSet();

            var observer = new IntersectionObserver(function() {
              try {
                var maxArea = 0; var bestVideo = null;
                var videos = Array.from(document.querySelectorAll('video')).filter(function(v) {
                  return v.offsetWidth > 150 && v.offsetHeight > 100 &&
                         window.getComputedStyle(v).display !== 'none';
                });
                videos.forEach(function(v) {
                  var r = v.getBoundingClientRect();
                  var area = r.width * r.height;
                  if (area > maxArea && r.top < window.innerHeight && r.bottom > 0) {
                    maxArea = area; bestVideo = v;
                  }
                });
                currentTargetVideo = bestVideo;
                updateButtonPosition();
              } catch(e) {}
            }, { threshold: [0, 0.5, 1] });

            function observeVideos() {
              try {
                document.querySelectorAll('video').forEach(function(v) {
                  if (!observed.has(v)) { observer.observe(v); observed.add(v); }
                });
              } catch(e) {}
            }

            setInterval(observeVideos, 3000);
            window.addEventListener('scroll', updateButtonPosition, { passive: true });
            window.addEventListener('resize', updateButtonPosition, { passive: true });

            document.addEventListener('mousemove', function(e) {
              try {
                if (!currentTargetVideo) return;
                var isFullscreen = false;
                try { isFullscreen = !!document.fullscreenElement; } catch(ex) {}
                if (isFullscreen) return;
                var rect = currentTargetVideo.getBoundingClientRect();
                var isOverVideo = e.clientX >= rect.left && e.clientX <= rect.right &&
                                  e.clientY >= rect.top  && e.clientY <= rect.bottom;
                var isOverBtn = btn.contains(e.target);
                if (isOverVideo || isOverBtn) {
                  clearTimeout(hoverTimeout);
                  if (!isHovering) {
                    btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; isHovering = true;
                  }
                } else if (isHovering) {
                  hoverTimeout = setTimeout(function() {
                    btn.style.opacity = '0'; btn.style.pointerEvents = 'none'; isHovering = false;
                  }, 800);
                }
              } catch(e) {}
            }, { passive: true });

          } catch(e) { /* silently ignore — page may not support PiP */ }
        })();
      `;
      wv.executeJavaScript(pipScript).catch(() => {});

      // ── YouTube ad skipper ────────────────────────────────────────────────
      const ytAdScript = `
        (function() {
          try {
            if (window._lumoYtAdSetup) return;
            try {
              if (window.location.hostname.indexOf('youtube.com') === -1) return;
            } catch(e) { return; }
            window._lumoYtAdSetup = true;

            function removeAds() {
              try {
                var skipBtn = document.querySelector(
                  '.ytp-ad-skip-button,.ytp-ad-skip-button-modern,.ytp-skip-ad-button,.ytp-ad-text.ytp-ad-skip-button-text'
                );
                var adContainer = document.querySelector('.ad-showing,.ad-interrupting');
                var video = document.querySelector('video');
                if (skipBtn) {
                  skipBtn.click();
                } else if (adContainer && video && !isNaN(video.duration) && video.duration > 0) {
                  video.currentTime = video.duration;
                }
                var overlays = document.querySelectorAll(
                  '.ytp-ad-overlay-container,#player-ads,ytd-ad-slot-renderer,ytd-promoted-sparkles-web-renderer,ytd-banner-promo-renderer'
                );
                overlays.forEach(function(el) {
                  try { el.style.display = 'none'; el.remove(); } catch(e) {}
                });
              } catch(e) {}
            }

            var adTimeout = null;
            var observer = new MutationObserver(function() {
              clearTimeout(adTimeout);
              adTimeout = setTimeout(removeAds, 250);
            });

            function startObserving() {
              try {
                var player = document.getElementById('ytd-player') || document.body;
                if (player) observer.observe(player, { childList: true, subtree: true });
              } catch(e) {}
            }

            removeAds();
            setTimeout(startObserving, 1000);
          } catch(e) { /* silently ignore */ }
        })();
      `;
      wv.executeJavaScript(ytAdScript).catch(() => {});
    };

    const onContextMenu = (e: any) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('lumo:show-context-menu', {
        detail: { x: e.params.x, y: e.params.y, params: e.params, tabId }
      }));
    };

    wv.addEventListener('dom-ready', onDomReady);
    wv.addEventListener('context-menu', onContextMenu);

    return () => {
      wv.removeEventListener('did-start-loading', onStartLoad);
      wv.removeEventListener('did-stop-loading',  onStopLoad);
      wv.removeEventListener('page-title-updated', onTitleUpd);
      wv.removeEventListener('did-navigate',      onNavigated);
      wv.removeEventListener('did-navigate-in-page', onNavigated);
      wv.removeEventListener('dom-ready',         onDomReady);
      wv.removeEventListener('context-menu',      onContextMenu);
    };
  }, [isDark, onTitleChange, onLoadingChange, onUrlChange, onNavStateChange]);

  return (
    <webview
      ref={ref}
      id={`webview-${tabId}`}
      src={initialUrl.current || 'about:blank'}
      className="w-full h-full border-none bg-white"
      allowpopups="true"
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
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

const _isFirstLaunch = (() => {
  try { return !JSON.parse(localStorage.getItem('nova-onboarding') || '{}').complete; }
  catch { return true; }
})();

const INITIAL_TABS: BrowserTab[] = [
  mkTab({ id: 'tab-1', title: _isFirstLaunch ? 'Welcome to Nova' : 'New Tab', url: _isFirstLaunch ? 'lumo://welcome' : '', isActive: true }),
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

  const handleOnboardingComplete = (prefs: OnboardingPrefs) => {
    setSettings(s => ({ ...s, searchEngine: prefs.searchEngine, blockAds: prefs.adBlockEnabled }));
    window.electron?.send?.('lumo:set-ad-blocker', prefs.adBlockEnabled);
    // Navigate the welcome tab to new tab page
    navigate('');
  };
  const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number; params: any; tabId: string | null }>({ show: false, x: 0, y: 0, params: null, tabId: null });

  // ── Auto UI Scaling ────────────────────────────────────────────────────────
  // Removed auto-scaling because it caused the browser UI to be too large on bigger screens and conflicted with custom font size settings.



  useEffect(() => {
    const handler = (e: any) => {
      setContextMenu({
        show: true,
        x: e.detail.x,
        y: e.detail.y,
        params: e.detail.params,
        tabId: e.detail.tabId
      });
    };
    // ContextMenu handles its own outside-click via capture-phase mousedown
    window.addEventListener('lumo:show-context-menu', handler);
    return () => {
      window.removeEventListener('lumo:show-context-menu', handler);
    };
  }, []);
  // Tabs
  const [tabs, setTabs] = useState<BrowserTab[]>(INITIAL_TABS);
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<BrowserTab[]>([]);
  const activeTab = tabs.find((t) => t.isActive) ?? tabs[0];

  // Per-tab nav history
  const [navHistories, setNavHistories] = useState<Record<string, NavHistory>>({
    'tab-1': emptyHistory(),
  });

  // Bookmark state — rich entries with title and timestamp
  const [bookmarkEntries, setBookmarkEntries] = useState<BookmarkEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('lumo-bookmarks') || '[]'); } catch { return []; }
  });

  // History state
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('lumo-history') || '[]'); } catch { return []; }
  });

  // Download items — shared state so toolbar badge can show count
  const [downloadItems, setDownloadItems] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('lumo-downloads') || '[]'); } catch { return []; }
  });

  // Listen for download progress from main process
  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron?.on) return;
    const unsub = electron.on('lumo:download-progress', (_: unknown, item: any) => {
      setDownloadItems(prev => {
        const updated = prev.find((d: any) => d.id === item.id)
          ? prev.map((d: any) => d.id === item.id ? { ...d, ...item } : d)
          : [item, ...prev];
        localStorage.setItem('lumo-downloads', JSON.stringify(updated));
        return updated;
      });
    });
    return () => unsub?.();
  }, []);

  // Listen for lumo:navigate messages from main process (e.g. downloads button)
  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron?.on) return;
    const unsub = electron.on('lumo:navigate', (_: unknown, url: string) => {
      navigate(url);
    });
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for global shortcuts fired from the main process (e.g. Ctrl+J)
  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron?.on) return;
    const unsub = electron.on('lumo:shortcut', (_: unknown, action: string) => {
      if (action === 'toggle-downloads') {
        // Use functional form so we always read latest activeTab URL
        setTabs(prev => {
          const active = prev.find(t => t.isActive);
          if (active?.url === 'lumo://downloads') {
            // Navigate back — re-use the navigate function via a custom event
            window.dispatchEvent(new CustomEvent('lumo:go-back'));
          } else {
            window.dispatchEvent(new CustomEvent('lumo:open-page', { detail: 'lumo://downloads' }));
          }
          return prev;
        });
      }
    });
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Settings
  const [settings, setSettings] = useState<BrowserSettings>(() => {
    const defaults: BrowserSettings = {
      theme: 'dark', searchEngine: 'google', fontSize: 14,
      openRouterApiKey: '',
      blockAds: true, blockPopups: true, doNotTrack: true, clearOnExit: false,
      profiles: [],
      currentProfileId: '',
      downloadLocation: '~/Downloads',
      askBeforeDownloading: false,
      hardwareAcceleration: true,
      memorySaver: false,
      showBookmarksBar: false,
      showHomeButton: true,
      defaultZoom: 100,
      startupBehavior: 'new-tab',
      startupPages: [],
      spellCheck: true,
      uiLanguage: 'en-US',
      offerTranslate: true,
      permissions: {
        camera: false,
        microphone: false,
        location: false,
        notifications: false,
      },
    };
    try { 
      const parsed = JSON.parse(localStorage.getItem('lumo-settings') || '{}');
      return { ...defaults, ...parsed, openRouterApiKey: '' }; // Keep api key blank initially
    } catch { return defaults; }
  });

  // Securely load API Key on boot — try encrypted first, fall back to plain
  useEffect(() => {
    // Strip to printable ASCII only — safeStorage on Linux can return binary garbage
    const sanitizeKey = (k: string) =>
      (k || '').replace(/[^\x20-\x7E]/g, '').replace(/^Bearer\s+/i, '').trim();

    // A valid OpenRouter key always starts with "sk-"
    const isValidKey = (k: string) => k.startsWith('sk-') && k.length > 20;

    const encryptedKey = localStorage.getItem('lumo-api-key-secure');
    const plainKey     = localStorage.getItem('lumo-api-key-plain');

    const applyKey = (raw: string | null) => {
      const key = sanitizeKey(raw || '');
      if (isValidKey(key)) {
        setSettings(s => ({ ...s, openRouterApiKey: key }));
        return true;
      }
      return false;
    };

    if (encryptedKey && window.electron?.invoke) {
      window.electron.invoke('lumo:load-key', encryptedKey)
        .then((decrypted: string) => {
          const key = sanitizeKey(decrypted || '');
          if (isValidKey(key)) {
            setSettings(s => ({ ...s, openRouterApiKey: key }));
          } else {
            // Encrypted key decrypted to garbage — purge it and use plain fallback
            console.warn('[Lumo] Encrypted key is corrupted, clearing it');
            localStorage.removeItem('lumo-api-key-secure');
            applyKey(plainKey);
          }
        })
        .catch(() => {
          // Decryption failed — clear corrupted key and use plain
          localStorage.removeItem('lumo-api-key-secure');
          applyKey(plainKey);
        });
    } else {
      applyKey(plainKey);
    }
  }, []);



  const [showExtensions, setShowExtensions] = useState(false);
  const [showAccount, setShowAccount]       = useState(false);
  const [showAI, setShowAI]                 = useState(false);
  const [showAgent, setShowAgent]           = useState(false);
  const [showMenu, setShowMenu]             = useState(false);

  // Tab Grouping state
  const [tabGrouping, setTabGrouping] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    groups: TabGroup[];
    error: string | null;
  }>({ isOpen: false, isLoading: false, groups: [], error: null });

  // Tab layout — read from nova-general-settings, update live via custom event
  const [tabLayout, setTabLayout] = useState<'horizontal' | 'vertical'>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('lumo-general-settings') || '{}');
      return s.tabLayout === 'vertical' ? 'vertical' : 'horizontal';
    } catch { return 'horizontal'; }
  });

  // Listen for settings changes dispatched by GeneralSettingsTab
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tabLayout) setTabLayout(detail.tabLayout);
    };
    window.addEventListener('lumo:settings-changed', handler);
    return () => window.removeEventListener('lumo:settings-changed', handler);
  }, []);

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const isResizing = useRef(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(420);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = resizeStartX.current - ev.clientX;
      const newWidth = Math.min(Math.max(resizeStartWidth.current + delta, 280), 640);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

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
      window.electron.send('lumo:set-ad-blocker', settings.blockAds);
      window.electron.send('lumo:set-theme', settings.theme);
    }

    // Restore user
    const savedUser = localStorage.getItem('lumo-user');
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
  useEffect(() => { localStorage.setItem('lumo-bookmarks', JSON.stringify(bookmarkEntries)); }, [bookmarkEntries]);
  useEffect(() => { localStorage.setItem('lumo-history', JSON.stringify(historyEntries)); }, [historyEntries]);
  
  useEffect(() => { 
    const { openRouterApiKey, ...safeSettings } = settings;
    localStorage.setItem('lumo-settings', JSON.stringify(safeSettings)); 
    
    if (openRouterApiKey) {
      // Always store a plain copy so the key loads reliably on boot
      localStorage.setItem('lumo-api-key-plain', openRouterApiKey);

      // Also attempt encrypted storage
      if (window.electron?.invoke) {
        window.electron.invoke('lumo:save-key', openRouterApiKey).then((encrypted: string) => {
          if (encrypted) localStorage.setItem('lumo-api-key-secure', encrypted);
        });
      }
    } else {
      localStorage.removeItem('lumo-api-key-secure');
      localStorage.removeItem('lumo-api-key-plain');
    }
  }, [settings]);

  // Translate page handler
  useEffect(() => {
    const handleTranslate = () => {
      const tabId = activeTab?.id;
      const wv = document.getElementById(`webview-${tabId}`) as any;
      if (!wv) return;
      const lang = settings.uiLanguage.split('-')[0]; // e.g., 'en'
      const script = `
        (function() {
          if (window._lumoTranslated) return;
          window._lumoTranslated = true;
          
          const script = document.createElement('script');
          script.src = "https://translate.google.com/translate_a/element.js?cb=lumoTranslateInit";
          document.head.appendChild(script);

          window.lumoTranslateInit = function() {
            new google.translate.TranslateElement({
              pageLanguage: 'auto',
              includedLanguages: '${lang}',
              layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
            }, 'lumo-translate-widget');
            
            // Wait for widget to load and trigger it
            setTimeout(() => {
              const select = document.querySelector('.goog-te-combo');
              if (select) {
                select.value = '${lang}';
                select.dispatchEvent(new Event('change'));
              }
              // Hide the google translate banner that appears at the top
              const banner = document.querySelector('.goog-te-banner-frame');
              if (banner) banner.style.display = 'none';
              document.body.style.top = '0px';
            }, 1000);
          };

          const widgetDiv = document.createElement('div');
          widgetDiv.id = 'lumo-translate-widget';
          widgetDiv.style.display = 'none';
          document.body.appendChild(widgetDiv);
        })();
      `;
      wv.executeJavaScript(script).catch(() => {});
    };
    window.addEventListener('lumo:translate-page', handleTranslate);
    return () => window.removeEventListener('lumo:translate-page', handleTranslate);
  }, [settings.uiLanguage, activeTab?.id]);


  // ── Theme ────────────────────────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      const theme = next ? 'dark' : 'light';
      setSettings((s) => ({ ...s, theme }));
      if (window.electron?.send) {
        window.electron.send('lumo:set-theme', theme);
      }
      return next;
    });
  }, []);

  // Settings update handler
  const handleUpdateSettings = useCallback((updates: Partial<BrowserSettings>) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        ...updates,
        openRouterApiKey: updates.openRouterApiKey !== undefined
          ? updates.openRouterApiKey.replace(/[^\x20-\x7E]/g, '').replace(/^Bearer\s+/i, '').trim()
          : prev.openRouterApiKey,
      };
      // Apply theme change immediately
      if (updates.theme) {
        const dark = updates.theme === 'dark' || (updates.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
        if (window.electron?.send) {
          window.electron.send('lumo:set-theme', updates.theme);
        }
      }
      if (updates.fontSize) {
        document.documentElement.style.fontSize = `${updates.fontSize}px`;
      }
      if (updates.blockAds !== undefined && window.electron?.send) {
        window.electron.send('lumo:set-ad-blocker', updates.blockAds);
        window.electron.send('lumo:set-ad-blocker-config', {
          enabled: updates.blockAds,
          blockAds: updates.blockAds,
        });
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
      const tabToClose = prev[idx];
      if (tabToClose) {
        setRecentlyClosedTabs(r => [...r, tabToClose].slice(-10)); // keep last 10
      }
      const next = prev.filter((t) => t.id !== id);
      if (prev[idx]?.isActive && next.length > 0) {
        const ni = Math.max(0, idx - 1);
        next[ni] = { ...next[ni], isActive: true };
      }
      return next;
    }), []);

  const addTab = useCallback((overrideUrl?: string) => {
    const startUrl = overrideUrl || '';
    const t = mkTab({ isActive: true, url: startUrl, title: startUrl ? startUrl.replace(/^https?:\/\//, '').split('/')[0] : 'New Tab' });
    setTabs((prev) => [...prev.map((x) => ({ ...x, isActive: false })), t]);
    setNavHistories((prev) => {
      const h = emptyHistory();
      if (startUrl) {
        h.stack.push(startUrl);
        h.cursor = 0;
      }
      return { ...prev, [t.id]: h };
    });
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate = useCallback((url: string) => {
    if (!activeTab) return;
    const tabId = activeTab.id;

    // Don't add internal pages to history
    const isInternal = url.startsWith('lumo://');

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

    // Only tell the webview to navigate for real external URLs.
    // Internal lumo:// pages are rendered by React — passing them to
    // wv.loadURL() causes ERR_FAILED and can open the OS default browser.
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);

    if (isInternal) {
      // Internal page: React handles rendering, mark as loaded instantly
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isLoading: false } : t)));
    } else {
      const wv = document.getElementById(`webview-${tabId}`) as any;
      if (wv && typeof wv.loadURL === 'function') {
        wv.loadURL(url).catch(() => {});
      }
      // Fallback timeout in case webview events don't fire
      loadTimerRef.current = setTimeout(() => {
        setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isLoading: false } : t)));
      }, 8000);
    }
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
    // For internal lumo:// pages there is no real webview — use React nav stack
    if (activeTab.url?.startsWith('lumo://') || !activeTab.url) {
      goBack();
      return;
    }
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.goBack === 'function') {
      wv.goBack();
    } else {
      goBack();
    }
  };

  const handleGoForward = () => {
    if (!activeTab) return;
    // For internal lumo:// pages there is no real webview — use React nav stack
    if (activeTab.url?.startsWith('lumo://') || !activeTab.url) {
      goForward();
      return;
    }
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
    localStorage.setItem('lumo-user', JSON.stringify(user));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lumo-user');
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

  // ── Smart Tab Grouping ────────────────────────────────────────────────────
  const groupTabsWithAI = useCallback(async () => {
    const visibleTabs = tabs.filter(t => t.url && !t.url.startsWith('lumo://'));
    if (visibleTabs.length < 2) {
      setTabGrouping({ isOpen: true, isLoading: false, groups: [], error: null });
      return;
    }

    setTabGrouping({ isOpen: true, isLoading: true, groups: [], error: null });

    const tabList = visibleTabs.map((t, i) => `${i + 1}. "${t.title || t.url}" (${t.url})`).join('\n');

    const prompt = `You are a browser tab organizer. Group the following browser tabs into logical categories.

Tabs:
${tabList}

Respond with ONLY a valid JSON array. Each object must have:
- "name": short category label (e.g. "Shopping", "Research", "News", "Social Media", "Work")
- "tabIndices": array of 1-based tab numbers that belong in this group

Rules:
- Every tab must appear in exactly one group
- Maximum 6 groups
- Minimum 1 tab per group
- Group names should be short (1-2 words)

Example response format:
[{"name":"Shopping","tabIndices":[1,3]},{"name":"Research","tabIndices":[2,4,5]}]`;

    try {
      const apiKey = settings.openRouterApiKey;
      if (!apiKey) throw new Error('No OpenRouter API key set. Please add your key in Settings.');

      const result = await window.electron?.invoke?.('lumo:openrouter-chat', {
        apiKey,
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      if (result?.error) throw new Error(result.error.message);

      const raw = result?.data?.choices?.[0]?.message?.content ?? '';
      const jsonMatch = raw.match(/\[.*\]/s);
      if (!jsonMatch) throw new Error('AI returned an unexpected format.');

      const parsed: Array<{ name: string; tabIndices: number[] }> = JSON.parse(jsonMatch[0]);

      const groups: TabGroup[] = parsed.map((g, idx) => {
        const palette = GROUP_COLOR_PALETTE[idx % GROUP_COLOR_PALETTE.length];
        return {
          id: `grp-${idx}`,
          name: g.name,
          color: palette.bg,
          colorHex: palette.hex,
          tabIds: g.tabIndices
            .map(i => visibleTabs[i - 1]?.id)
            .filter(Boolean) as string[],
        };
      });

      setTabGrouping({ isOpen: true, isLoading: false, groups, error: null });
    } catch (err: any) {
      setTabGrouping({ isOpen: true, isLoading: false, groups: [], error: err.message ?? 'Unknown error' });
    }
  }, [tabs, settings.openRouterApiKey]);

  const applyTabGroups = useCallback((groups: TabGroup[]) => {
    const groupMap: Record<string, { id: string; color: string; name: string }> = {};
    groups.forEach(g => g.tabIds.forEach(tabId => {
      groupMap[tabId] = { id: g.id, color: g.colorHex, name: g.name };
    }));

    setTabs(prev => prev.map(t => ({
      ...t,
      groupId:    groupMap[t.id]?.id    ?? undefined,
      groupColor: groupMap[t.id]?.color ?? undefined,
      groupName:  groupMap[t.id]?.name  ?? undefined,
    })));

    setTabGrouping(s => ({ ...s, isOpen: false }));
  }, []);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        if (e.shiftKey) {
          // Reopen closed tab (Ctrl+Shift+T)
          e.preventDefault();
          setRecentlyClosedTabs(prev => {
            if (prev.length === 0) return prev;
            const toRestore = prev[prev.length - 1];
            const remaining = prev.slice(0, -1);
            setTabs(ts => [...ts.map(t => ({ ...t, isActive: false })), { ...toRestore, isActive: true, id: `tab-${Date.now()}` }]);
            return remaining;
          });
        } else {
          e.preventDefault();
          addTab();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTab) closeTab(activeTab.id);
      } else if (e.ctrlKey && e.key === 'Tab') {
        // Cycle tabs (Ctrl+Tab / Ctrl+Shift+Tab)
        e.preventDefault();
        setTabs(prev => {
          const idx = prev.findIndex(t => t.isActive);
          const nextIdx = e.shiftKey ? (idx - 1 + prev.length) % prev.length : (idx + 1) % prev.length;
          return prev.map((t, i) => ({ ...t, isActive: i === nextIdx }));
        });
      } else if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        // Jump to tab (Ctrl+1...9)
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        setTabs(prev => {
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
        alert('Incognito mode is coming in the next Nova update!');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
        // This is now handled below with lumo://settings
        e.preventDefault();
        navigate('lumo://settings');
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
        navigate('lumo://bookmarks');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate('lumo://history');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        e.stopPropagation();
        // Toggle downloads page (Chrome-style Ctrl+J behaviour)
        if (currentUrl === 'lumo://downloads') {
          handleGoBack();
        } else {
          navigate('lumo://downloads');
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        navigate('lumo://settings');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        navigate('lumo://settings');
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        groupTabsWithAI();
      }
    };

    // Use capture phase so Lumo intercepts Ctrl+J/B/H/etc BEFORE the
    // webview or OS (e.g. Brave/Chrome) can steal the shortcut.
    window.addEventListener('keydown', handleKeyDown, true);

    // Handlers for custom events dispatched by the global shortcut IPC listener
    const onGoBack   = () => handleGoBack();
    const onOpenPage = (e: Event) => navigate((e as CustomEvent).detail as string);
    window.addEventListener('lumo:go-back',   onGoBack);
    window.addEventListener('lumo:open-page', onOpenPage);

    return () => {
      window.removeEventListener('keydown',        handleKeyDown, true);
      window.removeEventListener('lumo:go-back',   onGoBack);
      window.removeEventListener('lumo:open-page', onOpenPage);
    };
  }, [activeTab, addTab, closeTab, handleRefresh, handleGoBack, handleGoForward, handleStop, handleZoomIn, handleZoomOut, navigate, handlePrint, groupTabsWithAI]);

  const currentUrl = activeTab?.url ?? '';
  const currentHistory = navHistories[activeTab?.id ?? ''] ?? emptyHistory();
  const canGoBack    = activeTab?.canGoBack ?? (currentHistory.cursor > 0);
  const canGoForward = activeTab?.canGoForward ?? (currentHistory.cursor < currentHistory.stack.length - 1);
  const isSecure     = currentUrl.startsWith('https://');
  const isNtpPage    = !currentUrl;


  // Search engine URL from settings
  const searchEngineUrl = SEARCH_ENGINES.find((e) => e.id === settings.searchEngine)?.url
    || 'https://www.google.com/search?q=';

  const isVertical = tabLayout === 'vertical';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-white dark:bg-[#1e1e1e]">

      {/* Horizontal tab strip + Group Tabs button */}
      {!isVertical && (
        <div className="flex items-end flex-shrink-0">
          <BrowserTabBar
            tabs={tabs}
            onTabSelect={selectTab}
            onTabClose={closeTab}
            onTabAdd={addTab}
          />
          {/* AI Group Tabs button */}
          <button
            id="group-tabs-btn"
            onClick={groupTabsWithAI}
            title="AI Group Tabs (Ctrl+Shift+G)"
            aria-label="Group tabs with AI"
            className="flex-shrink-0 mb-1.5 ml-1 flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium
              text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700
              bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60
              transition-all duration-150 whitespace-nowrap"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Group
          </button>
        </div>
      )}

      {/* ── Toolbar (always visible) ── */}
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
          offerTranslate={settings.offerTranslate}
          onDownload={() => {
            if (currentUrl === 'lumo://downloads') {
              // Toggle off — go back to previous page (or new tab)
              handleGoBack();
            } else {
              navigate('lumo://downloads');
            }
          }}
          isDownloadsOpen={currentUrl === 'lumo://downloads'}
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
            onOpenSettings={() => { navigate('lumo://settings'); setShowMenu(false); }}
            onNavigate={navigate}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPrint={handlePrint}
          />
        )}
      </div>

      {/* ── Content area: always flex-row ── */}
      {/*   [vertical-tabs?] | [page content] | [AI/Agent sidebar on RIGHT] */}
      <div className="flex flex-row flex-1 overflow-hidden relative">

        {/* Vertical tab sidebar (left, only in vertical layout mode) */}
        {isVertical && (
          <BrowserTabBar
            tabs={tabs}
            onTabSelect={selectTab}
            onTabClose={closeTab}
            onTabAdd={addTab}
            vertical
          />
        )}

        {/* ── Page content — fills remaining space ── */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e] relative min-w-0">
          {tabs.map((tab) => {
            const isNtp = !tab.url || tab.url === 'lumo://newtab';
            const isSettings   = tab.url === 'lumo://settings';
            const isHistory    = tab.url === 'lumo://history';
            const isBookmarks  = tab.url === 'lumo://bookmarks';
            const isAbout      = tab.url === 'lumo://about';
            const isExtensions = tab.url === 'lumo://extensions';
            const isDownloads  = tab.url === 'lumo://downloads';
            const isCompare    = tab.url.startsWith('lumo://compare');
            const isWelcome    = tab.url === 'lumo://welcome';
            const isInternal = isNtp || isSettings || isHistory || isBookmarks || isAbout || isExtensions || isDownloads || isCompare || isWelcome;

            return (
              <div
                key={tab.id}
                className={`absolute inset-0 flex flex-col ${tab.isActive ? 'z-10 visible' : 'z-0 hidden'}`}
              >
                <React.Suspense fallback={<div className="flex-1 bg-[#f8f9fa] dark:bg-[#1e1e1e]" />}>
                  {isWelcome && <WelcomePage onComplete={handleOnboardingComplete} />}
                  {isNtp && !isWelcome && <NewTabPage onNavigate={navigate} isDark={isDark} />}
                  {isDownloads && <DownloadsPage onNavigate={navigate} />}
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
                </React.Suspense>
                {isAbout && (
                  <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#f8f9fa] dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-2xl font-bold text-white">L</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-1">Lumo Browser</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Version 0.2.0</p>
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
                    isDark={isDark}
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

        {/* ── AI Sidebar — RIGHT side, resizable ── */}
        {showAI && (
          <div
            style={{ width: sidebarWidth, minWidth: 280, maxWidth: 640 }}
            className="absolute right-0 top-0 bottom-0 z-20 flex flex-shrink-0 h-full border-l border-gray-200 dark:border-[#333] bg-white shadow-2xl dark:bg-[#1e1e1e]"
          >
            {/* Drag handle on the LEFT edge of the sidebar */}
            <div
              onMouseDown={handleResizeMouseDown}
              className="w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600/70 transition-colors flex-shrink-0"
              title="Drag to resize"
            />
            <AISidebar
              isOpen={showAI}
              onClose={() => setShowAI(false)}
              currentUrl={currentUrl}
              pageTitle={activeTab?.title ?? ''}
              width={sidebarWidth - 6}
            />
          </div>
        )}

        {/* ── Agent Sidebar — RIGHT side, resizable ── */}
        {showAgent && (
          <div
            style={{ width: sidebarWidth, minWidth: 280, maxWidth: 640 }}
            className="absolute right-0 top-0 bottom-0 z-20 flex flex-shrink-0 h-full border-l border-gray-200 dark:border-[#333] bg-white shadow-2xl dark:bg-[#1e1e1e]"
          >
            {/* Drag handle on the LEFT edge of the sidebar */}
            <div
              onMouseDown={handleResizeMouseDown}
              className="w-1.5 h-full cursor-col-resize hover:bg-purple-500/50 active:bg-purple-600/70 transition-colors flex-shrink-0"
              title="Drag to resize"
            />
            <AgentSidebar
              onClose={() => setShowAgent(false)}
              activeTab={activeTab}
              openRouterApiKey={settings.openRouterApiKey}
            />
          </div>
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

      {contextMenu.show && contextMenu.params && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(prev => ({ ...prev, show: false }))}
          items={(() => {
            const wv = document.getElementById(`webview-${contextMenu.tabId}`) as any;
            const isWebviewTab = !!(wv && typeof wv.inspectElement === 'function');
            const isDevToolsOpen = isWebviewTab ? !!(wv.isDevToolsOpened?.()) : false;
            const hasSelection = (contextMenu.params?.selectionText?.trim()?.length ?? 0) > 0;
            const hasLink = !!contextMenu.params?.linkURL;

            const items: any[] = [];

            // Navigation — only on real webview tabs
            if (isWebviewTab) {
              items.push({ id: 'back', label: 'Back', icon: <ArrowLeft size={15} />, shortcut: 'Alt+Left', onClick: () => wv?.goBack() });
              items.push({ id: 'forward', label: 'Forward', icon: <ArrowRight size={15} />, shortcut: 'Alt+Right', onClick: () => wv?.goForward() });
              items.push({ id: 'reload', label: 'Reload Page', icon: <RotateCw size={15} />, shortcut: 'Ctrl+R', onClick: () => wv?.reload() });
              items.push({ id: 's1', label: '', isSeparator: true });
            }

            // Open link in new tab
            if (hasLink) {
              items.push({ id: 'open-link', label: 'Open Link in New Tab', icon: <ArrowRight size={15} />, onClick: () => { addTab(contextMenu.params.linkURL); } });
              items.push({ id: 'copy-link', label: 'Copy Link Address', icon: <Copy size={15} />, onClick: () => navigator.clipboard.writeText(contextMenu.params.linkURL) });
              items.push({ id: 's-link', label: '', isSeparator: true });
            }

            // Text selection actions
            if (hasSelection) {
              items.push({ id: 'copy', label: 'Copy', icon: <Copy size={15} />, shortcut: 'Ctrl+C', onClick: () => isWebviewTab ? wv?.copy() : document.execCommand('copy') });
              items.push({ id: 'ai-sel', label: 'Ask AI About Selection', icon: <Sparkles size={15} />, onClick: () => setShowAgent(true) });
              items.push({ id: 's2', label: '', isSeparator: true });
            }

            // Page Actions (Save, Source, Screenshot, Print)
            if (isWebviewTab && !hasLink && !hasSelection) {
              items.push({ id: 'save-page', label: 'Save Page As...', icon: <Download size={15} />, shortcut: 'Ctrl+S', onClick: () => wv?.downloadURL(wv.getURL()) });
              items.push({ id: 'print-page', label: 'Print...', icon: <Printer size={15} />, shortcut: 'Ctrl+P', onClick: () => wv?.print() });
              items.push({ id: 'screenshot', label: 'Take Screenshot', icon: <Camera size={15} />, onClick: async () => {
                if (window.electron?.invoke) {
                  const { base64 } = await window.electron.invoke('lumo:capture-webview');
                  if (base64) {
                    const link = document.createElement('a');
                    link.download = `Screenshot-${Date.now()}.jpg`;
                    link.href = `data:image/jpeg;base64,${base64}`;
                    link.click();
                  }
                }
              } });
              items.push({ id: 'view-source', label: 'View Page Source', icon: <FileText size={15} />, shortcut: 'Ctrl+U', onClick: () => { addTab(`view-source:${wv.getURL()}`); } });
              items.push({ id: 's-page', label: '', isSeparator: true });
            }

            // AI Agent
            items.push({ id: 'ai-agent', label: 'Open AI Agent', icon: <Sparkles size={15} />, onClick: () => setShowAgent(true) });

            items.push({ id: 's3', label: '', isSeparator: true });

            // Inspect — label reflects current state
            items.push({
              id: 'inspect',
              label: isDevToolsOpen ? 'Close DevTools' : 'Inspect Element',
              icon: <Code size={15} />,
              shortcut: 'Ctrl+Shift+I',
              onClick: () => {
                if (isWebviewTab) {
                  isDevToolsOpen ? wv.closeDevTools() : wv.inspectElement(contextMenu.params?.x ?? 0, contextMenu.params?.y ?? 0);
                } else {
                  window.electron?.send?.('lumo:toggle-devtools');
                }
              }
            });

            return items;
          })()}
        />
      )}
      {/* Tab Group Modal */}
      {tabGrouping.isOpen && (
        <TabGroupModal
          tabs={tabs}
          groups={tabGrouping.groups}
          isLoading={tabGrouping.isLoading}
          error={tabGrouping.error}
          onApply={applyTabGroups}
          onClose={() => setTabGrouping(s => ({ ...s, isOpen: false }))}
        />
      )}

    </div>
  );
}
