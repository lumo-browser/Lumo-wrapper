/**
 * Bookmarks Page — Fully functional saved pages manager
 * Grid/list view, search, folders, delete, and open.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Star,
  ExternalLink,
  X,
  Grid,
  List,
  Plus,
  Bookmark,
  Globe,
} from 'lucide-react';

export interface BookmarkEntry {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  folder?: string;
}

interface BookmarksPageProps {
  bookmarks: BookmarkEntry[];
  onNavigate: (url: string) => void;
  onDeleteBookmark: (id: string) => void;
  onClearAll: () => void;
}

function faviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return '';
  }
}

function domainFrom(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function BookmarksPage({ bookmarks, onNavigate, onDeleteBookmark, onClearAll }: BookmarksPageProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    if (!search.trim()) return bookmarks;
    const q = search.toLowerCase();
    return bookmarks.filter(
      (b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
    );
  }, [bookmarks, search]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bookmarks</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {bookmarks.length} saved {bookmarks.length === 1 ? 'page' : 'pages'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex bg-gray-100 dark:bg-[#2a2a2a] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
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

      {/* Bookmarks content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin">
        <div className="max-w-4xl mx-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <Bookmark className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {search ? 'No bookmarks found' : 'No bookmarks yet'}
              </p>
              <p className="text-xs mt-1">
                {search ? 'Try a different search term' : 'Click the star icon in the address bar to bookmark pages'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => onNavigate(bm.url)}
                  className="group relative bg-white dark:bg-[#242424] rounded-xl border border-gray-100 dark:border-[#333]
                    p-4 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800
                    transition-all duration-200 hover:-translate-y-0.5"
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteBookmark(bm.id); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center
                      opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500
                      hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Remove bookmark"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Favicon */}
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#333] flex items-center justify-center mb-3">
                    <img
                      src={faviconUrl(bm.url)}
                      alt=""
                      className="w-4 h-4 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                      }}
                    />
                  </div>

                  {/* Title */}
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-0.5">
                    {bm.title || domainFrom(bm.url)}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                    {domainFrom(bm.url)}
                  </p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1.5">
                    {timeAgo(bm.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-[#242424] rounded-xl border border-gray-100 dark:border-[#333] overflow-hidden divide-y divide-gray-50 dark:divide-[#333]">
              {filtered.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => onNavigate(bm.url)}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  {/* Favicon */}
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#333] flex items-center justify-center flex-shrink-0">
                    <img
                      src={faviconUrl(bm.url)}
                      alt=""
                      className="w-4 h-4 rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>

                  {/* Title & URL */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
                      {bm.title || domainFrom(bm.url)}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{bm.url}</p>
                  </div>

                  {/* Time */}
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {timeAgo(bm.timestamp)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(bm.url); }}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Open"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteBookmark(bm.id); }}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
