/**
 * HomeSettingsTab — Controls the Lumo New Tab Page (dashboard) configuration.
 * Reads/writes the same 'Lumo-dashboard-config' key that NewTabPage.tsx uses,
 * so changes take effect immediately on the next new tab.
 */

import React, { useState, useCallback } from 'react';
import {
  Clock, Search, LayoutGrid, StickyNote, Globe, Image as ImageIcon,
  Palette, Monitor, Check, RotateCcw,
} from 'lucide-react';

// ── Types (mirror NewTabPage) ─────────────────────────────────────────────────

type WidgetType = 'clock' | 'search' | 'shortcuts' | 'notes' | 'topSites';

interface Widget { id: string; type: WidgetType; enabled: boolean; order: number; }

interface DashboardConfig {
  widgets: Widget[];
  background: string;
  accentColor: string;
  showGreeting: boolean;
  clockFormat: '12' | '24';
  customBgImage?: string;
  showDate?: boolean;
  showGreetingMsg?: boolean;
  homepageUrl?: string;
  openWhat?: 'newtab' | 'homepage' | 'previous';
}

const STORAGE_KEY = 'Lumo-dashboard-config';

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
  showGreetingMsg: true,
  customBgImage: '',
  homepageUrl: 'nova://newtab',
  openWhat: 'newtab',
};

const BACKGROUNDS = [
  { id: 'gradient-1', label: 'Ocean',    style: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { id: 'gradient-2', label: 'Sunset',   style: 'linear-gradient(135deg, #f093fb, #f5576c, #fda085)' },
  { id: 'gradient-3', label: 'Forest',   style: 'linear-gradient(135deg, #134e5e, #71b280)' },
  { id: 'gradient-4', label: 'Midnight', style: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' },
  { id: 'gradient-5', label: 'Aurora',   style: 'linear-gradient(135deg, #007991, #78ffd6)' },
  { id: 'gradient-6', label: 'Volcano',  style: 'linear-gradient(135deg, #1d1d1d, #8b0000, #ff4500)' },
  { id: 'solid-light',label: 'Light',    style: '#f8fafc' },
  { id: 'solid-dark', label: 'Dark',     style: '#0f0f0f' },
];

const ACCENT_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316',
];

const WIDGET_INFO: Record<WidgetType, { label: string; desc: string; icon: React.ReactNode }> = {
  clock:     { label: 'Clock & Date',      desc: 'Large clock with greeting',        icon: <Clock className="w-4 h-4" /> },
  search:    { label: 'Web Search Bar',    desc: 'Search or enter URL',              icon: <Search className="w-4 h-4" /> },
  shortcuts: { label: 'Shortcuts',         desc: 'Quick-access site tiles',          icon: <LayoutGrid className="w-4 h-4" /> },
  notes:     { label: 'Quick Notes',       desc: 'Scratchpad that persists locally', icon: <StickyNote className="w-4 h-4" /> },
  topSites:  { label: 'Top Sites',         desc: 'Popular site favicons',            icon: <Globe className="w-4 h-4" /> },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h2>
      </div>
      <div className="bg-white dark:bg-[#242424] rounded-xl border border-gray-100 dark:border-[#333] overflow-hidden divide-y divide-gray-50 dark:divide-[#333]">
        {children}
      </div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{ width: 40, height: 22 }}
      className={`relative rounded-full transition-colors duration-200 ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_CONFIG;
  });

  const update = useCallback((updates: Partial<DashboardConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('lumo:dashboard-config-updated'));
      return next;
    });
  }, []);

  const toggleWidget = useCallback((type: WidgetType) => {
    setConfig(prev => {
      const next = {
        ...prev,
        widgets: prev.widgets.map(w => w.type === type ? { ...w, enabled: !w.enabled } : w),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('lumo:dashboard-config-updated'));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
    setConfig(DEFAULT_CONFIG);
  }, []);

  return { config, update, toggleWidget, reset };
}

// ── Main Component ────────────────────────────────────────────────────────────

export function HomeSettingsTab() {
  const { config, update, toggleWidget, reset } = useDashboardConfig();
  const [customBgInput, setCustomBgInput] = useState(config.customBgImage ?? '');

  return (
    <div>

      {/* ── New Windows & Tabs ── */}
      <Section title="New Windows & Tabs" icon={<Monitor className="w-4 h-4" />}>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">When opening a new tab or window, show:</p>
          {([
            ['newtab',   'Lumo Home (New Tab page)'],
            ['homepage', 'Homepage URL'],
            ['previous', 'Previous windows and tabs'],
          ] as const).map(([val, lbl]) => (
            <label key={val} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${config.openWhat === val ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                {config.openWhat === val && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </span>
              <input type="radio" className="hidden" checked={config.openWhat === val} onChange={() => update({ openWhat: val })} />
              <span className="text-sm text-gray-800 dark:text-gray-200">{lbl}</span>
            </label>
          ))}
        </div>
        {config.openWhat === 'homepage' && (
          <Row label="Homepage URL" description="Page shown when opening a new window">
            <input
              type="text"
              value={config.homepageUrl ?? ''}
              onChange={e => update({ homepageUrl: e.target.value })}
              placeholder="https://example.com"
              className="w-52 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </Row>
        )}
      </Section>

      {/* ── Background ── */}
      <Section title="Background" icon={<ImageIcon className="w-4 h-4" />}>
        {/* Preset gradients */}
        <div className="px-4 py-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Preset Backgrounds</p>
          <div className="grid grid-cols-4 gap-2">
            {BACKGROUNDS.map(bg => (
              <button
                key={bg.id}
                onClick={() => update({ background: bg.id, customBgImage: '' })}
                title={bg.label}
                className={`relative h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  config.background === bg.id && !config.customBgImage
                    ? 'border-blue-500 scale-[1.04]'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-[#555]'
                }`}
                style={{ background: bg.style }}
              >
                <span className="absolute bottom-0.5 left-0 right-0 text-[9px] text-center text-white/70 font-medium">{bg.label}</span>
                {config.background === bg.id && !config.customBgImage && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Custom image URL */}
        <div className="px-4 py-3 border-t border-gray-50 dark:border-[#333]">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Custom Background Image URL</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customBgInput}
              onChange={e => setCustomBgInput(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => update({ customBgImage: customBgInput })}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >Apply</button>
          </div>
          {config.customBgImage && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-8 rounded-md overflow-hidden border border-gray-200 dark:border-[#444]">
                <img src={config.customBgImage} alt="preview" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => { update({ customBgImage: '' }); setCustomBgInput(''); }}
                className="text-[11px] text-red-500 hover:underline"
              >Remove</button>
            </div>
          )}
        </div>
      </Section>

      {/* ── Accent Color ── */}
      <Section title="Accent Color" icon={<Palette className="w-4 h-4" />}>
        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-3 mb-3">
            {ACCENT_COLORS.map(color => (
              <button
                key={color}
                onClick={() => update({ accentColor: color })}
                title={color}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  config.accentColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              >
                {config.accentColor === color && <Check className="w-3.5 h-3.5 text-white mx-auto" />}
              </button>
            ))}
            {/* Custom color picker */}
            <label title="Custom color" className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-all overflow-hidden">
              <input type="color" value={config.accentColor} onChange={e => update({ accentColor: e.target.value })}
                className="opacity-0 absolute w-8 h-8 cursor-pointer" />
              <Palette className="w-3.5 h-3.5 text-gray-400" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: config.accentColor }} />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{config.accentColor}</span>
          </div>
        </div>
      </Section>

      {/* ── Clock & Date ── */}
      <Section title="Clock & Date" icon={<Clock className="w-4 h-4" />}>
        <Row label="Show Clock" description="Large time display on the new tab page">
          <Toggle enabled={config.widgets.find(w => w.type === 'clock')?.enabled ?? true} onChange={() => toggleWidget('clock')} />
        </Row>
        <Row label="Clock Format">
          <div className="flex bg-gray-100 dark:bg-[#333] rounded-lg p-0.5 gap-0.5">
            {(['12', '24'] as const).map(f => (
              <button
                key={f}
                onClick={() => update({ clockFormat: f })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  config.clockFormat === f
                    ? 'bg-white dark:bg-[#444] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >{f}-hour</button>
            ))}
          </div>
        </Row>
        <Row label="Show Date" description="Display day and full date below the clock">
          <Toggle enabled={config.showDate ?? true} onChange={v => update({ showDate: v })} />
        </Row>
        <Row label="Show Greeting" description='e.g. "Good morning" message'>
          <Toggle enabled={config.showGreeting} onChange={v => update({ showGreeting: v })} />
        </Row>
      </Section>

      {/* ── Home Screen Content ── */}
      <Section title="Home Screen Content" icon={<LayoutGrid className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-500">Choose which widgets appear on your Lumo Home screen.</p>
        {(Object.entries(WIDGET_INFO) as [WidgetType, typeof WIDGET_INFO[WidgetType]][]).map(([type, info]) => (
          <Row key={type} label={info.label} description={info.desc}>
            <Toggle
              enabled={config.widgets.find(w => w.type === type)?.enabled ?? false}
              onChange={() => toggleWidget(type)}
            />
          </Row>
        ))}
      </Section>

      {/* ── Reset ── */}
      <div className="flex justify-end mb-8">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-[#333] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to defaults
        </button>
      </div>

    </div>
  );
}
