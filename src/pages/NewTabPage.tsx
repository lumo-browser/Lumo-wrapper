/**
 * NewTabPage — Premium Redesign
 * Clean, glassmorphic new-tab dashboard with clock, search, shortcuts, and AI tips.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Globe, Plus, X,
  Youtube, Github, TrendingUp, Newspaper, Code2, ShoppingBag,
  Layers, Sparkles, Command,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ShortcutItem { id: string; label: string; url: string; icon: string; color: string; }

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Youtube, Github, TrendingUp, Newspaper, Code2, ShoppingBag, Globe,
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 's1', label: 'YouTube',  url: 'https://youtube.com',       icon: 'Youtube',     color: '#ef4444' },
  { id: 's2', label: 'GitHub',   url: 'https://github.com',        icon: 'Github',      color: '#6366f1' },
  { id: 's3', label: 'Trending', url: 'https://trends.google.com', icon: 'TrendingUp',  color: '#10b981' },
  { id: 's4', label: 'News',     url: 'https://news.google.com',   icon: 'Newspaper',   color: '#3b82f6' },
  { id: 's5', label: 'Dev.to',   url: 'https://dev.to',            icon: 'Code2',       color: '#8b5cf6' },
  { id: 's6', label: 'Amazon',   url: 'https://amazon.in',         icon: 'ShoppingBag', color: '#f59e0b' },
];

const AI_TIPS = [
  'Press Ctrl+Shift+A to open the AI chat sidebar.',
  'Press Ctrl+Shift+G to group your open tabs with AI.',
  'Press Ctrl+L to instantly focus the address bar.',
  'Press Ctrl+Tab to cycle through your open tabs.',
  'The AI agent can read and summarize any webpage for you.',
  'Press Ctrl+1-9 to jump to a specific tab instantly.',
];

const BACKGROUNDS = [
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2526 100%)',
  'linear-gradient(135deg, #0a0a0f 0%, #1a0533 50%, #0d1117 100%)',
];

// ── Clock Hook ────────────────────────────────────────────────────────────────
function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

// ── Clock Widget ──────────────────────────────────────────────────────────────
function ClockWidget() {
  const time = useTime();
  const hh = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const [hr, min] = hh.split(':');
  const date = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const h = time.getHours();
  const greeting =
    h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';

  return (
    <div className="text-center select-none">
      <p className="text-white/50 text-sm font-medium tracking-widest uppercase mb-3">{greeting}</p>
      <div className="flex items-center justify-center gap-3 tabular-nums">
        <span className="text-[7rem] md:text-[9rem] font-thin text-white leading-none"
          style={{ textShadow: '0 0 60px rgba(139,92,246,0.4)' }}>{hr}</span>
        <span className="text-[5rem] md:text-[7rem] font-thin text-violet-400/70 leading-none animate-pulse">:</span>
        <span className="text-[7rem] md:text-[9rem] font-thin text-white leading-none"
          style={{ textShadow: '0 0 60px rgba(139,92,246,0.4)' }}>{min}</span>
      </div>
      <p className="text-white/40 text-base mt-3 font-light tracking-wide">{date}</p>
    </div>
  );
}

// ── Search Widget ─────────────────────────────────────────────────────────────
function SearchWidget({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    // Listen for global focus event
    const onFocus = () => inputRef.current?.focus();
    window.addEventListener('lumo:focus-address-bar', onFocus);
    return () => { clearTimeout(t); window.removeEventListener('lumo:focus-address-bar', onFocus); };
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
      <div
        className="relative flex items-center rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          border: isFocused ? '1px solid rgba(139,92,246,0.7)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isFocused ? '0 0 0 3px rgba(139,92,246,0.15), 0 20px 60px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <Search className="absolute left-5 w-5 h-5 text-white/40 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search the web or type a URL..."
          id="newtab-search-input"
          className="w-full pl-14 pr-24 py-5 bg-transparent text-white text-base placeholder-white/25 outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}
            className="absolute right-16 text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit"
          className="absolute right-3 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all"
          style={{ background: 'rgba(139,92,246,0.6)', backdropFilter: 'blur(8px)' }}>
          Go
        </button>
      </div>
    </form>
  );
}

// ── Shortcuts Widget ──────────────────────────────────────────────────────────
function ShortcutsWidget({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try { const s = localStorage.getItem('lumo-shortcuts-v2'); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return DEFAULT_SHORTCUTS;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => { localStorage.setItem('lumo-shortcuts-v2', JSON.stringify(shortcuts)); }, [shortcuts]);

  const remove = (id: string) => setShortcuts(prev => prev.filter(s => s.id !== id));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setShortcuts(prev => [...prev, { id: `s-${Date.now()}`, label: newLabel.trim(), url, icon: 'Globe', color: '#6366f1' }]);
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
                className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                <X className="w-3 h-3" />
              </button>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg
                hover:scale-110 active:scale-95 transition-all duration-200"
                style={{
                  background: `${s.color}22`,
                  border: `1px solid ${s.color}55`,
                  boxShadow: `0 8px 24px ${s.color}30`,
                }}>
                <Icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <span className="text-xs text-white/60 font-medium max-w-[64px] truncate text-center">{s.label}</span>
            </div>
          );
        })}
        <button onClick={() => setIsAdding(true)} className="flex flex-col items-center gap-2.5 group">
          <div className="w-14 h-14 rounded-2xl border border-dashed border-white/20 flex items-center justify-center
            hover:border-white/40 hover:bg-white/5 transition-all duration-200">
            <Plus className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
          </div>
          <span className="text-xs text-white/30 group-hover:text-white/50">Add</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={() => setIsAdding(false)}>
          <form onSubmit={add} onClick={e => e.stopPropagation()}
            className="w-80 rounded-2xl shadow-2xl p-6"
            style={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-sm font-bold text-white mb-4">Add Shortcut</h3>
            <input autoFocus type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Reddit)" required
              className="w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-white/30 mb-3 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder="URL (e.g. reddit.com)" required
              className="w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-white/30 mb-5 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAdding(false)}
                className="flex-1 py-2 text-xs rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit"
                className="flex-1 py-2 text-xs rounded-xl font-semibold text-white transition-all"
                style={{ background: 'rgba(139,92,246,0.7)' }}>Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── AI Tip Banner ─────────────────────────────────────────────────────────────
function AITipBanner() {
  const [tip, setTip] = useState(() => AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);
  useEffect(() => {
    const t = setInterval(() => setTip(AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl max-w-2xl mx-auto"
      style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
      <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
      <p className="text-xs text-white/60 font-medium">{tip}</p>
    </div>
  );
}

// ── Keyboard Shortcuts Strip ──────────────────────────────────────────────────
function ShortcutStrip() {
  const items = [
    { keys: ['Ctrl', 'T'], label: 'New Tab' },
    { keys: ['Ctrl', 'L'], label: 'Address Bar' },
    { keys: ['Ctrl', 'Tab'], label: 'Cycle Tabs' },
    { keys: ['Ctrl', 'Shift', 'G'], label: 'AI Group Tabs' },
    { keys: ['Ctrl', 'Shift', 'A'], label: 'AI Chat' },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
      {items.map(({ keys, label }) => (
        <div key={label} className="flex items-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity">
          {keys.map((k, i) => (
            <React.Fragment key={i}>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-white/70 rounded"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>{k}</kbd>
              {i < keys.length - 1 && <span className="text-white/30 text-[10px]">+</span>}
            </React.Fragment>
          ))}
          <span className="text-[10px] text-white/50 ml-1">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Ambient Orbs ──────────────────────────────────────────────────────────────
function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)', filter: 'blur(80px)', animation: 'drift1 20s ease-in-out infinite' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent 70%)', filter: 'blur(80px)', animation: 'drift2 25s ease-in-out infinite' }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)', filter: 'blur(60px)', animation: 'drift1 18s ease-in-out infinite reverse' }} />
      <style>{`
        @keyframes drift1 { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(30px,-20px) } 66%{ transform:translate(-20px,15px) } }
        @keyframes drift2 { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(-25px,20px) } 66%{ transform:translate(15px,-25px) } }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface NewTabPageProps { onNavigate: (url: string) => void; }

export function NewTabPage({ onNavigate }: NewTabPageProps): React.ReactElement {
  const [bgIdx] = useState(() => Math.floor(Math.random() * BACKGROUNDS.length));

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full w-full overflow-auto"
      style={{ background: BACKGROUNDS[bgIdx] }}>

      <AmbientOrbs />

      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl px-6 py-14">

        {/* Logo mark */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-white/30 text-xs font-semibold tracking-[0.3em] uppercase">Lumo Browser</span>
        </div>

        {/* Clock */}
        <ClockWidget />

        {/* Search */}
        <SearchWidget onNavigate={onNavigate} />

        {/* Shortcuts */}
        <ShortcutsWidget onNavigate={onNavigate} />

        {/* AI Tip */}
        <AITipBanner />

        {/* Keyboard shortcuts strip */}
        <ShortcutStrip />
      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-4 text-[10px] text-white/15 font-semibold tracking-[0.4em] uppercase select-none">
        Lumo v0.2.0
      </div>
    </div>
  );
}
