/**
 * Settings Page — Fully functional browser settings
 * Appearance, Search Engine, Privacy, Downloads, and About.
 */

import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Search,
  Shield,
  Trash2,
  Download,
  Info,
  ChevronRight,
  Check,
  Globe,
  Eye,
  EyeOff,
  Cookie,
  HardDrive,
} from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'brave' | 'yahoo';

export interface BrowserSettings {
  theme: ThemeMode;
  searchEngine: SearchEngine;
  fontSize: number; // 12–20
  blockAds: boolean;
  blockPopups: boolean;
  doNotTrack: boolean;
  clearOnExit: boolean;
}

interface SettingsPageProps {
  settings: BrowserSettings;
  onUpdateSettings: (updates: Partial<BrowserSettings>) => void;
  onClearBrowsingData: () => void;
  historyCount: number;
  bookmarkCount: number;
}

const SEARCH_ENGINES: { id: SearchEngine; name: string; url: string; icon: string }[] = [
  { id: 'google',      name: 'Google',      url: 'https://www.google.com/search?q=',          icon: 'G' },
  { id: 'bing',        name: 'Bing',        url: 'https://www.bing.com/search?q=',            icon: 'B' },
  { id: 'duckduckgo',  name: 'DuckDuckGo',  url: 'https://duckduckgo.com/?q=',                icon: 'D' },
  { id: 'brave',       name: 'Brave Search', url: 'https://search.brave.com/search?q=',       icon: '🦁' },
  { id: 'yahoo',       name: 'Yahoo',       url: 'https://search.yahoo.com/search?p=',        icon: 'Y' },
];

const THEME_OPTIONS: { id: ThemeMode; name: string; icon: React.ReactNode }[] = [
  { id: 'light',  name: 'Light',  icon: <Sun className="w-4 h-4" /> },
  { id: 'dark',   name: 'Dark',   icon: <Moon className="w-4 h-4" /> },
  { id: 'system', name: 'System', icon: <Monitor className="w-4 h-4" /> },
];

function SettingSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function SettingsPage({
  settings,
  onUpdateSettings,
  onClearBrowsingData,
  historyCount,
  bookmarkCount,
}: SettingsPageProps): React.ReactElement {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#333] flex items-center justify-center">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Customize your Nova Browser experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin">
        <div className="max-w-2xl mx-auto">

          {/* ── Appearance ── */}
          <SettingSection title="Appearance" icon={<Sun className="w-4 h-4" />}>
            <SettingRow label="Theme" description="Choose between light, dark, or system theme">
              <div className="flex bg-gray-100 dark:bg-[#333] rounded-lg p-0.5 gap-0.5">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onUpdateSettings({ theme: opt.id })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      settings.theme === opt.id
                        ? 'bg-white dark:bg-[#444] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {opt.icon}
                    {opt.name}
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Font Size" description={`${settings.fontSize}px — Adjust text size across the browser`}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400">A</span>
                <input
                  type="range"
                  min={12}
                  max={20}
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-28 h-1.5 accent-blue-600 rounded-full cursor-pointer"
                />
                <span className="text-base text-gray-400 font-bold">A</span>
              </div>
            </SettingRow>
          </SettingSection>

          {/* ── Search Engine ── */}
          <SettingSection title="Search Engine" icon={<Search className="w-4 h-4" />}>
            {SEARCH_ENGINES.map((engine) => (
              <button
                key={engine.id}
                onClick={() => onUpdateSettings({ searchEngine: engine.id })}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#333] flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                    {engine.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{engine.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{engine.url}...</p>
                  </div>
                </div>
                {settings.searchEngine === engine.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </SettingSection>

          {/* ── Privacy & Security ── */}
          <SettingSection title="Privacy & Security" icon={<Shield className="w-4 h-4" />}>
            <SettingRow label="Block Ads & Trackers" description="Built-in Brave-style ad blocking engine">
              <Toggle
                enabled={settings.blockAds}
                onChange={(v) => onUpdateSettings({ blockAds: v })}
              />
            </SettingRow>

            <SettingRow label="Block Pop-ups" description="Prevent websites from opening pop-up windows">
              <Toggle
                enabled={settings.blockPopups}
                onChange={(v) => onUpdateSettings({ blockPopups: v })}
              />
            </SettingRow>

            <SettingRow label="Send Do Not Track" description="Request sites not to track your browsing">
              <Toggle
                enabled={settings.doNotTrack}
                onChange={(v) => onUpdateSettings({ doNotTrack: v })}
              />
            </SettingRow>

            <SettingRow label="Clear Data on Exit" description="Automatically clear history and cookies when you close Nova">
              <Toggle
                enabled={settings.clearOnExit}
                onChange={(v) => onUpdateSettings({ clearOnExit: v })}
              />
            </SettingRow>

            <div className="px-4 py-3.5">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                  bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20
                  border border-red-100 dark:border-red-900/30
                  transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Clear Browsing Data</p>
                    <p className="text-[10px] text-red-400 dark:text-red-500">
                      {historyCount} history entries • {bookmarkCount} bookmarks
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </SettingSection>

          {/* ── About ── */}
          <SettingSection title="About" icon={<Info className="w-4 h-4" />}>
            <SettingRow label="Nova Browser" description="AI-native browser built with Chromium and Electron">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-[#333] px-2 py-1 rounded-md">
                v0.1.0
              </span>
            </SettingRow>
            <SettingRow label="Rendering Engine" description="Powered by Chromium via Electron">
              <span className="text-xs text-gray-400 dark:text-gray-500">Chromium</span>
            </SettingRow>
            <SettingRow label="Architecture" description="Local-first, privacy-focused, no cloud accounts">
              <span className="text-xs text-green-500">✓ Local</span>
            </SettingRow>
          </SettingSection>

        </div>
      </div>

      {/* Clear data confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-2xl p-6 w-80 border border-gray-200 dark:border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Clear all browsing data?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">History and bookmarks will be deleted.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#444] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onClearBrowsingData(); setShowClearConfirm(false); }}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { SEARCH_ENGINES };
