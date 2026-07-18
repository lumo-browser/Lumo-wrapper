/**
 * Lumo Browser — Root Application Shell
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

import { NewTabPage } from './pages/NewTabPage';
import { PrivateNewTabPage } from './pages/PrivateNewTabPage';
import { HistoryPage } from './pages/HistoryPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExtensionsPage } from './pages/ExtensionsPage';
import { PasswordManagerPage } from './pages/PasswordManagerPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { SecurityDashboard } from './ui/components/SecurityDashboard';
import { PermissionRequest } from './ui/components/PermissionRequest';
import { AddProfileModal } from './ui/components/AddProfileModal';

// ── Internal Pages ─────────────────────────────────────────────────────────
const getCleanTitle = (url: string): string => {
  if (!url) return 'New Tab';
  const urlLower = url.toLowerCase();
  if (urlLower === 'lumo://newtab') return 'New Tab';
  if (urlLower.startsWith('lumo://')) {
    const page = urlLower.replace('lumo://', '').split('?')[0];
    return page.charAt(0).toUpperCase() + page.slice(1);
  }
  return url.replace(/^https?:\/\//, '').split('/')[0];
};


const SCOPE = 'App';

// ── WebviewTab — wraps <webview> with imperative navigation ──────────────────
interface WebviewTabProps {
  tabId: string;
  url: string;
  isDark: boolean;
  zeroTrustMode: boolean;
  activeProfileId: string;
  blockPopups: boolean;
  permissions: { camera: boolean; microphone: boolean; location: boolean; notifications: boolean };
  askSavePasswords: boolean;
  autofillPasswords: boolean;
  onTitleChange: (title: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onUrlChange: (url: string) => void;
  onNavStateChange: (canGoBack: boolean, canGoForward: boolean) => void;
  onPasswordCaptured: (entry: { url: string; username: string; password: string }) => void;
  onNewTab: (url?: string) => void;
}

function WebviewTab({ tabId, url, isDark, zeroTrustMode, activeProfileId, blockPopups, permissions, askSavePasswords, autofillPasswords, onTitleChange, onLoadingChange, onUrlChange, onNavStateChange, onPasswordCaptured, onNewTab }: WebviewTabProps) {
  const ref = useRef<any>(null);
  const initialUrl = useRef(url);
  const ztRef = useRef(zeroTrustMode);
  const profileRef = useRef(activeProfileId);
  const askSaveRef = useRef(askSavePasswords);
  const autofillRef = useRef(autofillPasswords);
  const urlRef = useRef(url);
  profileRef.current = activeProfileId;
  ztRef.current = zeroTrustMode;
  askSaveRef.current = askSavePasswords;
  autofillRef.current = autofillPasswords;

  // React to external URL changes
  useEffect(() => {
    const wv = ref.current;
    if (wv && url !== urlRef.current) {
      urlRef.current = url;
      if (typeof wv.loadURL === 'function') {
        wv.loadURL(url).catch(() => {});
      }
    }
  }, [url]);

  // Wire up webview events once on mount
  useEffect(() => {
    const wv = ref.current;
    if (!wv) return;

    const onStartLoad = () => onLoadingChange(true);
    const onStopLoad  = () => onLoadingChange(false);
    const onTitleUpd  = (e: any) => onTitleChange(e.title || '');
    const onNavigated = (e: any) => {
      urlRef.current = e.url || '';
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

      // Force 100% zoom
      if (typeof wv.setZoomLevel === 'function') {
        try {
          wv.setZoomLevel(0);
        } catch (e) {
          console.warn('Could not set zoom level', e);
        }
      }

      // ── Password capture script ──────────────────────────────────────────
      if (askSaveRef.current) {
        const pwdScript = `
          (function() {
            try {
              if (window._lumoPwdCapture) return;
              window._lumoPwdCapture = true;

              function captureForm(form) {
                var pwdField = form.querySelector('input[type="password"]');
                if (!pwdField || !pwdField.value) return;
                var usernameField = form.querySelector('input[type="text"],input[type="email"],input[name="username"],input[name="email"],input[name="login"],input[name="user"]');
                var username = usernameField ? usernameField.value : '';
                var data = JSON.stringify({
                  url: location.href,
                  username: username,
                  password: pwdField.value
                });
                console.log('[LumoPassword]' + data);
              }

              document.addEventListener('submit', function(e) {
                try { captureForm(e.target); } catch(ex) {}
              }, true);

              document.querySelectorAll('form').forEach(function(f) {
                var submitBtns = f.querySelectorAll('button[type="submit"],input[type="submit"]');
                for (var i = 0; i < submitBtns.length; i++) {
                  submitBtns[i].addEventListener('click', function() {
                    try { captureForm(f); } catch(ex) {}
                  });
                }
              });
            } catch(e) {}
          })();
        `;
        wv.executeJavaScript(pwdScript).catch(() => {});
      }

      // ── Password autofill ────────────────────────────────────────────────
      if (autofillRef.current) {
        const currentUrl = urlRef.current;
        try {
          const u = new URL(currentUrl);
          const domain = u.hostname.replace(/^www\./, '');
          (window as any).electron?.vaultGetAll(profileRef.current).then((entries: any[]) => {
            const match = entries.find((e: any) => {
              try { return new URL(e.url).hostname.replace(/^www\./, '') === domain; } catch { return false; }
            });
            if (match) {
              const fillScript = `
                (function() {
                  try {
                    var pwdField = document.querySelector('input[type="password"]');
                    if (!pwdField) return;
                    var usernameField = document.querySelector('input[type="text"],input[type="email"],input[name="username"],input[name="email"],input[name="login"],input[name="user"]');
                    if (usernameField) { usernameField.value = ${JSON.stringify(match.username)}; usernameField.dispatchEvent(new Event('input', { bubbles: true })); }
                    pwdField.value = ${JSON.stringify(match.password)}; pwdField.dispatchEvent(new Event('input', { bubbles: true }));
                  } catch(e) {}
                })();
              `;
              wv.executeJavaScript(fillScript).catch(() => {});
            }
          }).catch(() => {});
        } catch {}
      }
    };

    // ── Password capture from console-message ──────────────────────────────
    const onConsoleMessage = (e: any) => {
      if (typeof e.message === 'string' && e.message.startsWith('[LumoPassword]')) {
        try {
          const data = JSON.parse(e.message.slice('[LumoPassword]'.length));
          if (data.password && askSaveRef.current) {
            onPasswordCaptured({ url: data.url, username: data.username, password: data.password });
          }
        } catch {}
      }
    };
    wv.addEventListener('console-message', onConsoleMessage);

    const onContextMenu = (e: any) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('lumo:show-context-menu', {
        detail: { x: e.params.x, y: e.params.y, params: e.params, tabId }
      }));
    };

    wv.addEventListener('dom-ready', onDomReady);
    wv.addEventListener('context-menu', onContextMenu);

    // ZT-mode: monitor partition
    if (zeroTrustMode) {
      window.electron?.monitorTabPartition(`tab-${tabId}`);
    }

    // Handle new-window events: Ctrl+click / Shift+click → open in new tab
    const onNewWindow = (e: any) => {
      const targetUrl = e.url;
      if (!targetUrl || targetUrl === 'about:blank') return;

      if (zeroTrustMode || blockPopups) {
        if (e.disposition === 'new-window' || e.disposition === 'foreground-tab') {
          e.preventDefault();
          onNewTab(targetUrl);
        } else {
          e.preventDefault();
          console.log(`[${zeroTrustMode ? 'ZT' : 'Popups'}] Blocked popup: ${targetUrl}`);
        }
      } else {
        e.preventDefault();
        onNewTab(targetUrl);
      }
    };
    wv.addEventListener('new-window', onNewWindow);
    wv.addEventListener('destroyed', () => {
      wv.removeEventListener('new-window', onNewWindow);
    });

    // Permission requests (camera, mic, location, notifications)
    const onPermissionRequest = (e: any) => {
      const permMap: Record<string, keyof typeof permissions> = {
        media: 'camera',
        mediaKeySystem: 'camera',
        geolocation: 'location',
        notifications: 'notifications',
      };
      const settingKey = permMap[e.permission];
      if (settingKey && !permissions[settingKey]) {
        e.request.deny();
      } else {
        e.request.grant();
      }
    };
    wv.addEventListener('permission-request', onPermissionRequest);

    return () => {
      wv.removeEventListener('did-start-loading', onStartLoad);
      wv.removeEventListener('did-stop-loading',  onStopLoad);
      wv.removeEventListener('page-title-updated', onTitleUpd);
      wv.removeEventListener('did-navigate',      onNavigated);
      wv.removeEventListener('did-navigate-in-page', onNavigated);
      wv.removeEventListener('dom-ready',         onDomReady);
      wv.removeEventListener('context-menu',      onContextMenu);
      wv.removeEventListener('permission-request', onPermissionRequest);
      wv.removeEventListener('console-message', onConsoleMessage);
    };
  }, [isDark, onTitleChange, onLoadingChange, onUrlChange, onNavStateChange, zeroTrustMode, blockPopups, permissions, askSavePasswords, autofillPasswords, onPasswordCaptured, onNewTab]);

  return (
    <webview
      ref={ref}
      id={`webview-${tabId}`}
      src={initialUrl.current || 'about:blank'}
      className="w-full h-full border-none bg-white"
      preload={window.electron?.webviewPreloadPath}
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
      partition={zeroTrustMode ? `tab-${tabId}` : (window.location.search.includes('disposable=true') ? window._lumoDisposablePartition : (window as any)._lumoActiveProfileId ? `persist:lumo-profile-${(window as any)._lumoActiveProfileId}` : "persist:lumo-main")}
      webpreferences={zeroTrustMode ? "sandbox=true" : undefined}
    />
  );
}


// ── Tab helpers ────────────────────────────────────────────────────────────
const mkTab = (overrides: Partial<BrowserTab> = {}): BrowserTab => ({
  id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: 'New Tab',
  url: '',
  isActive: false,
  isLoading: false,
  ...overrides,
});

const _isFirstLaunch = (() => {
  try { return !JSON.parse(localStorage.getItem('lumo-onboarding') || '{}').complete; }
  catch { return true; }
})();

const INITIAL_TABS: BrowserTab[] = [
  mkTab({ id: 'tab-1', title: _isFirstLaunch ? 'Welcome to Lumo' : 'New Tab', url: _isFirstLaunch ? 'lumo://welcome' : '', isActive: true }),
];

// ── Navigation history per tab ─────────────────────────────────────────────
interface NavHistory {
  stack: string[];
  cursor: number;
}
const emptyHistory = (): NavHistory => ({ stack: [], cursor: -1 });

// ── App ────────────────────────────────────────────────────────────────────
export default function App(): React.ReactElement {
  const isDisposable = window.location.search.includes('disposable=true');
  if (isDisposable && !(window as any)._lumoDisposablePartition) {
    const params = new URLSearchParams(window.location.search);
    (window as any)._lumoDisposablePartition = params.get('partition') || `disposable-session-${Date.now()}`;
  }

  // Profile Management
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const pid = localStorage.getItem('lumo-active-profile') || '1';
    (window as any)._lumoActiveProfileId = pid;
    return pid;
  });
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(true);
  const [internalZoom, setInternalZoom] = useState(1);
  const [zeroTrustMode, setZeroTrustMode] = useState(false);

  useEffect(() => {
    window.electron?.getZeroTrustMode().then(setZeroTrustMode).catch(() => {});
    const unsub = window.electron?.onZeroTrustModeChanged(setZeroTrustMode);
    return () => unsub?.();
  }, []);

  const handleOnboardingComplete = (prefs: OnboardingPrefs) => {
    setSettings(s => ({ ...s, searchEngine: prefs.searchEngine as any, blockAds: prefs.adBlockEnabled }));
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
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    try {
      const saved = localStorage.getItem(`lumo-tabs-${activeProfileId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return INITIAL_TABS;
  });
  const [, setRecentlyClosedTabs] = useState<BrowserTab[]>([]);
  const activeTab = tabs.find((t) => t.isActive) ?? tabs[0];

  // Per-tab nav history
  const [navHistories, setNavHistories] = useState<Record<string, NavHistory>>(() => {
    const h: Record<string, NavHistory> = {};
    tabs.forEach((t) => {
      h[t.id] = { stack: [t.url || 'lumo://newtab'], cursor: 0 };
    });
    return h;
  });

  // Bookmark state — rich entries with title and timestamp
  const [bookmarkEntries, setBookmarkEntries] = useState<BookmarkEntry[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`lumo-bookmarks-${activeProfileId}`) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  // History state
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`lumo-history-${activeProfileId}`) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  // Download items — shared state so toolbar badge can show count
  const [, setDownloadItems] = useState<any[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`lumo-downloads-${activeProfileId}`) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
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
        if (!isDisposable) {
          localStorage.setItem('lumo-downloads', JSON.stringify(updated));
        }
        return updated;
      });
    });
    return () => unsub?.();
  }, [isDisposable]);

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
        setTabs(prev => {
          const active = prev.find(t => t.isActive);
          if (active?.url === 'lumo://downloads') {
            window.dispatchEvent(new CustomEvent('lumo:go-back'));
          } else {
            window.dispatchEvent(new CustomEvent('lumo:open-page', { detail: 'lumo://downloads' }));
          }
          return prev;
        });
      } else if (action === 'toggle-inspector') {
        const active = tabs.find(t => t.isActive);
        if (!active) return;
        const wv = document.getElementById('webview-' + active.id) as any;
        if (!wv || typeof wv.isDevToolsOpened !== 'function') return;
        if (wv.isDevToolsOpened()) {
          wv.closeDevTools();
        } else {
          wv.openDevTools({ mode: 'bottom' });
        }
      } else if (action === 'go-back') {
        window.dispatchEvent(new CustomEvent('lumo:go-back'));
      } else if (action === 'go-forward') {
        window.dispatchEvent(new CustomEvent('lumo:go-forward'));
      } else if (action === 'close-tab') {
        window.dispatchEvent(new CustomEvent('lumo:close-tab'));
      } else if (action === 'new-tab') {
        window.dispatchEvent(new CustomEvent('lumo:new-tab'));
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
      aiProvider: 'openrouter',
      ollamaUrl: 'http://localhost:11434',
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
      trackingLevel: 'standard',
      blockCryptominers: true,
      blockFingerprinters: true,
      blockSocialTrackers: true,
      totalCookieProtection: true,
      doNotSell: true,
      askSavePasswords: true,
      autofillPasswords: true,
      suggestStrongPasswords: true,
      breachAlerts: true,
      primaryPassword: false,
      historyMode: 'remember',
      autoplayPerm: 'ask',
      blockDangerous: true,
      blockDangerousDownloads: true,
      warnUnwanted: true,
      httpsOnly: false,
      dnsMode: 'off',
      dnsProvider: 'Cloudflare',
      sendTelemetry: false,
      sendCrashReports: false,
      adMeasurement: false,
    };
    try { 
      const parsed = JSON.parse(localStorage.getItem(`lumo-settings-${activeProfileId}`) || '{}');
      return { ...defaults, ...parsed, openRouterApiKey: '' }; // Keep api key blank initially
    } catch { return defaults; }
  });

  // React to profile switches by reloading all isolated states
  useEffect(() => {
    try {
      setBookmarkEntries(JSON.parse(localStorage.getItem(`lumo-bookmarks-${activeProfileId}`) || '[]'));
      setHistoryEntries(JSON.parse(localStorage.getItem(`lumo-history-${activeProfileId}`) || '[]'));
      setDownloadItems(JSON.parse(localStorage.getItem(`lumo-downloads-${activeProfileId}`) || '[]'));
      const parsedSettings = JSON.parse(localStorage.getItem(`lumo-settings-${activeProfileId}`) || '{}');
      setSettings(s => ({ ...s, ...parsedSettings }));
      // Restore tabs for this profile
      const savedTabs = localStorage.getItem(`lumo-tabs-${activeProfileId}`);
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed[0] = { ...parsed[0], isActive: true };
          setTabs(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load profile state', e);
    }
  }, [activeProfileId]);

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

  // Tab layout — read from lumo-general-settings, update live via custom event
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

  const handleSwitchProfile = useCallback((id: string) => {
    if (id === activeProfileId) {
      setShowAccount(false);
      return;
    }
    setShowAccount(false);
    setIsSwitchingProfile(true);
    setTimeout(() => {
      setActiveProfileId(id);
      localStorage.setItem('lumo-active-profile', id);
      (window as any)._lumoActiveProfileId = id;
      // Tell main process to monitor the new profile's partition for ad blocking and downloads
      if (id !== 'guest' && window.electron?.send) {
        window.electron.send('lumo:monitor-profile-partition', id);
      }
      setTimeout(() => {
        setIsSwitchingProfile(false);
      }, 1200);
    }, 300);
  }, [activeProfileId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (id) handleSwitchProfile(id);
    };
    window.addEventListener('lumo:switch-profile', handler);
    return () => window.removeEventListener('lumo:switch-profile', handler);
  }, [handleSwitchProfile]);

  // Refs for outside-click dismissal
  const menuRef       = useRef<HTMLDivElement>(null);
  const extRef        = useRef<HTMLDivElement>(null);
  const loadTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    logger.info(SCOPE, 'Lumo Browser started');

    // Restore theme from settings
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.fontSize = `${settings.fontSize}px`;

    // Sync initial ad blocker state to main process
    if (window.electron?.send) {
      window.electron.send('lumo:set-ad-blocker', settings.blockAds);
      window.electron.send('lumo:set-theme', settings.theme);
      // Monitor the active profile's partition for ad blocking and downloads
      window.electron.send('lumo:monitor-profile-partition', activeProfileId);
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
  useEffect(() => { localStorage.setItem(`lumo-bookmarks-${activeProfileId}`, JSON.stringify(bookmarkEntries)); }, [bookmarkEntries, activeProfileId]);
  useEffect(() => {
    if (!isDisposable) {
      localStorage.setItem(`lumo-history-${activeProfileId}`, JSON.stringify(historyEntries));
    }
  }, [historyEntries, isDisposable, activeProfileId]);
  
  useEffect(() => {
    if (!isDisposable) {
      try {
        const serializable = tabs.map(({ isActive, ...rest }) => rest);
        localStorage.setItem(`lumo-tabs-${activeProfileId}`, JSON.stringify(serializable));
      } catch { /* ignore quota errors */ }
    }
  }, [tabs, isDisposable, activeProfileId]);

  // Sync clearOnExit to main process for before-quit enforcement
  useEffect(() => {
    if (window.electron?.send) {
      window.electron.send('lumo:set-clear-on-exit', settings.clearOnExit);
    }
  }, [settings.clearOnExit]);

  useEffect(() => { 
    const { openRouterApiKey, ...safeSettings } = settings;
    localStorage.setItem(`lumo-settings-${activeProfileId}`, JSON.stringify(safeSettings)); 
    
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
      if (prev.length === 1) {
        if (window.electron?.send) {
          window.electron.send('lumo:window-close');
        }
        return prev;
      }
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

  const addTab = useCallback((overrideUrl?: string | any) => {
    const startUrl = typeof overrideUrl === 'string' ? overrideUrl : '';
    const t = mkTab({ isActive: true, url: startUrl, title: getCleanTitle(startUrl) });
    setTabs((prev) => [...prev.map((x) => ({ ...x, isActive: false })), t]);
    setNavHistories((prev) => {
      const h = emptyHistory();
      const urlToPush = startUrl || 'lumo://newtab';
      h.stack.push(urlToPush);
      h.cursor = 0;
      return { ...prev, [t.id]: h };
    });
  }, []);

  const handleNewDisposableWindow = useCallback(() => {
    (window as any).electron?.send?.('lumo:new-disposable-window');
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate = useCallback((url: string) => {
    if (!url || typeof url !== 'string') return;
    if (!activeTab) return;
    const tabId = activeTab.id;

    // Don't add internal pages to history
    const isInternal = url.toLowerCase().startsWith('lumo://');

    // Add to browsing history
    if (!isInternal && url && !isDisposable) {
      const entry: HistoryEntry = {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url,
        title: getCleanTitle(url),
        timestamp: Date.now(),
      };
      setHistoryEntries((prev) => [entry, ...prev].slice(0, 1000));
    }

    // Update tab immediately with loading state
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? { ...t, url, title: getCleanTitle(url), isLoading: true }
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
    setTabs((prev) => prev.map((t) => t.id === activeTab.id ? { ...t, url, title: getCleanTitle(url) } : t));
  }, [activeTab, navHistories]);

  const goForward = useCallback(() => {
    if (!activeTab) return;
    const h = navHistories[activeTab.id];
    if (!h || h.cursor >= h.stack.length - 1) return;
    const newCursor = h.cursor + 1;
    const url = h.stack[newCursor];
    setNavHistories((prev) => ({ ...prev, [activeTab.id]: { ...h, cursor: newCursor } }));
    setTabs((prev) => prev.map((t) => t.id === activeTab.id ? { ...t, url, title: getCleanTitle(url) } : t));
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
    if (activeTab.url?.toLowerCase().startsWith('lumo://') || !activeTab.url) {
      goBack();
      return;
    }
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.goBack === 'function' && typeof wv.canGoBack === 'function' && wv.canGoBack()) {
      wv.goBack();
    } else {
      goBack();
    }
  };

  const handleGoForward = () => {
    if (!activeTab) return;
    // For internal lumo:// pages there is no real webview — use React nav stack
    if (activeTab.url?.toLowerCase().startsWith('lumo://') || !activeTab.url) {
      goForward();
      return;
    }
    const wv = document.getElementById(`webview-${activeTab.id}`) as any;
    if (wv && typeof wv.goForward === 'function' && typeof wv.canGoForward === 'function' && wv.canGoForward()) {
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
      setInternalZoom(prev => Math.min(prev + 0.1, 3));
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
      setInternalZoom(prev => Math.max(prev - 0.1, 0.5));
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
    const visibleTabs = tabs.filter(t => t.url && !t.url.toLowerCase().startsWith('lumo://'));
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
        alert('Incognito mode is coming in the next Lumo update!');
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
      } else if (e.altKey && e.key.toLowerCase() === 'home') {
        e.preventDefault();
        navigate('lumo://newtab');
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleBookmark();
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const wv = activeTab ? document.getElementById(`webview-${activeTab.id}`) as any : null;
        if (wv?.getURL && wv?.downloadURL) {
          wv.downloadURL(wv.getURL());
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        if (activeTab?.url && !activeTab.url.startsWith('lumo://')) {
          addTab('view-source:' + activeTab.url);
        }
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        window.electron?.send?.('lumo:toggle-devtools');
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
    const onGoBack   = () => handleGoBack();
    const onGoForward = () => handleGoForward();
    const onOpenPage = (e: Event) => navigate((e as CustomEvent).detail as string);
    const onCloseTab = () => { if (activeTab) closeTab(activeTab.id); };
    const onNewTab   = () => addTab();
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
  }, [activeTab, addTab, closeTab, handleRefresh, handleGoBack, handleGoForward, handleStop, handleZoomIn, handleZoomOut, navigate, handlePrint, groupTabsWithAI, toggleBookmark]);

  const currentUrl = activeTab?.url ?? '';
  const currentHistory = navHistories[activeTab?.id ?? ''] ?? emptyHistory();
  const canGoBack    = (activeTab?.canGoBack === true) || (currentHistory.cursor > 0);
  const canGoForward = (activeTab?.canGoForward === true) || (currentHistory.cursor < currentHistory.stack.length - 1);
  const isSecure     = currentUrl.startsWith('https://');


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
          tabId={activeTab?.id || ''}
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
          isIncognito={activeTab?.isIncognito || isDisposable}
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
            onNavigate={(url) => { navigate(url); setShowMenu(false); }}
            onNewTab={() => { addTab(); setShowMenu(false); }}
            onNewDisposableWindow={() => { handleNewDisposableWindow(); setShowMenu(false); }}
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
            const tabUrlLower = (tab.url || '').toLowerCase();
            const isNtp = !tabUrlLower || tabUrlLower === 'lumo://newtab';
            const isSettings   = tabUrlLower === 'lumo://settings';
            const isHistory    = tabUrlLower === 'lumo://history';
            const isBookmarks  = tabUrlLower === 'lumo://bookmarks';
            const isAbout      = tabUrlLower === 'lumo://about';
            const isExtensions = tabUrlLower === 'lumo://extensions';
            const isDownloads  = tabUrlLower === 'lumo://downloads';
            const isCompare    = tabUrlLower.startsWith('lumo://compare');
            const isWelcome    = tabUrlLower === 'lumo://welcome';
            const isSecurity   = tabUrlLower === 'lumo://security';
            const isPasswords  = tabUrlLower === 'lumo://passwords';
            const isInternal = isNtp || isSettings || isHistory || isBookmarks || isAbout || isExtensions || isDownloads || isCompare || isWelcome || isSecurity || isPasswords;

            return (
              <div
                key={tab.id}
                className={`absolute inset-0 flex flex-col transition-opacity duration-0 ${tab.isActive ? 'z-10 opacity-100 visible' : 'z-[-1] opacity-0 invisible pointer-events-none'}`}
              >
                {isInternal && (
                  <div style={{ zoom: internalZoom, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <React.Suspense fallback={<div className="flex-1 bg-[#f8f9fa] dark:bg-[#1e1e1e]" />}>
                      {isWelcome && <WelcomePage onComplete={handleOnboardingComplete} />}
                  {isNtp && !isWelcome && !isDisposable && <NewTabPage onNavigate={navigate} isDark={isDark} />}
                  {isNtp && !isWelcome && isDisposable && (
                    <PrivateNewTabPage
                      onNavigate={navigate}
                      settings={settings}
                      onUpdateSettings={handleUpdateSettings}
                    />
                  )}
                  {isDownloads && <DownloadsPage onNavigate={navigate} />}
                  {isSettings && (
                    <SettingsPage
                      settings={settings}
                      activeProfileId={activeProfileId}
                      onUpdateSettings={handleUpdateSettings}
                      onClearBrowsingData={() => {
                        setHistoryEntries([]);
                        setBookmarkEntries([]);
                      }}
                      onNavigate={navigate}
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
                  {isPasswords && (
                    <PasswordManagerPage activeProfileId={activeProfileId} onNavigate={navigate} />
                  )}
                  {isSecurity && (
                    <SecurityDashboard 
                      url="lumo://security" 
                      isSecure={true} 
                      isIncognito={false} 
                      onClose={() => navigate('lumo://newtab')} 
                    />
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
                  </div>
                )}
                {!isInternal && (
                  <WebviewTab
                    key={`${tab.id}-${zeroTrustMode ? 'zt' : 'std'}-${activeProfileId}`}
                    tabId={tab.id}
                    url={tab.url}
                    isDark={isDark}
                    zeroTrustMode={zeroTrustMode}
                    activeProfileId={activeProfileId}
                    blockPopups={settings.blockPopups}
                    permissions={settings.permissions}
                    askSavePasswords={settings.askSavePasswords}
                    autofillPasswords={settings.autofillPasswords}
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
                    onNewTab={(url) => addTab(url)}
                    onPasswordCaptured={async (cred) => {
                      if (window.electron?.vaultSave && settings.askSavePasswords) {
                        try {
                          const domain = (() => { try { return new URL(cred.url).hostname.replace(/^www\./, ''); } catch { return cred.url; } })();
                          await window.electron.vaultSave(activeProfileId, {
                            url: cred.url,
                            domain,
                            username: cred.username,
                            password: cred.password,
                            title: domain,
                          });
                        } catch (err) {
                          console.error('Failed to auto-save password:', err);
                        }
                      }
                    }}
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
              openRouterApiKey={settings.openRouterApiKey}
              aiProvider={settings.aiProvider}
              ollamaUrl={settings.ollamaUrl}
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
            {/* <AgentSidebar
              onClose={() => setShowAgent(false)}
              activeTab={activeTab}
              openRouterApiKey={settings.openRouterApiKey}
              aiProvider={settings.aiProvider || 'openrouter'}
              ollamaUrl={settings.ollamaUrl || 'http://localhost:11434'}
            /> */}
          </div>
        )}

      </div>


      {/* ── Account modal ── */}
      <AccountModal
        isOpen={showAccount}
        activeProfileId={activeProfileId}
        profiles={settings.profiles && settings.profiles.length > 0 ? settings.profiles : [{ id: '1', name: 'Default User', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Default&backgroundColor=b6e3f4' }]}
        onSwitchProfile={handleSwitchProfile}
        onAddProfileClick={() => {
          setShowAccount(false);
          setShowAddProfileModal(true);
        }}
        onClose={() => setShowAccount(false)}
      />

      {showAddProfileModal && (
        <AddProfileModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowAddProfileModal(false)}
        />
      )}

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
              items.push({ id: 'print-page', label: 'Print...', icon: <Printer size={15} />, shortcut: 'Ctrl+P', onClick: () => {
                if (wv && typeof wv.getWebContentsId === 'function') {
                  window.electron?.send?.('lumo:print-page', wv.getWebContentsId());
                } else {
                  wv?.print();
                }
              } });
              items.push({ id: 'screenshot', label: 'Take Screenshot', icon: <Camera size={15} />, onClick: () => {
                if (wv && typeof wv.getWebContentsId === 'function') {
                  window.electron?.send?.('lumo:save-screenshot', wv.getWebContentsId());
                }
              } });
              items.push({ id: 'view-source', label: 'View Page Source', icon: <FileText size={15} />, shortcut: 'Ctrl+U', onClick: () => { addTab(`view-source:${wv.getURL()}`); } });
              items.push({ id: 's-page', label: '', isSeparator: true });
            }

            // AI Agent
            items.push({ id: 'ai-agent', label: 'Open AI Agent', icon: <Sparkles size={15} />, onClick: () => setShowAgent(true) });

            items.push({ id: 's3', label: '', isSeparator: true });

            // Inspect — opens docked DevTools (Firefox-like panel at bottom)
            items.push({
              id: 'inspect',
              label: isDevToolsOpen ? 'Close DevTools' : 'Inspect Element',
              icon: <Code size={15} />,
              shortcut: 'Ctrl+Shift+I',
              onClick: () => {
                if (isWebviewTab) {
                  if (isDevToolsOpen) {
                    wv.closeDevTools();
                  } else {
                    wv.openDevTools({ mode: 'bottom' });
                    if (contextMenu.params?.x !== undefined && contextMenu.params?.y !== undefined) {
                      wv.inspectElement(contextMenu.params.x, contextMenu.params.y);
                    }
                  }
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

      {/* Zero-Trust Permission Request Overlay */}
      <PermissionRequest />

      {/* Profile Switch Animation Overlay */}
      <div 
        className={`fixed inset-0 z-[200] bg-white dark:bg-[#121212] flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSwitchingProfile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className={`transition-all duration-700 delay-100 ${isSwitchingProfile ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          <div className="w-24 h-24 mb-6 relative mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Switching Workspace...</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mt-2">Loading your secure session and data</p>
        </div>
      </div>

    </div>
  );
}
