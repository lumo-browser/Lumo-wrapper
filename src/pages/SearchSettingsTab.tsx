/**
 * SearchSettingsTab — Comprehensive search configuration panel
 * Mirrors Firefox/Chrome-style search settings:
 * Default Engine, Search Suggestions, Address Bar, Search Shortcuts
 */

import React, { useState } from 'react';
import { Check, Search, ExternalLink, Plus, Trash2, TrendingUp, BookOpen, Clock, Globe, Zap, ChevronRight } from 'lucide-react';
import { BrowserSettings, SearchEngine, SEARCH_ENGINES } from './SettingsPage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchShortcut {
  id: string;
  name: string;
  keyword: string;
  url: string;
  icon: string;
}

const DEFAULT_SHORTCUTS: SearchShortcut[] = [
  { id: 'sh1', name: 'Google',     keyword: '@g',  url: 'https://www.google.com/search?q=%s',       icon: 'G' },
  { id: 'sh2', name: 'DuckDuckGo', keyword: '@d',  url: 'https://duckduckgo.com/?q=%s',              icon: 'D' },
  { id: 'sh3', name: 'Wikipedia',  keyword: '@w',  url: 'https://en.wikipedia.org/wiki/Special:Search?search=%s', icon: 'W' },
  { id: 'sh4', name: 'YouTube',    keyword: '@yt', url: 'https://www.youtube.com/results?search_query=%s', icon: '' },
  { id: 'sh5', name: 'GitHub',     keyword: '@gh', url: 'https://github.com/search?q=%s',           icon: '⌥' },
];

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

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
      <button
        onClick={() => onChange(!checked)}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333]'
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5 text-white" />}
      </button>
      <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>
    </label>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}

export function SearchSettingsTab({ settings, onUpdateSettings }: Props) {
  // Search suggestions state
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionsAheadOfHistory, setSuggestionsAheadOfHistory] = useState(false);
  const [suggestionsInPrivate, setSuggestionsInPrivate] = useState(false);
  const [showTrending, setShowTrending] = useState(true);
  const [showRecentSearches, setShowRecentSearches] = useState(true);
  const [showTermsInBar, setShowTermsInBar] = useState(true);

  // Address bar suggestions
  const [suggestHistory, setSuggestHistory] = useState(true);
  const [suggestBookmarks, setSuggestBookmarks] = useState(true);
  const [suggestOpenTabs, setSuggestOpenTabs] = useState(true);
  const [suggestShortcuts, setSuggestShortcuts] = useState(true);
  const [suggestEngines, setSuggestEngines] = useState(true);
  const [suggestQuickActions, setSuggestQuickActions] = useState(true);

  // Shortcuts management
  const [shortcuts, setShortcuts] = useState<SearchShortcut[]>(DEFAULT_SHORTCUTS);
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newKeyword.trim() || !newUrl.trim()) return;
    const kw = newKeyword.trim().startsWith('@') ? newKeyword.trim() : `@${newKeyword.trim()}`;
    setShortcuts(prev => [...prev, {
      id: `sh-${Date.now()}`,
      name: newName.trim(),
      keyword: kw,
      url: newUrl.trim(),
      icon: newName.trim()[0].toUpperCase(),
    }]);
    setNewName(''); setNewKeyword(''); setNewUrl(''); setShowAddShortcut(false);
  };

  return (
    <div>

      {/* ── Default Search Engine ── */}
      <Section title="Default Search Engine" icon={<Search className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-500">
          This is your default search engine in the address bar and search bar. You can switch it at any time.
        </p>
        {SEARCH_ENGINES.map((engine) => (
          <button
            key={engine.id}
            onClick={() => onUpdateSettings({ searchEngine: engine.id as SearchEngine })}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#333] flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#3a3a3a]">
                {engine.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{engine.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[260px]">{engine.url}...</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              settings.searchEngine === engine.id ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {settings.searchEngine === engine.id && <Check className="w-3 h-3 text-white" />}
            </div>
          </button>
        ))}
        <Row label="Show search terms in the address bar on results pages" description="Keep your query visible in the address bar after searching">
          <Toggle enabled={showTermsInBar} onChange={setShowTermsInBar} />
        </Row>
      </Section>

      {/* ── Search Suggestions ── */}
      <Section title="Search Suggestions" icon={<TrendingUp className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-500">
          Choose how suggestions from search engines appear.
        </p>
        <Checkbox checked={showSuggestions} onChange={setShowSuggestions} label="Show search suggestions" />
        <Checkbox
          checked={suggestionsAheadOfHistory}
          onChange={setSuggestionsAheadOfHistory}
          label="Show search suggestions ahead of browsing history in address bar results"
        />
        <Checkbox
          checked={suggestionsInPrivate}
          onChange={setSuggestionsInPrivate}
          label="Show search suggestions in Private Windows"
        />
        <Checkbox checked={showTrending} onChange={setShowTrending} label="Show trending search suggestions" />
        <Checkbox checked={showRecentSearches} onChange={setShowRecentSearches} label="Show recent searches" />
      </Section>

      {/* ── Address Bar ── */}
      <Section title="Address Bar" icon={<Globe className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-500">
          When using the address bar, suggest:
        </p>
        <Checkbox checked={suggestHistory}      onChange={setSuggestHistory}      label="Browsing history" />
        <Checkbox checked={suggestBookmarks}    onChange={setSuggestBookmarks}    label="Bookmarks" />
        <Checkbox checked={suggestOpenTabs}     onChange={setSuggestOpenTabs}     label="Open tabs" />
        <Checkbox checked={suggestShortcuts}    onChange={setSuggestShortcuts}    label="Shortcuts" />
        <Checkbox checked={suggestEngines}      onChange={setSuggestEngines}      label="Search engines" />
        <Checkbox checked={suggestQuickActions} onChange={setSuggestQuickActions} label="Quick actions" />
      </Section>

      {/* ── Search Shortcuts ── */}
      <Section title="Search Shortcuts" icon={<Zap className="w-4 h-4" />}>
        <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-500">
          Type a keyword in the address bar to search with a specific engine. Use <code className="bg-gray-100 dark:bg-[#333] px-1 rounded text-[10px]">%s</code> as the search term placeholder in the URL.
        </p>
        {/* Shortcut rows */}
        {shortcuts.map(s => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] group transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#333] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#3a3a3a]">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[220px]">{s.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/30">
                {s.keyword}
              </span>
              <button
                onClick={() => setShortcuts(prev => prev.filter(x => x.id !== s.id))}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add shortcut form */}
        {showAddShortcut ? (
          <form onSubmit={addShortcut} className="px-4 py-4 bg-gray-50 dark:bg-[#1e1e1e]">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Add Search Shortcut</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name (e.g. Wikipedia)"
                className="px-3 py-1.5 text-xs rounded-md bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Keyword (e.g. @wiki)"
                className="px-3 py-1.5 text-xs rounded-md bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="Search URL with %s placeholder (e.g. https://site.com/search?q=%s)"
              className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 mb-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddShortcut(false)}
                className="flex-1 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors"
              >Cancel</button>
              <button
                type="submit"
                disabled={!newName.trim() || !newKeyword.trim() || !newUrl.trim()}
                className="flex-1 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >Add Shortcut</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddShortcut(true)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add search engine
          </button>
        )}
      </Section>

    </div>
  );
}
