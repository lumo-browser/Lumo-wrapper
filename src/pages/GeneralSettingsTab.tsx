/**
 * GeneralSettingsTab — Fully functional General settings panel.
 * All settings persist to localStorage under 'nova-general-settings'.
 * Settings that require Electron IPC are sent via window.electron.send/invoke.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Power, LayoutGrid, PanelLeft, Languages, HardDrive,
  Zap, Wifi, Check, Cpu, Sun, Moon, Monitor, Type,
  FolderOpen, Globe, ChevronRight, RotateCcw, AlertCircle,
} from 'lucide-react';
import { BrowserSettings } from './SettingsPage';

// ── Persisted Settings Shape ──────────────────────────────────────────────────

interface GeneralSettings {
  startup: 'newtab' | 'previous' | 'home';
  homepageUrl: string;
  ctrlTabRecent: boolean;
  openLinksInTabs: boolean;
  switchToNewTab: boolean;
  warnBeforeClose: boolean;
  showTabPreview: boolean;
  tabLayout: 'horizontal' | 'vertical';
  showSidebar: boolean;
  websiteAppearance: 'auto' | 'light' | 'dark';
  defaultFont: string;
  defaultZoom: string;
  zoomTextOnly: boolean;
  spellCheck: boolean;
  saveLocation: string;
  alwaysAskDownload: boolean;
  drmEnabled: boolean;
  useRecommendedPerf: boolean;
  proxyType: 'none' | 'auto' | 'manual';
  proxyHost: string;
  proxyPort: string;
}

const STORAGE_KEY = 'lumo-general-settings';

const DEFAULTS: GeneralSettings = {
  startup: 'newtab',
  homepageUrl: 'https://www.google.com',
  ctrlTabRecent: true,
  openLinksInTabs: true,
  switchToNewTab: false,
  warnBeforeClose: true,
  showTabPreview: true,
  tabLayout: 'horizontal',
  showSidebar: true,
  websiteAppearance: 'auto',
  defaultFont: 'Inter',
  defaultZoom: '100',
  zoomTextOnly: false,
  spellCheck: true,
  saveLocation: '~/Downloads',
  alwaysAskDownload: false,
  drmEnabled: true,
  useRecommendedPerf: true,
  proxyType: 'none',
  proxyHost: '',
  proxyPort: '',
};

function loadSettings(): GeneralSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function saveSettings(s: GeneralSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

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

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
        checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333]'
      }`}
    >
      {checked && <Check className="w-2.5 h-2.5 text-white" />}
    </button>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{ width: 40, height: 22 }}
      className={`relative rounded-full transition-colors duration-200 flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}

export function GeneralSettingsTab({ settings, onUpdateSettings }: Props) {
  const [gen, setGen] = useState<GeneralSettings>(loadSettings);
  const [downloadPathMsg, setDownloadPathMsg] = useState('');
  const [proxyTestMsg, setProxyTestMsg] = useState('');

  // Persist on every change
  useEffect(() => { saveSettings(gen); }, [gen]);

  const set = useCallback(<K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setGen(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Side effects ───────────────────────────────────────────────────────────

  // Apply default zoom via IPC when it changes
  useEffect(() => {
    if (window.electron?.send) {
      window.electron.send('lumo:set-default-zoom', parseFloat(gen.defaultZoom) / 100);
    }
  }, [gen.defaultZoom]);

  // Apply spell check via IPC
  useEffect(() => {
    if (window.electron?.send) {
      window.electron.send('lumo:set-spell-check', gen.spellCheck);
    }
  }, [gen.spellCheck]);

  // Apply proxy via IPC
  useEffect(() => {
    if (window.electron?.send) {
      window.electron.send('lumo:set-proxy', {
        type: gen.proxyType,
        host: gen.proxyHost,
        port: gen.proxyPort,
      });
    }
  }, [gen.proxyType, gen.proxyHost, gen.proxyPort]);

  // Apply download path via IPC
  useEffect(() => {
    if (window.electron?.send) {
      window.electron.send('lumo:set-download-path', {
        path: gen.saveLocation,
        alwaysAsk: gen.alwaysAskDownload,
      });
    }
  }, [gen.saveLocation, gen.alwaysAskDownload]);

  // Notify App.tsx about sidebar + tab layout so they can re-render
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('lumo:settings-changed', {
      detail: { showSidebar: gen.showSidebar, tabLayout: gen.tabLayout, ctrlTabRecent: gen.ctrlTabRecent }
    }));
  }, [gen.showSidebar, gen.tabLayout, gen.ctrlTabRecent]);

  // Browse for download folder using Electron dialog
  const browseDownloadFolder = async () => {
    try {
      const result = await window.electron?.invoke('lumo:pick-download-folder');
      if (result) {
        set('saveLocation', result as string);
        setDownloadPathMsg(` Saved to ${result}`);
        setTimeout(() => setDownloadPathMsg(''), 3000);
      }
    } catch {
      setDownloadPathMsg('Folder picker not available in dev mode');
      setTimeout(() => setDownloadPathMsg(''), 3000);
    }
  };

  // Test proxy connection
  const testProxy = async () => {
    setProxyTestMsg('Testing…');
    try {
      await window.electron?.invoke('lumo:test-proxy', {
        type: gen.proxyType, host: gen.proxyHost, port: gen.proxyPort,
      });
      setProxyTestMsg(' Connection successful');
    } catch {
      setProxyTestMsg(' Could not connect');
    }
    setTimeout(() => setProxyTestMsg(''), 4000);
  };

  // Reset all General settings
  const resetAll = () => {
    setGen({ ...DEFAULTS });
  };

  return (
    <div>

      {/* ── Startup ── */}
      <Section title="Startup" icon={<Power className="w-4 h-4" />}>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">When Lumo starts, open:</p>
          {([
            ['newtab',   'The New Tab page'],
            ['previous', 'Previous windows and tabs'],
            ['home',     'My homepage'],
          ] as const).map(([val, lbl]) => (
            <label key={val} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <span
                onClick={() => set('startup', val)}
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                  gen.startup === val ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {gen.startup === val && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-200" onClick={() => set('startup', val)}>{lbl}</span>
            </label>
          ))}
        </div>
        {gen.startup === 'home' && (
          <div className="px-4 pb-3">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Homepage URL</p>
            <input
              type="url"
              value={gen.homepageUrl}
              onChange={e => set('homepageUrl', e.target.value)}
              placeholder="https://www.google.com"
              className="w-full px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
        <Row label="Import Browser Data" description="Import bookmarks, passwords, history, and autofill data.">
          <button
            onClick={() => window.electron?.send('lumo:import-browser-data', {})}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors"
          >
            Import <ChevronRight className="w-3 h-3" />
          </button>
        </Row>
      </Section>

      {/* ── Tabs ── */}
      <Section title="Tabs" icon={<LayoutGrid className="w-4 h-4" />}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ctrl+Tab cycles through recently used order</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Otherwise cycles left-to-right through open tabs</p>
          </div>
          <Checkbox checked={gen.ctrlTabRecent} onChange={v => set('ctrlTabRecent', v)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 mr-4">Open links in tabs instead of new windows</p>
          <Checkbox checked={gen.openLinksInTabs} onChange={v => set('openLinksInTabs', v)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Switch to new tab immediately</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">When a link opens in a new tab, focus it right away</p>
          </div>
          <Checkbox checked={gen.switchToNewTab} onChange={v => set('switchToNewTab', v)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 mr-4">Ask before closing multiple tabs</p>
          <Checkbox checked={gen.warnBeforeClose} onChange={v => set('warnBeforeClose', v)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 mr-4">Show image preview when hovering over a tab</p>
          <Checkbox checked={gen.showTabPreview} onChange={v => set('showTabPreview', v)} />
        </div>
      </Section>

      {/* ── Browser Layout ── */}
      <Section title="Browser Layout" icon={<PanelLeft className="w-4 h-4" />}>
        <div className="px-4 py-3 grid grid-cols-2 gap-3">
          {([
            ['horizontal', 'Horizontal Tabs', 'Classic tab bar at the top'],
            ['vertical',   'Vertical Tabs',   'Tab panel on the left side'],
          ] as const).map(([val, lbl, desc]) => (
            <button
              key={val}
              onClick={() => set('tabLayout', val)}
              className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 transition-all text-left ${
                gen.tabLayout === val
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-100 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${gen.tabLayout === val ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{lbl}</span>
                {gen.tabLayout === val && <Check className="w-3 h-3 text-blue-500" />}
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</span>
            </button>
          ))}
        </div>
        <Row label="Show AI Sidebar" description="Quick access to bookmarks, AI chatbots, and more.">
          <Toggle enabled={gen.showSidebar} onChange={v => set('showSidebar', v)} />
        </Row>
      </Section>

      {/* ── Language & Appearance ── */}
      <Section title="Language & Appearance" icon={<Languages className="w-4 h-4" />}>
        {/* Website color scheme */}
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Website appearance</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">Some sites adapt their colors to match your preference.</p>
          <div className="flex gap-2">
            {([
              ['auto',  'Automatic', <Monitor className="w-3 h-3" />],
              ['light', 'Light',     <Sun className="w-3 h-3" />],
              ['dark',  'Dark',      <Moon className="w-3 h-3" />],
            ] as const).map(([v, lbl, icon]) => (
              <button
                key={v}
                onClick={() => set('websiteAppearance', v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  gen.websiteAppearance === v
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-300'
                }`}
              >
                {icon}{lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Default font */}
        <Row label="Default Font" description="Font used for pages that don't specify one">
          <select
            value={gen.defaultFont}
            onChange={e => set('defaultFont', e.target.value)}
            className="text-xs rounded-md px-2 py-1.5 bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {['Inter','Arial','Georgia','Times New Roman','Courier New','Verdana','Trebuchet MS','Helvetica'].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </Row>

        {/* Default zoom */}
        <Row label="Default Zoom" description="Default zoom level applied to all new pages">
          <select
            value={gen.defaultZoom}
            onChange={e => set('defaultZoom', e.target.value)}
            className="text-xs rounded-md px-2 py-1.5 bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {['67','75','80','90','100','110','125','133','150','175','200','250','300'].map(v => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
        </Row>

        {/* Zoom text only */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Zoom text only</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Zoom affects only text, not images or layout</p>
          </div>
          <Checkbox checked={gen.zoomTextOnly} onChange={v => set('zoomTextOnly', v)} />
        </div>

        {/* Spell check */}
        <Row label="Check spelling as you type">
          <Toggle enabled={gen.spellCheck} onChange={v => set('spellCheck', v)} />
        </Row>
      </Section>

      {/* ── Files & Downloads ── */}
      <Section title="Files & Downloads" icon={<HardDrive className="w-4 h-4" />}>
        <div className="px-4 py-3.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Save files to</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={gen.saveLocation}
              onChange={e => set('saveLocation', e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={browseDownloadFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors flex-shrink-0"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Browse
            </button>
          </div>
          {downloadPathMsg && (
            <p className={`text-[11px] mt-1.5 ${downloadPathMsg.startsWith('') ? 'text-green-500' : 'text-amber-500'}`}>
              {downloadPathMsg}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Always ask where to save files</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Show a save dialog for every download</p>
          </div>
          <Checkbox checked={gen.alwaysAskDownload} onChange={v => set('alwaysAskDownload', v)} />
        </div>
        <Row label="Play DRM-controlled content" description="Required for Netflix, Spotify, and similar streaming sites">
          <Toggle enabled={gen.drmEnabled} onChange={v => set('drmEnabled', v)} />
        </Row>
      </Section>

      {/* ── Performance ── */}
      <Section title="Performance" icon={<Zap className="w-4 h-4" />}>
        <Row
          label="Use recommended performance settings"
          description="Settings tailored to your hardware and OS for the best balance of speed and memory usage."
        >
          <Toggle enabled={gen.useRecommendedPerf} onChange={v => set('useRecommendedPerf', v)} />
        </Row>
        {!gen.useRecommendedPerf && (
          <div className="px-4 py-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Custom performance settings are not yet configurable in this version. Default system settings will be used.
            </p>
          </div>
        )}
      </Section>

      {/* ── AI Auto-Agent ── */}
      <Section title="AI Auto-Agent" icon={<Cpu className="w-4 h-4" />}>
        <Row label="OpenRouter API Key" description="Powers the Autonomous Agent — supports GPT-4o, Claude 3.5, Llama 3, Gemma 2">
          <input
            type="password"
            value={settings.openRouterApiKey || ''}
            onChange={e => onUpdateSettings({ openRouterApiKey: e.target.value })}
            placeholder="sk-or-v1-..."
            className="w-48 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </Row>
        {settings.openRouterApiKey && (
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-green-600 dark:text-green-400">API key configured — AI Agent is ready</span>
          </div>
        )}
      </Section>

      {/* ── Network Settings ── */}
      <Section title="Network Settings" icon={<Globe className="w-4 h-4" />}>
        <Row label="Connection Type" description="Configure how Lumo connects to the internet">
          <select
            value={gen.proxyType}
            onChange={e => set('proxyType', e.target.value as GeneralSettings['proxyType'])}
            className="text-xs rounded-md px-2 py-1.5 bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="none">No proxy (direct connection)</option>
            <option value="auto">Auto-detect proxy settings</option>
            <option value="manual">Manual proxy configuration</option>
          </select>
        </Row>

        {gen.proxyType === 'manual' && (
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">HTTP/HTTPS Proxy</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={gen.proxyHost}
                onChange={e => set('proxyHost', e.target.value)}
                placeholder="Host (e.g. 127.0.0.1)"
                className="flex-1 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={gen.proxyPort}
                onChange={e => set('proxyPort', e.target.value)}
                placeholder="Port (e.g. 8080)"
                className="w-28 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={testProxy}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Test Connection
              </button>
              {proxyTestMsg && (
                <span className={`text-[11px] ${proxyTestMsg.startsWith('') ? 'text-green-500' : proxyTestMsg === 'Testing…' ? 'text-gray-400' : 'text-red-500'}`}>
                  {proxyTestMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── Reset ── */}
      <div className="flex justify-end mb-8">
        <button
          onClick={resetAll}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-[#333] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset General settings to defaults
        </button>
      </div>

    </div>
  );
}
