/**
 * Settings Page — Fully functional browser settings
 * Appearance, Search Engine, Privacy, Downloads, and About.
 */

import React, { useState, useEffect } from 'react';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { HomeSettingsTab } from './HomeSettingsTab';
import { SearchSettingsTab } from './SearchSettingsTab';
import { PrivacySettingsTab } from './PrivacySettingsTab';
import { DownloadSettingsTab } from './DownloadSettingsTab';
import { SystemSettingsTab } from './SystemSettingsTab';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import { LanguageSettingsTab } from './LanguageSettingsTab';
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
  Cpu,
  Home,
  RefreshCw,
  Settings,
  User,
  Download as DownloadIcon,
  Cpu as CpuIcon,
  Languages,
} from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'brave' | 'yahoo';

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface BrowserSettings {
  theme: ThemeMode;
  searchEngine: SearchEngine;
  fontSize: number; // 12–20
  openRouterApiKey: string;
  blockAds: boolean;
  blockPopups: boolean;
  doNotTrack: boolean;
  clearOnExit: boolean;
  // Profiles
  profiles: UserProfile[];
  currentProfileId: string;
  // Downloads
  downloadLocation: string;
  askBeforeDownloading: boolean;
  // System
  hardwareAcceleration: boolean;
  memorySaver: boolean;
  // Appearance
  showBookmarksBar: boolean;
  showHomeButton: boolean;
  defaultZoom: number;
  // Startup
  startupBehavior: 'new-tab' | 'continue' | 'specific-pages';
  startupPages: string[];
  // Languages
  spellCheck: boolean;
  uiLanguage: string;
  offerTranslate: boolean;
  // Permissions
  permissions: {
    camera: boolean;
    microphone: boolean;
    location: boolean;
    notifications: boolean;
  };
}

interface SettingsPageProps {
  settings: BrowserSettings;
  activeProfileId: string;
  onUpdateSettings: (updates: Partial<BrowserSettings>) => void;
  onClearBrowsingData: () => void;
  historyCount: number;
  bookmarkCount: number;
}

const SEARCH_ENGINES: { id: SearchEngine; name: string; url: string; icon: string }[] = [
  { id: 'google',      name: 'Google',      url: 'https://www.google.com/search?q=',          icon: 'G' },
  { id: 'bing',        name: 'Bing',        url: 'https://www.bing.com/search?q=',            icon: 'B' },
  { id: 'duckduckgo',  name: 'DuckDuckGo',  url: 'https://duckduckgo.com/?q=',                icon: 'D' },
  { id: 'brave',       name: 'Brave Search', url: 'https://search.brave.com/search?q=',       icon: '' },
  { id: 'yahoo',       name: 'Yahoo',       url: 'https://search.yahoo.com/search?p=',        icon: 'Y' },
];

const THEME_OPTIONS: { id: ThemeMode; name: string; icon: React.ReactNode }[] = [
  { id: 'light',  name: 'Light',  icon: <Sun className="w-4 h-4" /> },
  { id: 'dark',   name: 'Dark',   icon: <Moon className="w-4 h-4" /> },
  { id: 'system', name: 'System', icon: <Monitor className="w-4 h-4" /> },
];

export function SettingSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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

export function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
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

export function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
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


export function SidebarButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      {label}
    </button>
  );
}

export function SettingsPage({
  settings,
  activeProfileId,
  onUpdateSettings,
  onClearBrowsingData,
  historyCount,
  bookmarkCount,
}: SettingsPageProps): React.ReactElement {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [localFontSize, setLocalFontSize] = useState(settings.fontSize);
  const [activeTab, setActiveTab] = useState<'profiles' | 'general' | 'home' | 'search' | 'privacy' | 'downloads' | 'system' | 'languages' | 'sync' | 'about'>('general');

  useEffect(() => {
    setLocalFontSize(settings.fontSize);
  }, [settings.fontSize]);


  return (
    <div className="flex-1 flex h-full bg-[#f8f9fa] dark:bg-[#1a1a1a] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-[#242424] border-r border-gray-200 dark:border-[#333] flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <nav className="flex flex-col gap-1">
            <SidebarButton icon={<User />} label="Profiles & Users" active={activeTab === 'profiles'} onClick={() => setActiveTab('profiles')} />
            <SidebarButton icon={<Settings />} label="General" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
            <SidebarButton icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <SidebarButton icon={<Search />} label="Search Engine" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
            <SidebarButton icon={<Shield />} label="Privacy & Security" active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} />
            <SidebarButton icon={<DownloadIcon />} label="Downloads" active={activeTab === 'downloads'} onClick={() => setActiveTab('downloads')} />
            <SidebarButton icon={<CpuIcon />} label="System & Performance" active={activeTab === 'system'} onClick={() => setActiveTab('system')} />
            <SidebarButton icon={<Languages />} label="Languages" active={activeTab === 'languages'} onClick={() => setActiveTab('languages')} />
            <SidebarButton icon={<RefreshCw />} label="Sync" active={activeTab === 'sync'} onClick={() => setActiveTab('sync')} />
            <SidebarButton icon={<Info />} label="About Lumo" active={activeTab === 'about'} onClick={() => setActiveTab('about')} />
          </nav>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto px-10 py-8 scrollbar-thin">
        <div className="max-w-2xl">

          {activeTab === 'profiles' && (
            <ProfileSettingsTab settings={settings} activeProfileId={activeProfileId} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'home' && (
            <HomeSettingsTab />
          )}

          {activeTab === 'general' && (
            <GeneralSettingsTab settings={settings} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'search' && (
            <SearchSettingsTab settings={settings} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'privacy' && (
            <PrivacySettingsTab
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              historyCount={historyCount}
              bookmarkCount={bookmarkCount}
              onClearBrowsingData={onClearBrowsingData}
            />
          )}

          {activeTab === 'downloads' && (
            <DownloadSettingsTab settings={settings} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'system' && (
            <SystemSettingsTab settings={settings} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'languages' && (
            <LanguageSettingsTab settings={settings} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'sync' && (
            <SettingSection title="Sync" icon={<RefreshCw className="w-4 h-4" />}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#333] flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Sync is currently unavailable</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Lumo Browser is a local-first browser. Cloud sync features for bookmarks, history, and settings are coming in a future update!
                </p>
              </div>
            </SettingSection>
          )}

          {activeTab === 'about' && (
            <SettingSection title="About" icon={<Info className="w-4 h-4" />}>
              <SettingRow label="Lumo Browser" description="AI-native browser built with Chromium and Electron">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-[#333] px-2 py-1 rounded-md">
                  v0.1.0
                </span>
              </SettingRow>
              <SettingRow label="Rendering Engine" description="Powered by Chromium via Electron">
                <span className="text-xs text-gray-400 dark:text-gray-500">Chromium</span>
              </SettingRow>
              <SettingRow label="Architecture" description="Local-first, privacy-focused, no cloud accounts">
                <span className="text-xs text-green-500"> Local</span>
              </SettingRow>
            </SettingSection>
          )}

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
