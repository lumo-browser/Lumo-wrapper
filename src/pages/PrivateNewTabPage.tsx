import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  EyeOff,
  Search,
  Settings,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { BrowserSettings, SEARCH_ENGINES } from './SettingsPage';

interface PrivateNewTabPageProps {
  onNavigate: (url: string) => void;
  settings: BrowserSettings;
  onUpdateSettings: (updates: Partial<BrowserSettings>) => void;
}

// ── Clock Hook ──
function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

// ── Ambient Glowing Orbs ──
function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{
          opacity: 0.15,
          background: 'radial-gradient(circle, #7c3aed, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'drift1 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{
          opacity: 0.12,
          background: 'radial-gradient(circle, #db2777, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'drift2 28s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full"
        style={{
          opacity: 0.08,
          background: 'radial-gradient(circle, #2563eb, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'drift1 20s ease-in-out infinite reverse',
        }}
      />
      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 20px) scale(0.9); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

export function PrivateNewTabPage({
  onNavigate,
  settings,
  onUpdateSettings,
}: PrivateNewTabPageProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Time formatting
  const time = useTime();
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  useEffect(() => {
    // Focus search on load
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  // Search Engine resolution
  const activeEngine =
    SEARCH_ENGINES.find((e) => e.id === settings.searchEngine) ??
    SEARCH_ENGINES[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^https?:\/\//.test(q)) {
      onNavigate(q);
      return;
    }
    if (q.includes('.') && !q.includes(' ')) {
      onNavigate(`https://${q}`);
      return;
    }
    onNavigate(`${activeEngine.url}${encodeURIComponent(q)}`);
  };

  // Toggle switch helper
  const ToggleSwitch = ({
    enabled,
    onChange,
  }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? 'bg-violet-600' : 'bg-[#2a2a35] border border-[#3e3e4f]'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full w-full bg-[#0a0a0f] text-white overflow-auto select-none px-6 py-12">
      <AmbientOrbs />

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main glass panel wrapper */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        
        {/* Header Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold tracking-wide">
          <EyeOff className="w-3.5 h-3.5" />
          <span>Disposable Workspace Active</span>
        </div>

        {/* Clock & Date */}
        <div className="text-center mb-1 select-none">
          <p className="text-4xl font-extralight tracking-widest text-white/90 font-mono">{timeStr}</p>
          <p className="text-xs text-white/40 tracking-wider mt-1">{dateStr}</p>
        </div>

        {/* Title & Greeting */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-violet-300 bg-clip-text text-transparent">
            Browse Privately. Leave No Trace.
          </h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Everything you do in this workspace is strictly local and temporary. Once closed, the entire session will be completely expunged.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mt-2">
          <div
            className={`relative flex items-center rounded-2xl transition-all duration-300 bg-[#121218]/90 border ${
              isFocused
                ? 'border-violet-500/60 shadow-[0_0_20px_rgba(124,58,237,0.15)] ring-2 ring-violet-500/20'
                : 'border-white/5 hover:border-white/10 shadow-xl'
            }`}
          >
            <Search className="absolute left-5 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`Search with ${activeEngine.name} or enter URL...`}
              className="w-full pl-14 pr-24 py-4.5 bg-transparent text-base text-white placeholder-gray-500 outline-none"
            />
            <button
              type="submit"
              className="absolute right-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors shadow-md shadow-violet-600/20"
            >
              Search
            </button>
          </div>
        </form>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full mt-4">
          
          {/* Column 1: Info Cards (8 cols) */}
          <div className="md:col-span-8 flex flex-col gap-6">
            
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* How it protects */}
              <div className="bg-[#121218]/65 backdrop-blur-md border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-green-400">
                  <Shield className="w-4 h-4" />
                  <h3 className="text-sm font-bold tracking-wide">WHAT NOVA SHIELDS</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span><strong>Browsing History:</strong> No sites visited, cache, or form details will be saved to your local profile.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span><strong>Isolated Cookies & Storage:</strong> Keeps website trackers boxed inside this session.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span><strong>Auto Memory Purge:</strong> Erases RAM partition instantly when this window is closed.</span>
                  </li>
                </ul>
              </div>

              {/* What remains visible */}
              <div className="bg-[#121218]/65 backdrop-blur-md border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-sm font-bold tracking-wide">WHAT REMAINS VISIBLE</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Network Operator:</strong> Your ISP, employer, or school router can still see the hostnames you connect to.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Websites Visited:</strong> Web pages can still track your IP address and client browser parameters.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Downloaded Files:</strong> Any files you download are saved directly onto your physical hard drive.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Privacy Tips banner */}
            <div className="bg-gradient-to-r from-violet-950/20 to-pink-950/10 border border-violet-900/20 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400 leading-relaxed">
                <strong>Privacy Tip:</strong> Using a VPN or Tor proxy hides your IP address and network destination from your ISP. You can configure proxy connections in settings under <strong>Privacy & Security</strong>.
              </div>
            </div>

          </div>

          {/* Column 2: Live Controls Panel (4 cols) */}
          <div className="md:col-span-4 bg-[#121218]/65 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Privacy controls</h3>
                <Settings className="w-3.5 h-3.5 text-gray-500" />
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white">Aggressive Ad-Blocker</p>
                    <p className="text-[10px] text-gray-500">Block ads & trackers</p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.blockAds}
                    onChange={(v) => onUpdateSettings({ blockAds: v })}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white">Do Not Track Header</p>
                    <p className="text-[10px] text-gray-500">Send DNT request to sites</p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.doNotTrack}
                    onChange={(v) => onUpdateSettings({ doNotTrack: v })}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white">Block Popups</p>
                    <p className="text-[10px] text-gray-500">Stop scripts from opening popups</p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.blockPopups}
                    onChange={(v) => onUpdateSettings({ blockPopups: v })}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats / Info */}
            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-gray-500 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Clock Mode:</span>
                <span className="font-mono text-gray-400">{timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Local Session:</span>
                <span className="text-green-500 font-semibold">Active & Encrypted</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer stamp */}
      <div className="absolute bottom-4 text-[10px] font-semibold tracking-[0.4em] uppercase text-white/10 select-none">
        Nova Private Workspace v0.2.0
      </div>
    </div>
  );
}
