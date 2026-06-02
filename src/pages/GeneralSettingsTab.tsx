/**
 * GeneralSettingsTab — Comprehensive General settings panel
 * Mirrors browser-standard general settings (Startup, Tabs, Layout, Language, Files, Performance)
 */

import React, { useState } from 'react';
import {
  Power, LayoutGrid, PanelLeft, Languages, HardDrive,
  Zap, Wifi, FileText, ChevronRight, Check, Cpu,
} from 'lucide-react';
import { BrowserSettings } from './SettingsPage';

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
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
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
      className={`relative rounded-full transition-colors duration-200 ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
  );
}

function SelectRow({ label, description, options, value, onChange }: {
  label: string; description?: string;
  options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <Row label={label} description={description}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs rounded-md px-2 py-1.5 bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Row>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}

export function GeneralSettingsTab({ settings, onUpdateSettings }: Props) {
  // Local UI state for options not yet in BrowserSettings
  const [startup, setStartup] = useState<'newtab' | 'previous' | 'home'>('newtab');
  const [ctrlTabRecent, setCtrlTabRecent] = useState(true);
  const [openLinksInTabs, setOpenLinksInTabs] = useState(true);
  const [switchToNewTab, setSwitchToNewTab] = useState(false);
  const [warnBeforeClose, setWarnBeforeClose] = useState(true);
  const [showTabPreview, setShowTabPreview] = useState(true);
  const [tabLayout, setTabLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showSidebar, setShowSidebar] = useState(true);
  const [websiteAppearance, setWebsiteAppearance] = useState<'auto' | 'light' | 'dark'>('auto');
  const [defaultFont, setDefaultFont] = useState('Inter');
  const [defaultZoom, setDefaultZoom] = useState('100');
  const [zoomTextOnly, setZoomTextOnly] = useState(false);
  const [spellCheck, setSpellCheck] = useState(true);
  const [saveLocation, setSaveLocation] = useState('~/Downloads');
  const [alwaysAsk, setAlwaysAsk] = useState(false);
  const [drmEnabled, setDrmEnabled] = useState(true);
  const [useRecommendedPerf, setUseRecommendedPerf] = useState(true);
  const [proxyType, setProxyType] = useState<'none' | 'auto' | 'manual'>('none');

  return (
    <div>

      {/* ── Startup ── */}
      <Section title="Startup" icon={<Power className="w-4 h-4" />}>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">When Nova starts</p>
          {([
            ['newtab', 'Open the New Tab page'],
            ['previous', 'Open previous windows and tabs'],
            ['home', 'Open the home page'],
          ] as const).map(([val, lbl]) => (
            <label key={val} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${startup === val ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                {startup === val && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </span>
              <input type="radio" className="hidden" checked={startup === val} onChange={() => setStartup(val)} />
              <span className="text-sm text-gray-800 dark:text-gray-200">{lbl}</span>
            </label>
          ))}
        </div>
        <Row label="Import Browser Data" description="Import bookmarks, passwords, history, and autofill data into Nova.">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors">
            Import <ChevronRight className="w-3 h-3" />
          </button>
        </Row>
      </Section>

      {/* ── Tabs ── */}
      <Section title="Tabs" icon={<LayoutGrid className="w-4 h-4" />}>
        <Row label="Ctrl+Tab cycles through tabs in recently used order">
          <Checkbox checked={ctrlTabRecent} onChange={setCtrlTabRecent} />
        </Row>
        <Row label="Open links in tabs instead of new windows">
          <Checkbox checked={openLinksInTabs} onChange={setOpenLinksInTabs} />
        </Row>
        <Row label="Switch to new tab immediately" description="When you open a link, image or media in a new tab">
          <Checkbox checked={switchToNewTab} onChange={setSwitchToNewTab} />
        </Row>
        <Row label="Ask before closing multiple tabs">
          <Checkbox checked={warnBeforeClose} onChange={setWarnBeforeClose} />
        </Row>
        <Row label="Show image preview when hovering over a tab">
          <Checkbox checked={showTabPreview} onChange={setShowTabPreview} />
        </Row>
      </Section>

      {/* ── Browser Layout ── */}
      <Section title="Browser Layout" icon={<PanelLeft className="w-4 h-4" />}>
        <div className="px-4 py-3 grid grid-cols-2 gap-3">
          {([
            ['horizontal', 'Horizontal Tabs', 'Display at top of browser'],
            ['vertical',   'Vertical Tabs',   'Display on the side, in the sidebar'],
          ] as const).map(([val, lbl, desc]) => (
            <button
              key={val}
              onClick={() => setTabLayout(val)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${
                tabLayout === val
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-100 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444]'
              }`}
            >
              <span className={`text-sm font-semibold ${tabLayout === val ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{lbl}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</span>
            </button>
          ))}
        </div>
        <Row label="Show Sidebar" description="Quickly access bookmarks, AI chatbots, and more without leaving your main view.">
          <Toggle enabled={showSidebar} onChange={setShowSidebar} />
        </Row>
      </Section>

      {/* ── Language & Appearance ── */}
      <Section title="Language & Appearance" icon={<Languages className="w-4 h-4" />}>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Website appearance</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">Some websites adapt their color scheme based on your preferences.</p>
          <div className="flex gap-2">
            {(['auto', 'light', 'dark'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setWebsiteAppearance(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                  websiteAppearance === v
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-300'
                }`}
              >{v === 'auto' ? 'Automatic' : v}</button>
            ))}
          </div>
        </div>
        <SelectRow
          label="Default Font"
          description="Font used for pages that don't specify one"
          options={[
            { value: 'Inter', label: 'Inter' },
            { value: 'Times New Roman', label: 'Times New Roman' },
            { value: 'Arial', label: 'Arial' },
            { value: 'Georgia', label: 'Georgia' },
            { value: 'Courier New', label: 'Courier New' },
          ]}
          value={defaultFont}
          onChange={setDefaultFont}
        />
        <SelectRow
          label="Default Zoom"
          description="Default page zoom level"
          options={['75','90','100','110','125','150','175','200'].map(v => ({ value: v, label: `${v}%` }))}
          value={defaultZoom}
          onChange={setDefaultZoom}
        />
        <Row label="Zoom text only" description="Page zoom only affects text, not images or other elements">
          <Checkbox checked={zoomTextOnly} onChange={setZoomTextOnly} />
        </Row>
        <Row label="Check spelling as you type">
          <Toggle enabled={spellCheck} onChange={setSpellCheck} />
        </Row>
      </Section>

      {/* ── Files & Downloads ── */}
      <Section title="Files & Downloads" icon={<HardDrive className="w-4 h-4" />}>
        <Row label="Save files to" description={saveLocation}>
          <button
            onClick={() => alert('Folder picker not yet integrated')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors"
          >
            Browse…
          </button>
        </Row>
        <Row label="Always ask where to save files">
          <Checkbox checked={alwaysAsk} onChange={setAlwaysAsk} />
        </Row>
        <Row label="Play DRM-controlled content" description="Required for streaming sites like Netflix and Spotify">
          <Toggle enabled={drmEnabled} onChange={setDrmEnabled} />
        </Row>
      </Section>

      {/* ── Performance ── */}
      <Section title="Performance" icon={<Zap className="w-4 h-4" />}>
        <Row label="Use recommended performance settings" description="Settings are tailored to your hardware and operating system.">
          <Toggle enabled={useRecommendedPerf} onChange={setUseRecommendedPerf} />
        </Row>
      </Section>

      {/* ── AI Auto-Agent ── */}
      <Section title="AI Auto-Agent" icon={<Cpu className="w-4 h-4" />}>
        <Row label="OpenRouter API Key" description="Required for Autonomous Agent (GPT-4o / Claude 3.5)">
          <input
            type="password"
            value={settings.openRouterApiKey || ''}
            onChange={(e) => onUpdateSettings({ openRouterApiKey: e.target.value })}
            placeholder="sk-or-v1-..."
            className="w-48 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </Row>
      </Section>

      {/* ── Network ── */}
      <Section title="Network Settings" icon={<Wifi className="w-4 h-4" />}>
        <SelectRow
          label="Connection Type"
          description="Configure how Nova connects to the internet"
          options={[
            { value: 'none', label: 'No proxy' },
            { value: 'auto', label: 'Auto-detect proxy settings' },
            { value: 'manual', label: 'Manual proxy configuration' },
          ]}
          value={proxyType}
          onChange={(v) => setProxyType(v as typeof proxyType)}
        />
      </Section>

    </div>
  );
}
