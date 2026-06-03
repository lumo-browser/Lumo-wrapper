/**
 * NewTabPage — Fully customizable home dashboard
 * Widgets: Clock, Search, Shortcuts, Weather, Quick Notes, Top Sites
 * Features: Edit mode, widget toggle, theme selector, background picker
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Globe, Plus, X,
  Youtube, Github, TrendingUp, Newspaper, Code2, ShoppingBag,
  Clock, StickyNote, LayoutGrid, Palette,
  Image as ImageIcon,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ShortcutItem {
  id: string; label: string; url: string;
  icon: string; color: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Youtube, Github, TrendingUp, Newspaper, Code2, ShoppingBag, Globe,
};

interface Widget {
  id: string;
  type: 'clock' | 'search' | 'shortcuts' | 'notes' | 'topSites';
  enabled: boolean;
  order: number;
}

interface DashboardConfig {
  widgets: Widget[];
  background: string;
  accentColor: string;
  showGreeting: boolean;
  clockFormat: '12' | '24';
  showDate?: boolean;
  customBgImage?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 's1', label: 'YouTube',  url: 'https://youtube.com',      icon: 'Youtube',     color: 'bg-red-500' },
  { id: 's2', label: 'GitHub',   url: 'https://github.com',       icon: 'Github',      color: 'bg-gray-800' },
  { id: 's3', label: 'Trending', url: 'https://trends.google.com',icon: 'TrendingUp',  color: 'bg-emerald-500' },
  { id: 's4', label: 'News',     url: 'https://news.google.com',  icon: 'Newspaper',   color: 'bg-blue-500' },
  { id: 's5', label: 'Dev.to',   url: 'https://dev.to',           icon: 'Code2',       color: 'bg-violet-600' },
  { id: 's6', label: 'Amazon',   url: 'https://amazon.in',        icon: 'ShoppingBag', color: 'bg-amber-500' },
];

const DEFAULT_CONFIG: DashboardConfig = {
  widgets: [
    { id: 'clock',     type: 'clock',     enabled: true,  order: 0 },
    { id: 'search',    type: 'search',    enabled: true,  order: 1 },
    { id: 'shortcuts', type: 'shortcuts', enabled: true,  order: 2 },
    { id: 'notes',     type: 'notes',     enabled: false, order: 3 },
    { id: 'topSites',  type: 'topSites',  enabled: false, order: 4 },
  ],
  background: 'gradient-1',
  accentColor: '#3b82f6',
  showGreeting: true,
  clockFormat: '24',
  showDate: true,
  customBgImage: '',
};

const BACKGROUNDS = [
  { id: 'gradient-1', label: 'Ocean',      style: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { id: 'gradient-2', label: 'Sunset',     style: 'linear-gradient(135deg, #f093fb, #f5576c, #fda085)' },
  { id: 'gradient-3', label: 'Forest',     style: 'linear-gradient(135deg, #134e5e, #71b280)' },
  { id: 'gradient-4', label: 'Midnight',   style: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' },
  { id: 'gradient-5', label: 'Aurora',     style: 'linear-gradient(135deg, #007991, #78ffd6)' },
  { id: 'gradient-6', label: 'Volcano',    style: 'linear-gradient(135deg, #1d1d1d, #8b0000, #ff4500)' },
  { id: 'solid-light',label: 'Light',      style: '#f8fafc' },
  { id: 'solid-dark', label: 'Dark',       style: '#0f0f0f' },
];

const ACCENT_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316',
];

const TOP_SITES = [
  { label: 'Google',    url: 'https://google.com',      favicon: 'https://www.google.com/favicon.ico' },
  { label: 'YouTube',   url: 'https://youtube.com',     favicon: 'https://www.youtube.com/favicon.ico' },
  { label: 'Wikipedia', url: 'https://wikipedia.org',   favicon: 'https://www.wikipedia.org/favicon.ico' },
  { label: 'Reddit',    url: 'https://reddit.com',      favicon: 'https://www.reddit.com/favicon.ico' },
  { label: 'X / Twitter',url:'https://x.com',           favicon: 'https://x.com/favicon.ico' },
  { label: 'LinkedIn',  url: 'https://linkedin.com',    favicon: 'https://www.linkedin.com/favicon.ico' },
];

// ── Hooks ────────────────────────────────────────────────────────────────────

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function useConfig() {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    try {
      const saved = localStorage.getItem('Lumo-dashboard-config');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_CONFIG;
  });

  const updateConfig = useCallback((updates: Partial<DashboardConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('Lumo-dashboard-config', JSON.stringify(next));
      return next;
    });
  }, []);

  return { config, updateConfig };
}

// ── Widget Components ─────────────────────────────────────────────────────────

function ClockWidget({ format, accent, showDate, showGreeting }: { format: '12'|'24'; accent: string; showDate?: boolean; showGreeting?: boolean }) {
  const time = useTime();
  const h = format === '12'
    ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const date = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hours = time.getHours();
  const greeting = hours < 5 ? 'Good night' : hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : hours < 21 ? 'Good evening' : 'Good night';

  return (
    <div className="text-center mb-2">
      <div className="text-7xl font-thin tracking-tight text-white tabular-nums drop-shadow-lg" style={{ textShadow: `0 0 40px ${accent}60` }}>
        {h}
      </div>
      {showDate !== false && <div className="text-white/60 text-sm mt-2 font-medium">{date}</div>}
      {showGreeting !== false && <div className="text-white/80 text-lg font-light mt-1">{greeting}</div>}
    </div>
  );
}

function SearchWidget({ onNavigate, accent }: { onNavigate: (url: string) => void; accent: string }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^https?:\/\//.test(q)) { onNavigate(q); return; }
    if (q.includes('.') && !q.includes(' ')) { onNavigate(`https://${q}`); return; }
    onNavigate(`https://www.google.com/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-white/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search or enter a URL..."
          className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm text-white placeholder-white/40
            bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40
            focus:bg-white/15 outline-none transition-all duration-200 shadow-lg"
          style={{ caretColor: accent }}
        />
        <style>{`
          input:focus { border-color: ${accent} !important; box-shadow: 0 0 0 1px ${accent} !important; }
        `}</style>
      </div>
    </form>
  );
}

function ShortcutsWidget({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try {
      const s = localStorage.getItem('Lumo-shortcuts');
      if (s) return JSON.parse(s);
    } catch { /* ignore */ }
    return DEFAULT_SHORTCUTS;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('Lumo-shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const remove = (id: string) => setShortcuts(prev => prev.filter(s => s.id !== id));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setShortcuts(prev => [...prev, { id: `s-${Date.now()}`, label: newLabel.trim(), url, icon: 'Globe', color: 'bg-blue-600' }]);
    setIsAdding(false); setNewLabel(''); setNewUrl('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-center gap-4">
        {shortcuts.map(s => {
          const Icon = ICON_MAP[s.icon] || Globe;
          return (
            <div key={s.id} className="group relative flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => onNavigate(s.url)}>
              <button onClick={e => { e.stopPropagation(); remove(s.id); }}
                className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-2.5 h-2.5" />
              </button>
              <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-150`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/70 font-medium max-w-[60px] truncate">{s.label}</span>
            </div>
          );
        })}
        <button onClick={() => setIsAdding(true)} className="flex flex-col items-center gap-1.5 group">
          <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center hover:border-white/60 hover:bg-white/10 transition-all">
            <Plus className="w-5 h-5 text-white/50 group-hover:text-white/80" />
          </div>
          <span className="text-xs text-white/40 group-hover:text-white/60">Add</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form onSubmit={add} className="bg-[#1e1e2e] border border-white/10 rounded-2xl shadow-2xl p-6 w-80">
            <h3 className="text-sm font-bold text-white mb-4">Add Shortcut</h3>
            <input autoFocus type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Reddit)" required
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white mb-3 focus:outline-none"
              style={{ '--tw-ring-color': 'var(--accent-color)', focusRing: '2px solid var(--accent-color)' } as any} />
            <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder="URL (e.g. reddit.com)" required
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white mb-5 focus:outline-none"
              style={{ '--tw-ring-color': 'var(--accent-color)' } as any} />
            <style>{`
              form input:focus { border-color: var(--accent-color) !important; box-shadow: 0 0 0 1px var(--accent-color) !important; }
            `}</style>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAdding(false)}
                className="flex-1 py-2 text-xs rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">Cancel</button>
              <button type="submit" disabled={!newLabel.trim() || !newUrl.trim()}
                className="flex-1 py-2 text-xs rounded-lg text-white disabled:opacity-50 transition-colors hover:brightness-110"
                style={{ backgroundColor: 'var(--accent-color)' }}>Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function NotesWidget() {
  const [notes, setNotes] = useState(() => localStorage.getItem('Lumo-quick-notes') || '');
  useEffect(() => { localStorage.setItem('Lumo-quick-notes', notes); }, [notes]);
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-4 h-4 text-white/60" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Quick Notes</span>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Jot something down..."
        className="w-full h-28 px-4 py-3 text-sm text-white/90 placeholder-white/30 rounded-xl
          bg-white/5 border border-white/10 focus:border-white/30 outline-none resize-none
          backdrop-blur-xl transition-all"
      />
    </div>
  );
}

function TopSitesWidget({ onNavigate }: { onNavigate: (url: string) => void }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-white/60" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Top Sites</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {TOP_SITES.map(site => (
          <button key={site.url} onClick={() => onNavigate(site.url)}
            className="flex flex-col items-center gap-1.5 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all">
              <img src={site.favicon} alt={site.label} className="w-5 h-5 rounded" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors max-w-[56px] truncate">{site.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}



// ── Main Component ────────────────────────────────────────────────────────────

interface NewTabPageProps { onNavigate: (url: string) => void; }

export function NewTabPage({ onNavigate }: NewTabPageProps): React.ReactElement {
  const { config, updateConfig } = useConfig();

  const bg = BACKGROUNDS.find(b => b.id === config.background) ?? BACKGROUNDS[0];
  const enabledWidgets = [...config.widgets]
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full w-full overflow-auto py-12 px-4"
      style={{
        background: config.customBgImage ? `url(${config.customBgImage}) center/cover no-repeat` : bg.style,
        ['--accent-color' as any]: config.accentColor
      }}>

      {/* Noise overlay for depth */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E')" }} />


      {/* Widgets */}
      <div className="flex flex-col items-center gap-10 w-full max-w-2xl">
        {enabledWidgets.map(w => (
          <div key={w.id} className="w-full flex justify-center animate-fade-in">
            {w.type === 'clock'     && <ClockWidget format={config.clockFormat} accent={config.accentColor} showDate={config.showDate} showGreeting={config.showGreeting} />}
            {w.type === 'search'    && <SearchWidget onNavigate={onNavigate} accent={config.accentColor} />}
            {w.type === 'shortcuts' && <ShortcutsWidget onNavigate={onNavigate} />}
            {w.type === 'notes'     && <NotesWidget />}
            {w.type === 'topSites'  && <TopSitesWidget onNavigate={onNavigate} />}
          </div>
        ))}

        {enabledWidgets.length === 0 && (
          <div className="text-center text-white/30 mt-20">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No widgets enabled.</p>
            <p className="mt-3 text-xs text-white/40">
              Open Settings (Ctrl+,) to customize your dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Bottom brand */}
      <div className="absolute bottom-4 text-xs text-white/20 font-medium tracking-widest uppercase">Lumo</div>


    </div>
  );
}
