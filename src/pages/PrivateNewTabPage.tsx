import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Globe, Plus, X,
  Youtube, Github, TrendingUp, Newspaper, Code2, ShoppingBag,
  Layers, Sparkles, EyeOff, Shield
} from 'lucide-react';
import { BrowserSettings, SEARCH_ENGINES } from './SettingsPage';

// --- Same components as NewTabPage but grayscale ---
interface ShortcutItem { id: string; label: string; url: string; icon: string; color: string; }

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Youtube, Github, TrendingUp, Newspaper, Code2, ShoppingBag, Globe,
};

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 's1', label: 'YouTube',  url: 'https://youtube.com',       icon: 'Youtube',     color: '#ffffff' },
  { id: 's2', label: 'GitHub',   url: 'https://github.com',        icon: 'Github',      color: '#ffffff' },
  { id: 's3', label: 'Trending', url: 'https://trends.google.com', icon: 'TrendingUp',  color: '#ffffff' },
  { id: 's4', label: 'News',     url: 'https://news.google.com',   icon: 'Newspaper',   color: '#ffffff' },
  { id: 's5', label: 'Dev.to',   url: 'https://dev.to',            icon: 'Code2',       color: '#ffffff' },
  { id: 's6', label: 'Amazon',   url: 'https://amazon.in',         icon: 'ShoppingBag', color: '#ffffff' },
];

const AI_TIPS = [
  'You are in Guest Mode. No history, cookies, or cache will be saved.',
  'This is an ephemeral workspace. Everything is deleted on exit.',
  'Your browsing in this window is completely isolated from other profiles.',
];

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function ClockWidget() {
  const time = useTime();
  const hh = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const [hr, minPart] = hh.split(':');
  const min = minPart ? minPart.split(' ')[0] : '00';

  const date = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const h = time.getHours();
  const greeting =
    h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';

  return (
    <div className="text-center select-none">
      <p className="text-sm font-medium tracking-widest uppercase mb-3 text-white/50">{greeting}</p>
      <div className="flex items-end justify-center gap-3 tabular-nums">
        <span className="text-[7rem] md:text-[9rem] font-thin text-white leading-none"
          style={{ textShadow: `0 0 60px rgba(255,255,255,0.2)` }}>{hr}</span>
        <span className="text-[5rem] md:text-[7rem] font-thin leading-none animate-pulse pb-4 text-white/70">:</span>
        <span className="text-[7rem] md:text-[9rem] font-thin text-white leading-none"
          style={{ textShadow: `0 0 60px rgba(255,255,255,0.2)` }}>{min}</span>
      </div>
      <p className="text-base mt-3 font-light tracking-wide text-white/40">{date}</p>
    </div>
  );
}

function SearchWidget({ onNavigate, settings }: { onNavigate: (url: string) => void, settings: BrowserSettings }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^https?:\/\//.test(q)) { onNavigate(q); return; }
    if (q.includes('.') && !q.includes(' ')) { onNavigate(`https://${q}`); return; }
    const engine = SEARCH_ENGINES.find((e) => e.id === settings.searchEngine) ?? SEARCH_ENGINES[0];
    onNavigate(`${engine.url}${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div
        className="relative flex items-center rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isFocused ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isFocused ? '0 0 0 3px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <Search className="absolute left-5 w-5 h-5 pointer-events-none text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search privately or enter URL..."
          className="w-full pl-14 pr-24 py-5 bg-transparent text-base outline-none text-white placeholder-white/30"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}
            className="absolute right-16 transition-colors text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit"
          className="absolute right-3 px-3 py-2 rounded-xl text-black text-xs font-bold transition-all bg-white hover:bg-gray-200">
          Go
        </button>
      </div>
    </form>
  );
}

function ShortcutsWidget({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try { const s = sessionStorage.getItem('lumo-guest-shortcuts'); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return DEFAULT_SHORTCUTS;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => { sessionStorage.setItem('lumo-guest-shortcuts', JSON.stringify(shortcuts)); }, [shortcuts]);

  const remove = (id: string) => setShortcuts(prev => prev.filter(s => s.id !== id));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setShortcuts(prev => [...prev, { id: `s-${Date.now()}`, label: newLabel.trim(), url, icon: 'Globe', color: '#ffffff' }]);
    setIsAdding(false); setNewLabel(''); setNewUrl('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-center gap-6">
        {shortcuts.map(s => {
          const Icon = ICON_MAP[s.icon] || Globe;
          return (
            <div key={s.id} className="group relative flex flex-col items-center gap-2.5 cursor-pointer"
              onClick={() => onNavigate(s.url)}>
              <button onClick={e => { e.stopPropagation(); remove(s.id); }}
                className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-md">
                <X className="w-3 h-3" />
              </button>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
                style={{
                  background: `rgba(255,255,255,0.05)`,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
                }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium max-w-[64px] truncate text-center text-white/60">{s.label}</span>
            </div>
          );
        })}
        <button onClick={() => setIsAdding(true)} className="flex flex-col items-center gap-2.5 group">
          <div className="w-14 h-14 rounded-2xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 flex items-center justify-center transition-all duration-200">
            <Plus className="w-5 h-5 transition-colors text-white/30 group-hover:text-white/60" />
          </div>
          <span className="text-xs text-white/30 group-hover:text-white/50">Add</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setIsAdding(false)}>
          <form onSubmit={add} onClick={e => e.stopPropagation()}
            className="w-80 rounded-2xl shadow-2xl p-6 bg-[#111]"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-sm font-bold mb-4 text-white">Add Shortcut</h3>
            <input autoFocus type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Reddit)" required
              className="w-full px-3 py-2.5 text-sm rounded-xl mb-3 outline-none text-white bg-white/5 border-white/10 placeholder-white/30"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
            <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder="URL (e.g. reddit.com)" required
              className="w-full px-3 py-2.5 text-sm rounded-xl mb-5 outline-none text-white bg-white/5 border-white/10 placeholder-white/30"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAdding(false)}
                className="flex-1 py-2 text-xs rounded-xl transition-all text-white/60 hover:text-white hover:bg-white/10">Cancel</button>
              <button type="submit"
                className="flex-1 py-2 text-xs rounded-xl font-bold text-black bg-white transition-all hover:bg-gray-200">Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AITipBanner() {
  const [tip, setTip] = useState(() => AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);
  useEffect(() => {
    const t = setInterval(() => setTip(AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl max-w-2xl mx-auto"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <Shield className="w-4 h-4 flex-shrink-0 text-white/70" />
      <p className="text-xs font-medium text-white/60">{tip}</p>
    </div>
  );
}

function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ opacity: 0.05, background: 'radial-gradient(circle, #ffffff, transparent 70%)', filter: 'blur(80px)', animation: 'drift1 20s ease-in-out infinite' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ opacity: 0.03, background: 'radial-gradient(circle, #ffffff, transparent 70%)', filter: 'blur(80px)', animation: 'drift2 25s ease-in-out infinite' }} />
      <style>{`
        @keyframes drift1 { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(30px,-20px) } 66%{ transform:translate(-20px,15px) } }
        @keyframes drift2 { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(-25px,20px) } 66%{ transform:translate(15px,-25px) } }
      `}</style>
    </div>
  );
}

export function PrivateNewTabPage({ onNavigate, settings }: { onNavigate: (url: string) => void, settings: BrowserSettings, onUpdateSettings: any }): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-full w-full overflow-auto transition-colors duration-500 bg-[#000000]">
      <AmbientOrbs />

      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl px-6 py-14">

        {/* Guest Mode Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase">
          <EyeOff className="w-3.5 h-3.5" />
          <span>Guest Mode</span>
        </div>

        {/* Clock */}
        <ClockWidget />

        {/* Search */}
        <SearchWidget onNavigate={onNavigate} settings={settings} />

        {/* Shortcuts */}
        <ShortcutsWidget onNavigate={onNavigate} />

        {/* AI Tip / Privacy Notice */}
        <AITipBanner />

      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-4 text-[10px] font-semibold tracking-[0.4em] uppercase select-none text-white/15">
        Lumo Guest Workspace
      </div>
    </div>
  );
}
