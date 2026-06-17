/**
 * TabGroupModal — AI Smart Tab Grouping UI
 *
 * Displays AI-generated tab group suggestions with color-coded labels.
 * The user can apply the grouping or cancel.
 */

import React from 'react';
import { X, Layers, Zap, Check } from 'lucide-react';
import type { BrowserTab } from './BrowserTabBar';

export interface TabGroup {
  id: string;
  name: string;
  color: string;         // Tailwind bg class
  colorHex: string;      // For inline style use
  tabIds: string[];
}

interface TabGroupModalProps {
  tabs: BrowserTab[];
  groups: TabGroup[];
  isLoading: boolean;
  error: string | null;
  onApply: (groups: TabGroup[]) => void;
  onClose: () => void;
}

/** Mapping of color name to Tailwind + Hex pairs */
export const GROUP_COLOR_PALETTE: { name: string; bg: string; hex: string; text: string }[] = [
  { name: 'violet', bg: 'bg-violet-500', hex: '#8b5cf6', text: 'text-violet-100' },
  { name: 'blue',   bg: 'bg-blue-500',   hex: '#3b82f6', text: 'text-blue-100'   },
  { name: 'emerald',bg: 'bg-emerald-500',hex: '#10b981', text: 'text-emerald-100' },
  { name: 'amber',  bg: 'bg-amber-500',  hex: '#f59e0b', text: 'text-amber-100'  },
  { name: 'rose',   bg: 'bg-rose-500',   hex: '#f43f5e', text: 'text-rose-100'   },
  { name: 'cyan',   bg: 'bg-cyan-500',   hex: '#06b6d4', text: 'text-cyan-100'   },
  { name: 'orange', bg: 'bg-orange-500', hex: '#f97316', text: 'text-orange-100' },
  { name: 'pink',   bg: 'bg-pink-500',   hex: '#ec4899', text: 'text-pink-100'   },
];

export function TabGroupModal({
  tabs,
  groups,
  isLoading,
  error,
  onApply,
  onClose,
}: TabGroupModalProps): React.ReactElement {
  const tabMap = Object.fromEntries(tabs.map(t => [t.id, t]));

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="AI Tab Grouping"
    >
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#1e1e2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a3a] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#2a2a3a]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Tab Grouping</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isLoading ? 'Analyzing your tabs...' : `${groups.length} group${groups.length !== 1 ? 's' : ''} found across ${tabs.length} tab${tabs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a3a] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-violet-200 dark:border-violet-900" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
                <Zap className="absolute inset-0 m-auto w-5 h-5 text-violet-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Asking AI to analyze {tabs.length} tabs...
              </p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
              <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Grouping failed</p>
              <p className="text-xs text-rose-500 dark:text-rose-500 mt-1">{error}</p>
            </div>
          )}

          {/* Groups */}
          {!isLoading && !error && groups.map((group) => {
            const palette = GROUP_COLOR_PALETTE.find(c => c.hex === group.colorHex) ?? GROUP_COLOR_PALETTE[0];
            return (
              <div
                key={group.id}
                className="rounded-xl border border-gray-100 dark:border-[#2a2a3a] overflow-hidden"
              >
                {/* Group header */}
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ backgroundColor: group.colorHex + '22' }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.colorHex }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: group.colorHex }}
                  >
                    {group.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                    {group.tabIds.length} tab{group.tabIds.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tab list */}
                <div className="divide-y divide-gray-50 dark:divide-[#2a2a3a]">
                  {group.tabIds.map(tabId => {
                    const tab = tabMap[tabId];
                    if (!tab) return null;
                    return (
                      <div key={tabId} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#16161e]">
                        {tab.favicon ? (
                          <img src={tab.favicon} alt="" className="w-3.5 h-3.5 rounded-sm flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-sm bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        )}
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                          {tab.title || tab.url || 'New Tab'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {!isLoading && !error && groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Not enough tabs to group.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Open more tabs first and try again.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && groups.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 dark:border-[#2a2a3a] bg-gray-50 dark:bg-[#16161e]">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg border border-gray-200 dark:border-[#2a2a3a] hover:bg-gray-100 dark:hover:bg-[#2a2a3a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onApply(groups)}
              id="apply-tab-groups-btn"
              className="flex-1 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Check className="w-4 h-4" />
              Apply Groups
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
