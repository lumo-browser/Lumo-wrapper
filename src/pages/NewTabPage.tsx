/**
 * NewTabPage — Premium Redesign
 * Clean, glassmorphic new-tab dashboard with clock, search, shortcuts, and AI tips.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Globe, Plus, X,
  Youtube, Github, TrendingUp, Newspaper, Code2, ShoppingBag,
  Layers, Sparkles, Command, Settings
} from 'lucide-react';
import { DashboardSettingsOverlay } from '../ui/components/DashboardSettingsOverlay';
import { JapanCherryBlossomTheme } from '../ui/components/JapanCherryBlossomTheme';
import { BrainNetworkTheme } from '../ui/components/BrainNetworkTheme';

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

const BACKGROUNDS_DARK = [
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2526 100%)',
  'linear-gradient(135deg, #0a0a0f 0%, #1a0533 50%, #0d1117 100%)',
];

const BACKGROUNDS_LIGHT = [
  'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)',
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
function ClockWidget({ isDark }: { isDark: boolean }) {
  const [format, setFormat] = useState<'12' | '24'>('24');
  
  useEffect(() => {
    const updateFormat = () => {
      try {
        const saved = localStorage.getItem('Lumo-dashboard-config');
        if (saved) {
          const config = JSON.parse(saved);
          if (config.clockFormat) setFormat(config.clockFormat);
        }
      } catch { /* ignore */ }
    };
    updateFormat();
    window.addEventListener('storage', updateFormat);
    // Add custom event listener for immediate updates
    window.addEventListener('lumo:dashboard-config-updated', updateFormat);
    return () => {
      window.removeEventListener('storage', updateFormat);
      window.removeEventListener('lumo:dashboard-config-updated', updateFormat);
    };
  }, []);

  const time = useTime();
  const hh = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: format === '12' });
  const [hr, minPart] = hh.split(':');
  const min = minPart ? minPart.split(' ')[0] : '00';
  const ampm = minPart && minPart.includes(' ') ? minPart.split(' ')[1] : '';

  const date = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const h = time.getHours();
  const greeting =
    h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';

  const textColor = isDark ? 'text-white' : 'text-gray-800';
  const shadowColor = isDark ? 'rgba(var(--lumo-accent-rgb),0.4)' : 'rgba(var(--lumo-accent-rgb),0.2)';

  return (
    <div className="text-center select-none">
      <p className={`text-sm font-medium tracking-widest uppercase mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{greeting}</p>
      <div className="flex items-end justify-center gap-3 tabular-nums">
        <span className={`text-[7rem] md:text-[9rem] font-thin ${textColor} leading-none`}
          style={{ textShadow: `0 0 60px ${shadowColor}` }}>{hr}</span>
        <span className="text-[5rem] md:text-[7rem] font-thin leading-none animate-pulse pb-4" style={{ color: "rgba(var(--lumo-accent-rgb), 0.7)" }}>:</span>
        <span className={`text-[7rem] md:text-[9rem] font-thin ${textColor} leading-none`}
          style={{ textShadow: `0 0 60px ${shadowColor}` }}>{min}</span>
        {ampm && (
          <span className={`text-2xl font-light ${textColor} pb-6 ml-1`} style={{ textShadow: `0 0 20px ${shadowColor}` }}>
            {ampm}
          </span>
        )}
      </div>
      <p className={`text-base mt-3 font-light tracking-wide ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{date}</p>
    </div>
  );
}

// ── Search Widget ─────────────────────────────────────────────────────────────
function SearchWidget({ onNavigate, isDark }: { onNavigate: (url: string) => void; isDark: boolean }) {
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

  const bg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)';
  const borderNormal = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const borderFocus = isDark ? 'rgba(var(--lumo-accent-rgb),0.7)' : 'rgba(var(--lumo-accent-rgb),0.5)';
  const shadowNormal = isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.05)';
  const shadowFocus = isDark ? '0 0 0 3px rgba(var(--lumo-accent-rgb),0.15), 0 20px 60px rgba(0,0,0,0.4)' : '0 0 0 3px rgba(var(--lumo-accent-rgb),0.15), 0 20px 60px rgba(0,0,0,0.1)';

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div
        className="relative flex items-center rounded-2xl transition-all duration-300"
        style={{
          background: bg,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isFocused ? borderFocus : borderNormal}`,
          boxShadow: isFocused ? shadowFocus : shadowNormal,
        }}
      >
        <Search className={`absolute left-5 w-5 h-5 pointer-events-none ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search the web or type a URL..."
          id="newtab-search-input"
          className={`w-full pl-14 pr-24 py-5 bg-transparent text-base outline-none ${isDark ? 'text-white placeholder-white/25' : 'text-gray-800 placeholder-gray-400'}`}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}
            className={`absolute right-16 transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}>
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit"
          className="absolute right-3 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all"
          style={{ background: 'rgba(var(--lumo-accent-rgb),0.7)', backdropFilter: 'blur(8px)' }}>
          Go
        </button>
      </div>
    </form>
  );
}

// ── Shortcuts Widget ──────────────────────────────────────────────────────────
function ShortcutsWidget({ onNavigate, isDark }: { onNavigate: (url: string) => void; isDark: boolean }) {
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

  const labelColor = isDark ? 'text-white/60' : 'text-gray-600';
  const addBorder = isDark ? 'border-white/20 hover:border-white/40 hover:bg-white/5' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100/50';
  const addIcon = isDark ? 'text-white/30 group-hover:text-white/60' : 'text-gray-400 group-hover:text-gray-600';

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
                  opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-md">
                <X className="w-3 h-3" />
              </button>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'shadow-lg' : 'shadow-sm'}
                hover:scale-110 active:scale-95 transition-all duration-200`}
                style={{
                  background: `${s.color}${isDark ? '22' : '15'}`,
                  border: `1px solid ${s.color}${isDark ? '55' : '33'}`,
                  boxShadow: `0 8px 24px ${s.color}${isDark ? '30' : '20'}`,
                }}>
                <Icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <span className={`text-xs font-medium max-w-[64px] truncate text-center ${labelColor}`}>{s.label}</span>
            </div>
          );
        })}
        <button onClick={() => setIsAdding(true)} className="flex flex-col items-center gap-2.5 group">
          <div className={`w-14 h-14 rounded-2xl border border-dashed flex items-center justify-center transition-all duration-200 ${addBorder}`}>
            <Plus className={`w-5 h-5 transition-colors ${addIcon}`} />
          </div>
          <span className={`text-xs ${isDark ? 'text-white/30 group-hover:text-white/50' : 'text-gray-400 group-hover:text-gray-600'}`}>Add</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsAdding(false)}>
          <form onSubmit={add} onClick={e => e.stopPropagation()}
            className={`w-80 rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-[#14141e]' : 'bg-white'}`}
            style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Add Shortcut</h3>
            
            <input autoFocus type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Reddit)" required
              className={`w-full px-3 py-2.5 text-sm rounded-xl mb-3 outline-none ${isDark ? 'text-white bg-white/5 border-white/10 placeholder-white/30' : 'text-gray-800 bg-gray-50 border-gray-200 placeholder-gray-400'}`}
              style={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              
            <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder="URL (e.g. reddit.com)" required
              className={`w-full px-3 py-2.5 text-sm rounded-xl mb-5 outline-none ${isDark ? 'text-white bg-white/5 border-white/10 placeholder-white/30' : 'text-gray-800 bg-gray-50 border-gray-200 placeholder-gray-400'}`}
              style={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAdding(false)}
                className={`flex-1 py-2 text-xs rounded-xl transition-all ${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>Cancel</button>
              <button type="submit"
                className="flex-1 py-2 text-xs rounded-xl font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: "var(--lumo-accent)" }}>Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── AI Tip Banner ─────────────────────────────────────────────────────────────
function AITipBanner({ isDark }: { isDark: boolean }) {
  const [tip, setTip] = useState(() => AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);
  useEffect(() => {
    const t = setInterval(() => setTip(AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]), 8000);
    return () => clearInterval(t);
  }, []);

  const bg = isDark ? 'rgba(var(--lumo-accent-rgb),0.1)' : 'rgba(var(--lumo-accent-rgb),0.05)';
  const border = isDark ? 'rgba(var(--lumo-accent-rgb),0.25)' : 'rgba(var(--lumo-accent-rgb),0.2)';

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl max-w-2xl mx-auto"
      style={{ background: bg, border: `1px solid ${border}` }}>
      <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "var(--lumo-accent)" }} />
      <p className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{tip}</p>
    </div>
  );
}

// ── Keyboard Shortcuts Strip ──────────────────────────────────────────────────
function ShortcutStrip({ isDark }: { isDark: boolean }) {
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
        <div key={label} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          {keys.map((k, i) => (
            <React.Fragment key={i}>
              <kbd className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${isDark ? 'text-white/70' : 'text-gray-600'}`}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`
                }}>{k}</kbd>
              {i < keys.length - 1 && <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>+</span>}
            </React.Fragment>
          ))}
          <span className={`text-[10px] ml-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Ambient Orbs ──────────────────────────────────────────────────────────────
function AmbientOrbs({ isDark }: { isDark: boolean }) {
  const opacity1 = isDark ? 0.2 : 0.1;
  const opacity2 = isDark ? 0.15 : 0.08;
  const opacity3 = isDark ? 0.1 : 0.05;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ opacity: opacity1, background: 'radial-gradient(circle, var(--lumo-accent), transparent 70%)', filter: 'blur(80px)', animation: 'drift1 20s ease-in-out infinite' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ opacity: opacity2, background: 'radial-gradient(circle, #2563eb, transparent 70%)', filter: 'blur(80px)', animation: 'drift2 25s ease-in-out infinite' }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full"
        style={{ opacity: opacity3, background: 'radial-gradient(circle, #ec4899, transparent 70%)', filter: 'blur(60px)', animation: 'drift1 18s ease-in-out infinite reverse' }} />
      <style>{`
        @keyframes drift1 { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(30px,-20px) } 66%{ transform:translate(-20px,15px) } }
        @keyframes drift2 { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(-25px,20px) } 66%{ transform:translate(15px,-25px) } }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface NewTabPageProps { onNavigate: (url: string) => void; isDark?: boolean; }


function hexToRgb(hex) {
  const c = (hex || '').replace('#', '');
  if (c.length !== 6) return '139,92,246';
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

function useDashboardConfig() {
  const [config, setConfig] = useState({
    theme: 'custom',
    accentColor: '#8b5cf6',
    bgImage: '',
    showClock: true,
    showSearch: true,
    showShortcuts: true,
    showAITips: true
  });
  
  useEffect(() => {
    const update = () => {
      try {
        const saved = localStorage.getItem('Lumo-dashboard-config');
        if (saved) {
          setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
        }
      } catch {}
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener('lumo:dashboard-config-updated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('lumo:dashboard-config-updated', update);
    };
  }, []);
  return config;
}

export function NewTabPage({ onNavigate, isDark = true }: NewTabPageProps): React.ReactElement {
  const [bgIdx] = useState(() => Math.floor(Math.random() * BACKGROUNDS_DARK.length));
  const [showSettings, setShowSettings] = useState(false);

  const bgGradient = isDark ? BACKGROUNDS_DARK[bgIdx] : BACKGROUNDS_LIGHT[bgIdx];
  const config = useDashboardConfig();
  
  // Force light mode text (dark text) when bright themes are active
  const [themeIsDark, setThemeIsDark] = useState(isDark);
  const [shortcuts, setShortcuts] = useState(() => {
    try { const s = localStorage.getItem('lumo-shortcuts-v2'); if (s) return JSON.parse(s); } catch {}
    return DEFAULT_SHORTCUTS;
  });

  useEffect(() => {
    const handleConfigUpdate = () => {
      try { const s = localStorage.getItem('lumo-shortcuts-v2'); if (s) setShortcuts(JSON.parse(s)); } catch {}
    };
    window.addEventListener('lumo:dashboard-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('lumo:dashboard-config-updated', handleConfigUpdate);
  }, []);

  const configThemeIsDark = (config.theme === 'japan-cherry-blossom' || config.theme === 'brain-network') ? false : isDark;

  const accentHex = config.accentColor || '#8b5cf6';
  const bgImage = config.bgImage || '';
  const accentRgb = hexToRgb(accentHex);
  const cssVars = {
    '--lumo-accent': accentHex,
    '--lumo-accent-rgb': accentRgb,
  } as React.CSSProperties;

  const backgroundStyle = bgImage 
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: config.theme === 'black-and-white' ? (isDark ? 'linear-gradient(135deg, #000, #1a1a1a)' : 'linear-gradient(135deg, #fff, #f0f0f0)') 
                  : config.theme === 'crimson-red' ? (isDark ? 'linear-gradient(135deg, #450a0a, #7f1d1d)' : 'linear-gradient(135deg, #fee2e2, #fca5a5)')
                  : config.theme === 'pink-heart' ? (isDark ? 'linear-gradient(135deg, #500724, #9d174d)' : 'linear-gradient(135deg, #fce7f3, #f9a8d4)')
                  : bgGradient };

  // Handle messages from the iframe themes (e.g. BrainNetworkTheme node clicks)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'lumo-navigate') {
        const electron = (window as any).electron;
        if (electron?.send) {
          electron.send('lumo:navigate', e.data.url);
        } else {
          window.location.href = e.data.url;
        }
      } else if (e.data?.type === 'lumo-open-settings') {
        setShowSettings(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-full w-full overflow-auto transition-colors duration-700 ${configThemeIsDark ? 'text-white' : 'text-gray-900'}`}
      style={{ ...backgroundStyle, ...cssVars }}>

      {bgImage && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none z-0" />}

      <button 
        onClick={() => setShowSettings(true)}
        className={`absolute top-6 right-6 z-50 p-2 rounded-full transition-all ${themeIsDark ? 'text-white/40 hover:text-white/80 hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-black/5'}`}
      >
        <Settings className="w-5 h-5" />
      </button>

      <DashboardSettingsOverlay 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        config={config}
        onSave={(newConf) => {
          try {
            localStorage.setItem('Lumo-dashboard-config', JSON.stringify(newConf));
            window.dispatchEvent(new Event('lumo:dashboard-config-updated'));
          } catch (e) {
            alert('Failed to save wallpaper. The image file might be too large (max 5MB limit). Please use a smaller file or paste a direct image URL instead.');
          }
        }}
        isDark={themeIsDark} 
      />

      {(!bgImage && (!config.theme || config.theme === 'custom')) && <AmbientOrbs isDark={configThemeIsDark} />}
      {config.theme === 'japan-cherry-blossom' && <JapanCherryBlossomTheme />}
      {config.theme === 'brain-network' && <BrainNetworkTheme shortcuts={shortcuts} />}
      
      {(() => {
        const isSavedTheme = config.theme?.startsWith('saved-');
        const isCustomCode = config.theme === 'custom-code';
        if (!isCustomCode && !isSavedTheme) return null;
        
        let html = config.customHtml || '';
        let css = config.customCss || '';
        let js = config.customJs || '';
        
        if (isSavedTheme) {
          const t = (config.savedThemes || []).find((s: any) => s.id === config.theme);
          if (t) {
            html = t.customHtml;
            css = t.customCss;
            js = t.customJs;
          }
        }

        return (
          <iframe
            title="Custom Wallpaper"
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { margin: 0; padding: 0; overflow: hidden; width: 100vw; height: 100vh; }
                    ${css}
                  </style>
                </head>
                <body>
                  ${html}
                  <script>
                    ${js}
                  </script>
                </body>
              </html>
            `}
            className="absolute inset-0 w-full h-full border-none z-0 pointer-events-none"
            sandbox="allow-scripts allow-same-origin"
          />
        );
      })()}

      {/* Subtle grid overlay */}
      <div className={`pointer-events-none absolute inset-0 ${configThemeIsDark ? 'opacity-[0.03]' : 'opacity-[0.05]'}`}
        style={{
          backgroundImage: `linear-gradient(${configThemeIsDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} 1px, transparent 1px), linear-gradient(90deg, ${configThemeIsDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl px-6 py-14">

        {/* Logo mark moved to bottom */}

        {/* Hide these widgets specifically on the brain-network theme as per user request */}
        {config.theme !== 'brain-network' && (
          <>
            {config.showClock !== false && <ClockWidget isDark={configThemeIsDark} />}
            {config.showSearch !== false && <SearchWidget onNavigate={onNavigate} isDark={configThemeIsDark} />}
            {config.showShortcuts !== false && <ShortcutsWidget onNavigate={onNavigate} isDark={configThemeIsDark} />}
            {config.showAITips !== false && <AITipBanner isDark={configThemeIsDark} />}
            <ShortcutStrip isDark={configThemeIsDark} />
          </>
        )}
      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-5 h-5 rounded-md flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--lumo-accent), #2563eb)' }}>
            <Layers className="w-3 h-3 text-white" />
          </div>
          <span className={`text-[11px] font-semibold tracking-[0.3em] uppercase ${configThemeIsDark ? 'text-white/40' : 'text-gray-500'}`}>Lumo Browser</span>
        </div>
      </div>
    </div>
  );
}
