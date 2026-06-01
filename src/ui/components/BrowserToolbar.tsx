/**
 * BrowserToolbar — Chrome/Edge-accurate address bar + controls
 * One AI button. No developer panels. Pure browser chrome.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X as XIcon,
  ShieldCheck,
  Shield,
  Search,
  Star,
  StarOff,
  Puzzle,
  User,
  Sparkles,
  MoreHorizontal,
  Sun,
  Moon,
  RefreshCcw,
  Cpu,
} from 'lucide-react';

interface BrowserToolbarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  isSecure: boolean;
  isDark: boolean;
  isLoggedIn: boolean;
  userEmail?: string;
  isBookmarked: boolean;
  isAISidebarOpen: boolean;
  isAgentOpen: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onStop: () => void;
  onNavigate: (url: string) => void;
  onToggleTheme: () => void;
  onToggleExtensions: () => void;
  onOpenAccount: () => void;
  onToggleAI: () => void;
  onToggleAgent: () => void;
  onToggleBookmark: () => void;
  onOpenMenu: () => void;
  searchEngineUrl?: string;
}

export function BrowserToolbar({
  url,
  canGoBack,
  canGoForward,
  isLoading,
  isSecure,
  isDark,
  isLoggedIn,
  userEmail,
  isBookmarked,
  isAISidebarOpen,
  isAgentOpen,
  onBack,
  onForward,
  onRefresh,
  onStop,
  onNavigate,
  onToggleTheme,
  onToggleExtensions,
  onOpenAccount,
  onToggleAI,
  onToggleAgent,
  onToggleBookmark,
  onOpenMenu,
  searchEngineUrl = 'https://www.google.com/search?q=',
}: BrowserToolbarProps): React.ReactElement {
  const [draftUrl, setDraftUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when not focused
  useEffect(() => {
    if (!isFocused) setDraftUrl(url);
  }, [url, isFocused]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setDraftUrl(url);
    requestAnimationFrame(() => inputRef.current?.select());
  }, [url]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setDraftUrl(url);
  }, [url]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = draftUrl.trim();
    if (!raw) return;

    let resolved: string;
    if (raw.toLowerCase().startsWith('compare ')) {
      const query = raw.slice(8).trim();
      resolved = `nova://compare?q=${encodeURIComponent(query)}`;
    } else if (raw.startsWith('nova://')) {
      resolved = raw;
    } else if (/^https?:\/\//i.test(raw)) {
      resolved = raw;
    } else if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(raw) && !raw.includes(' ')) {
      resolved = `https://${raw}`;
    } else {
      resolved = `${searchEngineUrl}${encodeURIComponent(raw)}`;
    }

    onNavigate(resolved);
    inputRef.current?.blur();
  };

  // Displayed in the bar when not focused — strip protocol for cleanliness
  const displayValue = isFocused
    ? draftUrl
    : url.replace(/^https?:\/\//, '').replace(/\/$/, '') || '';

  const isNtpPage = !url || url === 'nova://newtab';

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 h-11
      bg-white dark:bg-[#2d2d2d]
      border-b border-gray-200 dark:border-[#3a3a3a]
      flex-shrink-0">

      {/* ── Navigation Controls ── */}
      <div className="flex items-center gap-px">
        <NavBtn
          onClick={onBack}
          disabled={!canGoBack}
          title="Back (Alt+Left)"
          id="nav-back"
        >
          <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </NavBtn>

        <NavBtn
          onClick={onForward}
          disabled={!canGoForward}
          title="Forward (Alt+Right)"
          id="nav-forward"
        >
          <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </NavBtn>

        <NavBtn
          onClick={isLoading ? onStop : onRefresh}
          title={isLoading ? 'Stop (Esc)' : 'Refresh (F5)'}
          id="nav-refresh"
        >
          {isLoading
            ? <XIcon className="w-4 h-4" strokeWidth={2.5} />
            : <RotateCcw className="w-[15px] h-[15px]" strokeWidth={2.5} />
          }
        </NavBtn>
      </div>

      {/* ── Address Bar ── */}
      <form onSubmit={handleSubmit} className="flex-1 min-w-0 mx-1">
        <div
          className={`
            flex items-center gap-2 h-8 px-3 rounded-full transition-all duration-150
            ${isFocused
              ? 'bg-white dark:bg-[#1e1e1e] ring-2 ring-blue-500 shadow-sm'
              : 'bg-gray-100 dark:bg-[#3a3a3a] hover:bg-gray-200 dark:hover:bg-[#404040]'
            }
          `}
        >
          {/* Security / Search icon */}
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isFocused ? (
              <Search className="w-3.5 h-3.5 text-gray-400" />
            ) : isNtpPage ? (
              <Search className="w-3.5 h-3.5 text-gray-400" />
            ) : isSecure ? (
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-gray-400" />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={(e) => setDraftUrl(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search Google or enter address"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            spellCheck={false}
            autoComplete="off"
            id="address-bar"
          />

          {/* Bookmark star — only when not focused and not NTP */}
          {!isFocused && !isNtpPage && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onToggleBookmark(); }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
            >
              {isBookmarked
                ? <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                : <StarOff className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>
      </form>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-0.5">
        {/* Agent — Autonomous Browser Control */}
        <NavBtn
          onClick={onToggleAgent}
          title="Nova Agent (Ctrl+Shift+R)"
          id="btn-agent"
          active={isAgentOpen}
        >
          <Cpu className="w-4 h-4" />
        </NavBtn>

        {/* AI Assistant — primary AI entry point */}
        <NavBtn
          onClick={onToggleAI}
          title="Nova AI (Ctrl+Shift+A)"
          id="btn-ai"
          active={isAISidebarOpen}
        >
          <Sparkles className="w-4 h-4" />
        </NavBtn>

        {/* Extensions */}
        <NavBtn
          onClick={onToggleExtensions}
          title="Extensions"
          id="btn-extensions"
        >
          <Puzzle className="w-4 h-4" />
        </NavBtn>

        {/* Theme toggle */}
        <NavBtn
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          id="btn-theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </NavBtn>

        {/* Data Sync */}
        <button
          onClick={onOpenAccount}
          id="btn-account"
          title="Import Browser Data"
          className="ml-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
            transition-all duration-150 bg-gray-200 dark:bg-[#3a3a3a] hover:bg-gray-300 dark:hover:bg-[#444] text-gray-600 dark:text-gray-400"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>

        {/* Menu (3-dot) */}
        <NavBtn
          onClick={onOpenMenu}
          title="Settings and more"
          id="btn-menu"
        >
          <MoreHorizontal className="w-4 h-4" />
        </NavBtn>
      </div>
    </div>
  );
}

// Reusable nav button
function NavBtn({
  children,
  onClick,
  disabled = false,
  title,
  id,
  active = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  id?: string;
  active?: boolean;
}): React.ReactElement {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-8 h-8 rounded-full flex items-center justify-center transition-all duration-100
        ${disabled
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : active
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] active:bg-gray-200 dark:active:bg-[#444]'
        }
      `}
    >
      {children}
    </button>
  );
}
