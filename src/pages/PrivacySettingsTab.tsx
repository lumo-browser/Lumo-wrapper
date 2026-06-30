/**
 * PrivacySettingsTab — Comprehensive Privacy & Security settings panel.
 * Mirrors Firefox/Brave-style privacy settings:
 * Tracking Protection, Cookies, Passwords, History, Permissions, Security, DNS, Data Collection
 */

import React, { useState } from 'react';
import {
  Shield, Cookie, Lock, Clock, Bell,
  Trash2, ChevronRight, AlertTriangle, Wifi,
  Database, Check,
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

type PermissionState = 'ask' | 'allow' | 'block';

function PermissionSelect({ value, onChange }: { value: PermissionState; onChange: (v: PermissionState) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as PermissionState)}
      className="text-xs rounded-md px-2 py-1.5 bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
    >
      <option value="ask">Ask every time</option>
      <option value="allow">Allow</option>
      <option value="block">Block</option>
    </select>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
  historyCount: number;
  bookmarkCount: number;
  onClearBrowsingData: () => void;
}

export function PrivacySettingsTab({ settings, onUpdateSettings, historyCount, bookmarkCount, onClearBrowsingData }: Props) {
  // Confirm modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const trackingOptions = [
    { id: 'standard' as const, label: 'Standard', desc: 'Balanced for protection and performance. Pages load normally.' },
    { id: 'strict'   as const, label: 'Strict',   desc: 'Stronger protection, but may cause some sites or content to break.' },
    { id: 'custom'   as const, label: 'Custom',   desc: 'Choose which trackers and scripts to block.' },
  ];

  return (
    <div>

      {/* ── Enhanced Tracking Protection ── */}
      <Section title="Enhanced Tracking Protection" icon={<Shield className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-2 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Trackers follow you around online to collect information about your browsing habits. Lumo blocks many of these trackers and other malicious scripts.
        </p>

        {/* Level cards */}
        <div className="px-4 py-3 grid grid-cols-3 gap-2">
          {trackingOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => onUpdateSettings({ trackingLevel: opt.id })}
              className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all ${
                settings.trackingLevel === opt.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-100 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${settings.trackingLevel === opt.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</span>
                {settings.trackingLevel === opt.id && <Check className="w-3 h-3 text-blue-500" />}
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* What's blocked info */}
        <div className="px-4 pb-3">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Lumo blocks the following:</p>
          <div className="flex flex-wrap gap-2">
            {['Social media trackers','Cross-site cookies','Tracking in Private Windows','Cryptominers','Fingerprinters'].map(item => (
              <span key={item} className="text-[10px] px-2 py-1 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-full border border-green-100 dark:border-green-900/20">
                 {item}
              </span>
            ))}
          </div>
        </div>

        {settings.trackingLevel === 'custom' && (
          <>
            <Row label="Block Social Media Trackers"><Toggle enabled={settings.blockSocialTrackers} onChange={v => onUpdateSettings({ blockSocialTrackers: v })} /></Row>
            <Row label="Block Cryptominers"><Toggle enabled={settings.blockCryptominers} onChange={v => onUpdateSettings({ blockCryptominers: v })} /></Row>
            <Row label="Block Fingerprinters"><Toggle enabled={settings.blockFingerprinters} onChange={v => onUpdateSettings({ blockFingerprinters: v })} /></Row>
          </>
        )}

        <Row label="Total Cookie Protection" description="Contains cookies to the site you're on, so trackers can't use them to follow you between sites.">
          <Toggle enabled={settings.totalCookieProtection} onChange={v => onUpdateSettings({ totalCookieProtection: v })} />
        </Row>
      </Section>

      {/* ── Built-in Blocking ── */}
      <Section title="Built-in Blocking" icon={<Shield className="w-4 h-4" />}>
        <Row label="Block Ads & Trackers" description="Built-in ad blocking engine">
          <Toggle enabled={settings.blockAds} onChange={v => onUpdateSettings({ blockAds: v })} />
        </Row>
        <Row label="Block Pop-up Windows" description="Prevent websites from opening pop-up windows">
          <Toggle enabled={settings.blockPopups} onChange={v => onUpdateSettings({ blockPopups: v })} />
        </Row>
        <Row label="Send Do Not Track" description="Request sites not to track your browsing activity">
          <Toggle enabled={settings.doNotTrack} onChange={v => onUpdateSettings({ doNotTrack: v })} />
        </Row>
        <Row label="Tell websites not to sell or share my data" description="Sends a GPC (Global Privacy Control) signal to websites">
          <Toggle enabled={settings.doNotSell} onChange={v => onUpdateSettings({ doNotSell: v })} />
        </Row>
      </Section>

      {/* ── Cookies & Site Data ── */}
      <Section title="Cookies & Site Data" icon={<Cookie className="w-4 h-4" />}>
        <Row label="Delete cookies and site data when Lumo is closed">
          <Toggle enabled={settings.clearOnExit} onChange={v => onUpdateSettings({ clearOnExit: v })} />
        </Row>
        <div className="px-4 py-3.5">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-red-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Clear Browsing Data</p>
                <p className="text-[10px] text-red-400 dark:text-red-500">{historyCount} history entries • {bookmarkCount} bookmarks</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </Section>

      {/* ── Passwords ── */}
      <Section title="Passwords" icon={<Lock className="w-4 h-4" />}>
        <Row label="Ask to save passwords"><Toggle enabled={settings.askSavePasswords} onChange={v => onUpdateSettings({ askSavePasswords: v })} /></Row>
        <Row label="Fill usernames and passwords automatically"><Toggle enabled={settings.autofillPasswords} onChange={v => onUpdateSettings({ autofillPasswords: v })} /></Row>
        <Row label="Suggest strong passwords"><Toggle enabled={settings.suggestStrongPasswords} onChange={v => onUpdateSettings({ suggestStrongPasswords: v })} /></Row>
        <Row label="Show alerts about passwords for breached websites" description="Notifies you if your saved passwords appear in known data breaches">
          <Toggle enabled={settings.breachAlerts} onChange={v => onUpdateSettings({ breachAlerts: v })} />
        </Row>
        <Row label="Use a Primary Password" description="Require a password before Lumo fills in saved credentials">
          <Toggle enabled={settings.primaryPassword} onChange={v => onUpdateSettings({ primaryPassword: v })} />
        </Row>
      </Section>

      {/* ── History ── */}
      <Section title="History" icon={<Clock className="w-4 h-4" />}>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Lumo will:</p>
          {([
            ['remember', 'Remember browsing, download, form, and search history'],
            ['never',    'Never remember history'],
            ['custom',   'Use custom settings for history'],
          ] as const).map(([val, lbl]) => (
            <label key={val} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${settings.historyMode === val ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                {settings.historyMode === val && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </span>
              <input type="radio" className="hidden" checked={settings.historyMode === val} onChange={() => onUpdateSettings({ historyMode: val })} />
              <span className="text-sm text-gray-800 dark:text-gray-200">{lbl}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* ── Permissions ── */}
      <Section title="Permissions" icon={<Bell className="w-4 h-4" />}>
        <Row label="Location" description="Access to your physical location">
          <Toggle enabled={settings.permissions.location} onChange={v => onUpdateSettings({ permissions: { ...settings.permissions, location: v } })} />
        </Row>
        <Row label="Camera" description="Access to your camera">
          <Toggle enabled={settings.permissions.camera} onChange={v => onUpdateSettings({ permissions: { ...settings.permissions, camera: v } })} />
        </Row>
        <Row label="Microphone" description="Access to your microphone">
          <Toggle enabled={settings.permissions.microphone} onChange={v => onUpdateSettings({ permissions: { ...settings.permissions, microphone: v } })} />
        </Row>
        <Row label="Notifications" description="Permission to send desktop notifications">
          <Toggle enabled={settings.permissions.notifications} onChange={v => onUpdateSettings({ permissions: { ...settings.permissions, notifications: v } })} />
        </Row>
        <Row label="Autoplay" description="Automatically play video and audio"><PermissionSelect value={settings.autoplayPerm} onChange={v => onUpdateSettings({ autoplayPerm: v })} /></Row>
      </Section>

      {/* ── Security ── */}
      <Section title="Security" icon={<AlertTriangle className="w-4 h-4" />}>
        <Row label="Block dangerous and deceptive content" description="Protects against phishing and malware sites">
          <Toggle enabled={settings.blockDangerous} onChange={v => onUpdateSettings({ blockDangerous: v })} />
        </Row>
        <Row label="Block dangerous downloads" description="Prevents downloading known malware files">
          <Toggle enabled={settings.blockDangerousDownloads} onChange={v => onUpdateSettings({ blockDangerousDownloads: v })} />
        </Row>
        <Row label="Warn about unwanted and uncommon software">
          <Toggle enabled={settings.warnUnwanted} onChange={v => onUpdateSettings({ warnUnwanted: v })} />
        </Row>
        <Row label="HTTPS-Only Mode" description="Only allows secure connections. Lumo will ask before connecting insecurely.">
          <Toggle enabled={settings.httpsOnly} onChange={v => onUpdateSettings({ httpsOnly: v })} />
        </Row>
      </Section>

      {/* ── DNS over HTTPS ── */}
      <Section title="DNS over HTTPS" icon={<Wifi className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Sends your DNS requests through an encrypted connection, making it harder for others to see which websites you access.
        </p>
        <div className="px-4 py-3">
          {([
            ['off',       'Off',                'Use your default system DNS resolver'],
            ['default',   'Default Protection',  'Lumo decides when to use secure DNS to protect your privacy'],
            ['increased', 'Increased Protection','You control when to use secure DNS and choose your provider'],
            ['max',       'Max Protection',      'Lumo will always use secure DNS'],
          ] as const).map(([val, lbl, desc]) => (
            <label key={val} className="flex items-start gap-2.5 py-2 cursor-pointer">
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${settings.dnsMode === val ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                {settings.dnsMode === val && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </span>
              <input type="radio" className="hidden" checked={settings.dnsMode === val} onChange={() => onUpdateSettings({ dnsMode: val })} />
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{lbl}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
        {settings.dnsMode !== 'off' && settings.dnsMode !== 'default' && (
          <Row label="DNS Provider">
            <select
              value={settings.dnsProvider}
              onChange={e => onUpdateSettings({ dnsProvider: e.target.value })}
              className="text-xs rounded-md px-2 py-1.5 bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
            >
              {['Cloudflare','Cloudflare (Malware)','Google','NextDNS','Custom'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Row>
        )}
      </Section>

      {/* ── Data Collection ── */}
      <Section title="Data Collection and Use" icon={<Database className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-500">
          We collect only the minimal data necessary to improve Lumo for everyone.
        </p>
        <Row label="Send technical and interaction data" description="Helps improve Lumo features, performance, and stability">
          <Toggle enabled={settings.sendTelemetry} onChange={v => onUpdateSettings({ sendTelemetry: v })} />
        </Row>
        <Row label="Automatically send crash reports" description="Helps diagnose and fix issues. Reports may include personal data.">
          <Toggle enabled={settings.sendCrashReports} onChange={v => onUpdateSettings({ sendCrashReports: v })} />
        </Row>
        <Row label="Allow privacy-preserving ad measurement" description="Helps sites understand ad performance without collecting data about you">
          <Toggle enabled={settings.adMeasurement} onChange={v => onUpdateSettings({ adMeasurement: v })} />
        </Row>
      </Section>

      {/* ── Clear data confirmation modal ── */}
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
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={() => { onClearBrowsingData(); setShowClearConfirm(false); }}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
