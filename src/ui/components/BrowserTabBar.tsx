/**
 * BrowserTabBar — Chrome-style tab management bar
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
}

interface BrowserTabBarProps {
  tabs: BrowserTab[];
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabAdd: () => void;
}

export function BrowserTabBar({ tabs, onTabSelect, onTabClose, onTabAdd }: BrowserTabBarProps): React.ReactElement {
  return (
    <div className="flex items-end bg-gray-200 dark:bg-gray-900 px-2 pt-1 overflow-x-auto select-none min-h-[38px]">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabSelect(tab.id)}
          className={`
            group relative flex items-center gap-2 min-w-[120px] max-w-[220px] px-3 py-1.5 mr-0.5 rounded-t-lg cursor-pointer
            text-xs font-medium transition-all duration-150 flex-shrink-0
            ${tab.isActive
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/80'
            }
          `}
        >
          {/* Favicon / Loading */}
          {tab.isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          )}

          {/* Tab Title */}
          <span className="truncate flex-1">{tab.title || 'New Tab'}</span>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className={`
              flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
              transition-colors hover:bg-gray-300 dark:hover:bg-gray-600
              ${tab.isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70'}
            `}
          >
            <X className="w-2.5 h-2.5" />
          </button>

          {/* Active tab bottom connector */}
          {tab.isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white dark:bg-gray-800" />
          )}
        </div>
      ))}

      {/* New Tab Button */}
      <button
        onClick={onTabAdd}
        className="flex-shrink-0 w-7 h-7 ml-1 mb-1 rounded-full flex items-center justify-center
          text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700
          transition-colors duration-150"
        title="New tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
