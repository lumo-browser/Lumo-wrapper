/**
 * BrowserToolbar — Address bar, navigation controls, extensions, account
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shield,
  ShieldCheck,
  Search,
  Star,
  Share2,
  Puzzle,
  User,
  Moon,
  Sun,
  ChevronDown,
  Menu,
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
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onNavigate: (url: string) => void;
  onToggleTheme: () => void;
  onOpenExtensions: () => void;
  onOpenAccount: () => void;
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
  onBack,
  onForward,
  onRefresh,
  onNavigate,
  onToggleTheme,
  onOpenExtensions,
  onOpenAccount,
}: BrowserToolbarProps): React.ReactElement {
  const [addressValue, setAddressValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setAddressValue(url);
    }
  }, [url, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = addressValue.trim();
    if (!raw) return;

    let resolved = raw;
    if (!raw.startsWith('http://') && !raw.startsWith('https://') && raw.includes('.')) {
      resolved = `https://${raw}`;
    } else if (!raw.startsWith('http') && !raw.includes('.')) {
      resolved = `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
    }

    onNavigate(resolved);
    inputRef.current?.blur();
  };

  const displayUrl = isFocused ? addressValue : (url.replace(/^https?:\/\//, '') || '');

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Navigation Controls */}
      <div className="flex items-center gap-0.5">
        <NavButton onClick={onBack} disabled={!canGoBack} title="Back">
          <ChevronLeft className="w-4 h-4" />
        </NavButton>
        <NavButton onClick={onForward} disabled={!canGoForward} title="Forward">
          <ChevronRight className="w-4 h-4" />
        </NavButton>
        <NavButton onClick={onRefresh} title={isLoading ? 'Stop' : 'Refresh'}>
          <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </NavButton>
      </div>

      {/* Address Bar */}
      <form onSubmit={handleSubmit} className="flex-1 mx-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200
            ${isFocused
              ? 'bg-white dark:bg-gray-700 ring-2 ring-blue-500 shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          {/* Security Icon */}
          {isFocused ? (
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          ) : isSecure ? (
            <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={displayUrl}
            onChange={(e) => setAddressValue(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setAddressValue(url);
              setTimeout(() => inputRef.current?.select(), 0);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search or enter address"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400
              outline-none min-w-0 font-mono"
          />

          {/* Star / Bookmark */}
          {!isFocused && (
            <button
              type="button"
              className="flex-shrink-0 text-gray-400 hover:text-yellow-500 transition-colors"
              title="Bookmark"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Share */}
        <NavButton title="Share">
          <Share2 className="w-4 h-4" />
        </NavButton>

        {/* Extensions */}
        <button
          onClick={onOpenExtensions}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-medium"
          title="Extensions"
        >
          <Puzzle className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <NavButton onClick={onToggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </NavButton>

        {/* Account */}
        <button
          onClick={onOpenAccount}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-xs font-medium
            ${isLoggedIn
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          title="Account"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold
            ${isLoggedIn ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'}`}>
            {isLoggedIn && userEmail ? userEmail[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
          {isLoggedIn && userEmail && (
            <span className="hidden md:block max-w-[80px] truncate">{userEmail.split('@')[0]}</span>
          )}
        </button>

        {/* Menu */}
        <NavButton title="Menu">
          <Menu className="w-4 h-4" />
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150
        ${disabled
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`}
    >
      {children}
    </button>
  );
}
