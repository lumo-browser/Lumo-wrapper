/**
 * NewTabPage — Clean browser new tab experience
 * Inspired by Chrome / Arc / Edge NTP: time, search, shortcuts
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Plus, X, TrendingUp, Newspaper, Code2, ShoppingBag, Youtube, Github } from 'lucide-react';

interface ShortcutItem {
  id: string;
  label: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 's1', label: 'YouTube',  url: 'https://youtube.com',   icon: Youtube,     color: 'bg-red-500' },
  { id: 's2', label: 'GitHub',   url: 'https://github.com',    icon: Github,      color: 'bg-gray-800 dark:bg-gray-700' },
  { id: 's3', label: 'Trending', url: 'https://trends.google.com', icon: TrendingUp, color: 'bg-emerald-500' },
  { id: 's4', label: 'News',     url: 'https://news.google.com', icon: Newspaper,  color: 'bg-blue-500' },
  { id: 's5', label: 'Dev',      url: 'https://dev.to',         icon: Code2,       color: 'bg-violet-600' },
  { id: 's6', label: 'Shop',     url: 'https://amazon.in',      icon: ShoppingBag, color: 'bg-amber-500' },
];

interface NewTabPageProps {
  onNavigate: (url: string) => void;
}

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export function NewTabPage({ onNavigate }: NewTabPageProps): React.ReactElement {
  const time = useTime();
  const [query, setQuery] = useState('');
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(DEFAULT_SHORTCUTS);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    let url: string;
    if (q.startsWith('http://') || q.startsWith('https://')) {
      url = q;
    } else if (q.includes('.') && !q.includes(' ')) {
      url = `https://${q}`;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }
    onNavigate(url);
  };

  const removeShortcut = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setShortcuts((prev) => prev.filter((s) => s.id !== id));
      setRemovingId(null);
    }, 200);
  };

  const hours = time.getHours();
  const greeting =
    hours < 5 ? 'Good night' :
    hours < 12 ? 'Good morning' :
    hours < 17 ? 'Good afternoon' :
    hours < 21 ? 'Good evening' : 'Good night';

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full bg-white dark:bg-[#1a1a1a] select-none">
      {/* Clock + Date */}
      <div className="ntp-fade-up text-center mb-10" style={{ animationDelay: '0ms' }}>
        <div className="text-7xl font-light tracking-tight text-gray-900 dark:text-white tabular-nums">
          {formattedTime}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
          {formattedDate}
        </div>
      </div>

      {/* Greeting */}
      <div className="ntp-fade-up text-xl font-medium text-gray-700 dark:text-gray-300 mb-8"
           style={{ animationDelay: '40ms' }}>
        {greeting}
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="ntp-fade-up w-full max-w-xl px-4 mb-12"
        style={{ animationDelay: '80ms' }}
      >
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google or enter address"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm
              bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15
              border border-transparent focus:border-blue-500 dark:focus:border-blue-400
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
              outline-none transition-all duration-200 shadow-sm focus:shadow-md
              focus:bg-white dark:focus:bg-white/20"
          />
        </div>
      </form>

      {/* Shortcuts */}
      <div className="ntp-fade-up flex flex-wrap justify-center gap-3 max-w-xl px-4"
           style={{ animationDelay: '120ms' }}>
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`group relative flex flex-col items-center gap-2 cursor-pointer transition-opacity duration-200
                ${removingId === s.id ? 'opacity-0 scale-90' : 'opacity-100'}`}
            >
              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeShortcut(s.id); }}
                className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600
                  text-white flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X className="w-2.5 h-2.5" />
              </button>

              {/* Icon */}
              <button
                onClick={() => onNavigate(s.url)}
                className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center
                  shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150`}
              >
                <Icon className="w-6 h-6 text-white" />
              </button>

              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{s.label}</span>
            </div>
          );
        })}

        {/* Add shortcut placeholder */}
        <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
          <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600
            flex items-center justify-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">Add</span>
        </div>
      </div>

      {/* Bottom branding — very subtle */}
      <div className="absolute bottom-4 text-xs text-gray-300 dark:text-gray-700 font-medium tracking-wide">
        Nova
      </div>
    </div>
  );
}
