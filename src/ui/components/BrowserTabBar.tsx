/**
 * BrowserTabBar — Supports both horizontal (top) and vertical (left sidebar) layouts
 */

import React from 'react';
import { X, Plus, Globe, Minus, Square } from 'lucide-react';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  isIncognito?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  groupId?: string;
  groupColor?: string;   // hex color, e.g. '#8b5cf6'
  groupName?: string;
}

interface BrowserTabBarProps {
  tabs: BrowserTab[];
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabAdd: () => void;
  vertical?: boolean;
}

export function BrowserTabBar({
  tabs,
  onTabSelect,
  onTabClose,
  onTabAdd,
  vertical = false,
}: BrowserTabBarProps): React.ReactElement {

  // ── Vertical layout ────────────────────────────────────────────────────────
  if (vertical) {
    return (
      <div className="flex flex-col w-52 h-full bg-[#f0f2f5] dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#2a2a2a] overflow-y-auto overflow-x-hidden select-none flex-shrink-0 scrollbar-thin">
        {/* Tab list */}
        <div className="flex flex-col gap-0.5 p-2 flex-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              role="tab"
              aria-selected={tab.isActive}
              className={`
                group relative flex items-center gap-2 h-9 px-2.5 rounded-lg cursor-pointer select-none transition-colors duration-100
                ${tab.isActive
                  ? 'bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-[#2a2a2a]'
                }
              `}
            >
              {/* Group color indicator */}
              {tab.groupColor && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full flex-shrink-0"
                  style={{ backgroundColor: tab.groupColor }}
                  title={tab.groupName}
                />
              )}

              {/* Favicon / Spinner */}
              <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center" style={{ marginLeft: tab.groupColor ? '6px' : undefined }}>
                {tab.isLoading ? (
                  <div className="w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin opacity-60" />
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm" />
                ) : (
                  <Globe className="w-3.5 h-3.5 opacity-50" />
                )}
              </div>

              {/* Title */}
              <span className="flex-1 text-xs font-medium truncate leading-none">
                {tab.title || 'New Tab'}
              </span>

              {/* Close button */}
              <button
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
                className={`
                  flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-100
                  hover:bg-gray-300/80 dark:hover:bg-gray-600/80
                  ${tab.isActive ? 'opacity-50 hover:opacity-100' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'}
                `}
                aria-label="Close tab"
              >
                <X className="w-[11px] h-[11px]" />
              </button>
            </div>
          ))}
        </div>

        {/* New Tab Button */}
        <div className="p-2 border-t border-gray-200 dark:border-[#2a2a2a]">
          <button
            onClick={onTabAdd}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-500 dark:text-gray-400
              hover:bg-white/70 dark:hover:bg-[#2a2a2a] transition-colors duration-100"
            title="New tab (Ctrl+T)"
            aria-label="New tab"
          >
            <Plus className="w-4 h-4" />
            New tab
          </button>
        </div>
      </div>
    );
  }

  // ── Horizontal layout (default) ────────────────────────────────────────────
  return (
    <div className="flex items-end h-[50px] bg-[#dee1e6] dark:bg-[#1e1e1e] px-2 select-none flex-shrink-0 w-full" style={{ WebkitAppRegion: 'drag', pointerEvents: 'none' } as any}>
      <div className="flex items-end h-full gap-px flex-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab, index) => {
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;

          return (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              role="tab"
              aria-selected={tab.isActive}
              className={`
                group relative flex items-center gap-2 h-[44px] flex-1 min-w-[48px] max-w-[240px]
                px-2 sm:px-3 cursor-pointer select-none flex-shrink
                rounded-t-[10px] transition-colors duration-100
                ${tab.isActive
                  ? 'bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-100 shadow-[0_1px_0_0_white] dark:shadow-[0_1px_0_0_#2d2d2d] z-10'
                  : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-[#cbcdd2] dark:hover:bg-[#2a2a2a]'
                }
              `}
              style={{
                marginLeft: tab.isActive && !isFirst ? '-1px' : undefined,
                marginRight: tab.isActive && !isLast ? '-1px' : undefined,
                WebkitAppRegion: 'no-drag',
                pointerEvents: 'auto',
              } as React.CSSProperties}
            >
              {/* Group color strip — shown at bottom of tab when grouped */}
              {tab.groupColor && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full"
                  style={{ backgroundColor: tab.groupColor }}
                  title={tab.groupName}
                />
              )}

              {/* Favicon / Spinner */}
              <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {tab.isLoading ? (
                  <div className="w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin opacity-60" />
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm" />
                ) : (
                  <Globe className="w-3.5 h-3.5 opacity-50" />
                )}
              </div>

              {/* Title */}
              <span className="flex-1 text-xs font-medium truncate leading-none">
                {tab.title || 'New Tab'}
              </span>

              {/* Close button */}
              <button
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
                className={`
                  flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                  transition-all duration-100
                  hover:bg-gray-300/80 dark:hover:bg-gray-600/80
                  ${tab.isActive
                    ? 'opacity-60 hover:opacity-100'
                    : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
                  }
                `}
                aria-label="Close tab"
              >
                <X className="w-[11px] h-[11px]" />
              </button>
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={onTabAdd}
          className="flex-shrink-0 ml-1 mb-1.5 w-7 h-7 rounded-full flex items-center justify-center
            text-gray-500 dark:text-gray-400
            hover:bg-[#cbcdd2] dark:hover:bg-[#3a3a3a]
            active:bg-[#b8babe] dark:active:bg-[#444]
            transition-colors duration-100"
          title="New tab (Ctrl+T)"
          aria-label="New tab"
          style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' } as any}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Window Controls (Mac-style or Windows-style) */}
      <div className="flex items-center h-full mb-1.5 ml-2 gap-1" style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' } as any}>
        <button
          onClick={() => window.electron?.send?.('lumo:window-minimize')}
          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.electron?.send?.('lumo:window-maximize')}
          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electron?.send?.('lumo:window-close')}
          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
