/**
 * History Page — Fully functional browsing history
 * Groups entries by date, supports search, delete, and clear all.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Clock,
  ExternalLink,
  X,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  timestamp: number; // Date.now()
}

interface HistoryPageProps {
  entries: HistoryEntry[];
  onNavigate: (url: string) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

function formatTime(ts: number): string {
  if (!ts) return 'Unknown Time';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return 'Unknown Time';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  if (!ts) return 'Unknown Date';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return 'Unknown Date';
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  try {
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return d.toDateString();
  }
}

function groupByDate(entries: HistoryEntry[]): Record<string, HistoryEntry[]> {
  const groups: Record<string, HistoryEntry[]> = {};
  if (!entries || !Array.isArray(entries)) return groups;
  for (const entry of entries) {
    if (!entry) continue;
    const key = entry.timestamp ? new Date(entry.timestamp).toDateString() : 'Unknown Date';
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

function faviconUrl(url: string): string {
  try {
    if (!url) return '';
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return '';
  }
}

export function HistoryPage({ entries, onNavigate, onDeleteEntry, onClearAll }: HistoryPageProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = useMemo(() => {
    if (!entries || !Array.isArray(entries)) return [];
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = entries.filter(
        (e) => (e?.title || '').toLowerCase().includes(q) || (e?.url || '').toLowerCase().includes(q)
      );
    }
    // Performance fix: Limit the DOM to 100 items at a time to prevent React from freezing 
    // the renderer when thousands of history items are imported from Firefox/Chrome.
    return result.slice(0, 100);
  }, [entries, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const dateKeys = Object.keys(grouped).sort((a, b) => {
    const timeA = new Date(a).getTime();
    const timeB = new Date(b).getTime();
    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;
    return timeB - timeA;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">History</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {entries?.length || 0} {(entries?.length || 0) === 1 ? 'page' : 'pages'} visited
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={entries.length === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg
                bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
                hover:bg-red-100 dark:hover:bg-red-900/40
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl
                bg-white dark:bg-[#2a2a2a]
                border border-gray-200 dark:border-[#3a3a3a]
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin">
        <div className="max-w-3xl mx-auto">
          {dateKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <Clock className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {search ? 'No results found' : 'No browsing history yet'}
              </p>
              <p className="text-xs mt-1">
                {search ? 'Try a different search term' : 'Pages you visit will appear here'}
              </p>
            </div>
          ) : (
            dateKeys.map((dateKey) => (
              <div key={dateKey} className="mb-6">
                {/* Date header */}
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#f8f9fa] dark:bg-[#1a1a1a] py-1 z-10">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {formatDate(grouped[dateKey][0].timestamp)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    ({grouped[dateKey].length})
                  </span>
                </div>

                {/* Entries */}
                <div className="bg-white dark:bg-[#242424] rounded-xl border border-gray-100 dark:border-[#333] overflow-hidden divide-y divide-gray-50 dark:divide-[#333]">
                  {grouped[dateKey].map((entry, idx) => (
                    <div
                      key={entry?.id || `fallback-key-${idx}`}
                      className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                      onClick={() => entry?.url && onNavigate(entry.url)}
                    >
                      {/* Favicon */}
                      <img
                        src={faviconUrl(entry.url)}
                        alt=""
                        className="w-4 h-4 rounded flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />

                      {/* Time */}
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-12 flex-shrink-0 font-mono">
                        {formatTime(entry.timestamp)}
                      </span>

                      {/* Title & URL */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
                          {entry.title || entry.url}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          {entry.url}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); entry?.url && onNavigate(entry.url); }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Open"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteEntry(entry.id); }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clear all confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-2xl p-6 w-80 border border-gray-200 dark:border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Clear all history?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone.</p>
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
                onClick={() => { onClearAll(); setShowClearConfirm(false); }}
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
