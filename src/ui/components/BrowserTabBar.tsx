/**
 * BrowserTabBar — Pixel-accurate Chrome/Edge-style tab strip
 */

import React from 'react';
import { X, Plus, Globe } from 'lucide-react';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

interface BrowserTabBarProps {
  tabs: BrowserTab[];
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabAdd: () => void;
}

export function BrowserTabBar({
  tabs,
  onTabSelect,
  onTabClose,
  onTabAdd,
}: BrowserTabBarProps): React.ReactElement {
  return (
    <div className="flex items-end h-10 bg-[#dee1e6] dark:bg-[#1e1e1e] px-2 overflow-x-auto scrollbar-none select-none flex-shrink-0">
      <div className="flex items-end h-full gap-px">
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
                group relative flex items-center gap-2 h-[34px] min-w-[120px] max-w-[240px]
                px-3 cursor-pointer select-none flex-shrink-0
                rounded-t-[10px] transition-colors duration-100
                ${tab.isActive
                  ? 'bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-100 shadow-[0_1px_0_0_white] dark:shadow-[0_1px_0_0_#2d2d2d] z-10'
                  : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-[#cbcdd2] dark:hover:bg-[#2a2a2a]'
                }
              `}
              style={{
                marginLeft: tab.isActive && !isFirst ? '-1px' : undefined,
                marginRight: tab.isActive && !isLast ? '-1px' : undefined,
              }}
            >
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
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
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
      </div>

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
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
