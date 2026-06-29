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
  Home,
  Download,
  Globe,
  Languages,
  EyeOff,
  Lock,
  Server,
  FileText,
  ExternalLink,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { SecurityDashboard } from './SecurityDashboard';

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
  onDownload?: () => void;
  isDownloadsOpen?: boolean;
  searchEngineUrl?: string;
  offerTranslate?: boolean;
  isIncognito?: boolean;
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
  onDownload,
  isDownloadsOpen = false,
  searchEngineUrl = 'https://www.google.com/search?q=',
  offerTranslate = true,
  isIncognito = false,
}: BrowserToolbarProps): React.ReactElement {
  const [draftUrl, setDraftUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSecurityDropdown, setShowSecurityDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchCache = useRef(new Map<string, string[]>());
  const abortControllerRef = useRef<AbortController | null>(null);
  const securityDropdownRef = useRef<HTMLDivElement>(null);

  // Helper to extract domain for OSINT/Recon
  const getDomain = (rawUrl: string): string => {
    try {
      if (!rawUrl || rawUrl.toLowerCase().startsWith('lumo://')) return '';
      const parsed = new URL(rawUrl);
      return parsed.hostname;
    } catch {
      return '';
    }
  };

  const domain = getDomain(url);

  // Close security dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (securityDropdownRef.current && !securityDropdownRef.current.contains(event.target as Node)) {
        setShowSecurityDropdown(false);
      }
    }
    if (showSecurityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSecurityDropdown]);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!isFocused || !draftUrl.trim() || draftUrl === url || isIncognito) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const timer = setTimeout(async () => {
      try {
        const query = draftUrl.trim();
        // Skip URL-like queries
        if (/^https?:\/\//i.test(query) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(query) || /^lumo:\/\//i.test(query)) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        // Check cache
        if (searchCache.current.has(query)) {
          setSuggestions(searchCache.current.get(query)!);
          setShowSuggestions(true);
          setSelectedIndex(-1);
          return;
        }

        setIsSuggestionsLoading(true);
        setShowSuggestions(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Google Autocomplete using JSONP to bypass CORS
        const data = await new Promise<any[]>((resolve, reject) => {
          const callbackName = 'jsonp_ac_' + Math.round(1000000 * Math.random());
          const script = document.createElement('script');
          
          let timeoutId: any;

          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (script.parentNode) script.parentNode.removeChild(script);
            delete (window as any)[callbackName];
          };

          if (controller.signal) {
            controller.signal.addEventListener('abort', () => {
              cleanup();
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }

          (window as any)[callbackName] = (resData: any) => {
            cleanup();
            resolve(resData);
          };

          // Google supports JSONP with client=youtube and jsonp= query parameters
          script.src = `https://suggestqueries.google.com/complete/search?client=youtube&q=${encodeURIComponent(query)}&jsonp=${callbackName}`;
          script.onerror = () => {
            cleanup();
            reject(new Error('JSONP failed'));
          };

          document.head.appendChild(script);

          // Fallback timeout so it doesn't hang forever
          timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('JSONP timeout'));
          }, 3000);
        });

        if (Array.isArray(data) && Array.isArray(data[1])) {
          const results = data[1].slice(0, 8).map((item: any) => item[0]);
          searchCache.current.set(query, results);
          setSuggestions(results);
        } else {
          searchCache.current.set(query, []);
          setSuggestions([]);
        }
        setSelectedIndex(-1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch suggestions:', err);
          setSuggestions([]);
        }
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [draftUrl, isFocused, url]);

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
    setShowSuggestions(false);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      const raw = suggestions[selectedIndex];
      onNavigate(raw.toLowerCase().startsWith('lumo://') ? raw : `${searchEngineUrl}${encodeURIComponent(raw)}`);
      inputRef.current?.blur();
      setShowSuggestions(false);
      return;
    }
    const raw = draftUrl.trim();
    if (!raw) return;

    let resolved: string;
    if (raw.toLowerCase().startsWith('compare ')) {
      const query = raw.slice(8).trim();
      resolved = `lumo://compare?q=${encodeURIComponent(query)}`;
    } else if (/^lumo:\/\//i.test(raw)) {
      resolved = raw.toLowerCase().startsWith('lumo://') ? raw : raw.replace(/^lumo:\/\//i, 'lumo://');
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

  // Format URL for clean display when not focused (Safari-style)
  const getDisplayValue = () => {
    if (isFocused) return draftUrl;
    if (!url || url === 'lumo://newtab') return '';
    
    try {
      const u = new URL(url);
      
      // 1. Extract and show search queries for known search engines
      const searchEngines = ['google.com', 'search.brave.com', 'bing.com', 'duckduckgo.com', 'ecosia.org'];
      if (searchEngines.some(domain => u.hostname.includes(domain)) && u.pathname.startsWith('/search')) {
        const q = u.searchParams.get('q');
        if (q) return q;
      }

      // 2. For all other URLs, show domain + path (strip complex query strings & hashes)
      // e.g. "mail.google.com/mail/u/0/#inbox" -> "mail.google.com/mail/u/0"
      let clean = u.hostname.replace(/^www\./, '');
      if (u.pathname !== '/') clean += u.pathname;
      return clean.replace(/\/$/, ''); // strip trailing slash
    } catch {
      // Fallback for invalid URLs or internal Lumo:// URLs
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  };

  const displayValue = getDisplayValue();

  const isNtpPage = !url || url === 'lumo://newtab';

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 h-[49px]
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

        {/* Lumo Home — navigate to new tab / home page */}
        <NavBtn
          onClick={() => onNavigate('lumo://newtab')}
          title="Lumo Home (Alt+Home)"
          id="nav-home"
          active={isNtpPage}
        >
          <Home className="w-[16px] h-[16px]" strokeWidth={2} />
        </NavBtn>
      </div>

      {/* ── Address Bar ── */}
      <form onSubmit={handleSubmit} className="relative flex-1 min-w-0 mx-1">
        <div
          className={`
            flex items-center gap-2 h-[37px] px-3 rounded-full transition-all duration-150
            ${isFocused
              ? 'bg-white dark:bg-[#1e1e1e] ring-2 ring-blue-500 shadow-sm'
              : 'bg-gray-100 dark:bg-[#3a3a3a] hover:bg-gray-200 dark:hover:bg-[#404040]'
            }
          `}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowSecurityDropdown(!showSecurityDropdown);
            }}
            disabled={isFocused || isNtpPage}
            className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
              isFocused || isNtpPage
                ? 'cursor-default'
                : 'cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700/60'
            }`}
            title={isFocused || isNtpPage ? undefined : 'Site Information & Recon'}
          >
            {isIncognito && !isFocused ? (
              <EyeOff className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            ) : isFocused ? (
              <Search className="w-3.5 h-3.5 text-gray-400" />
            ) : isNtpPage ? (
              <Search className="w-3.5 h-3.5 text-gray-400" />
            ) : isSecure ? (
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={(e) => setDraftUrl(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
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

        {/* Suggestions Dropdown */}
        {showSuggestions && (suggestions.length > 0 || isSuggestionsLoading || (draftUrl.trim() !== '' && draftUrl !== url && !/^https?:\/\//i.test(draftUrl))) && (
          <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3a3a3a] rounded-xl shadow-lg overflow-hidden z-[100]">
            <ul className="py-1.5">
              {isSuggestionsLoading ? (
                <li className="px-3 py-2 text-[13px] text-gray-500 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500 mr-2"></div>
                  Loading...
                </li>
              ) : suggestions.length === 0 && draftUrl.trim() && draftUrl !== url && !/^lumo:\/\//i.test(draftUrl) ? (
                <li className="px-3 py-2 text-[13px] text-gray-500 italic text-center">
                  No suggestions found
                </li>
              ) : (
                suggestions.map((suggestion, index) => {
                  const isInternal = suggestion.toLowerCase().startsWith('lumo://');
                  const queryToHighlight = isInternal ? '' : draftUrl.trim();
                  return (
                    <li 
                      key={index}
                      className={`px-3 py-1.5 text-[13px] cursor-default flex items-center gap-3 transition-colors ${
                        selectedIndex === index 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDraftUrl(suggestion);
                        onNavigate(isInternal ? suggestion : `${searchEngineUrl}${encodeURIComponent(suggestion)}`);
                        setShowSuggestions(false);
                        inputRef.current?.blur();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {isInternal ? (
                        <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                      ) : (
                        <Search className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                      )}
                      <HighlightMatch text={suggestion} query={queryToHighlight} />
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {/* Site Security & Recon Dropdown */}
        {showSecurityDropdown && !isFocused && !isNtpPage && (
          <div ref={securityDropdownRef}>
            <SecurityDashboard
              url={url}
              isSecure={isSecure}
              isIncognito={isIncognito}
              onClose={() => setShowSecurityDropdown(false)}
            />
          </div>
        )}
      </form>

      {/* Translate page button — outside address bar, between address bar and right controls */}
      {!isFocused && !isNtpPage && offerTranslate && (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('lumo:translate-page'))}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-100 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] active:bg-gray-200 dark:active:bg-[#444]"
          title="Translate this page"
        >
          <Languages className="w-4 h-4" />
        </button>
      )}

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-0.5">
        {/* Agent — Autonomous Browser Control */}
        <NavBtn
          onClick={onToggleAgent}
          title="Lumo Agent (Ctrl+Shift+R)"
          id="btn-agent"
          active={isAgentOpen}
        >
          <Cpu className="w-4 h-4" />
        </NavBtn>

        {/* AI Assistant — primary AI entry point */}
        <NavBtn
          onClick={onToggleAI}
          title="Lumo AI (Ctrl+Shift+A)"
          id="btn-ai"
          active={isAISidebarOpen}
        >
          <Sparkles className="w-4 h-4" />
        </NavBtn>

        {/* Extensions */}
        <div className="hidden sm:block">
          <NavBtn
            onClick={onToggleExtensions}
            title="Extensions"
            id="btn-extensions"
          >
            <Puzzle className="w-4 h-4" />
          </NavBtn>
        </div>

        {/* Download */}
        <div className="hidden sm:block">
          <NavBtn
            onClick={onDownload}
            title="Downloads (Ctrl+J)"
            id="btn-download"
            active={isDownloadsOpen}
          >
            <Download className="w-4 h-4" />
          </NavBtn>
        </div>


        {/* Profile Switching */}
        <div className="hidden lg:block">
          <button
            onClick={onOpenAccount}
            id="btn-account"
            title="Switch Profile"
            className="ml-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
              transition-all duration-150 bg-gray-200 dark:bg-[#3a3a3a] hover:bg-gray-300 dark:hover:bg-[#444] text-gray-600 dark:text-gray-400"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>

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

// Subcomponent to highlight matching text in suggestions
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <span className="truncate">{text}</span>;
  
  // Escape query for regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  
  return (
    <span className="truncate">
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() 
          ? <span key={i} className="font-bold text-gray-900 dark:text-white">{part}</span> 
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

