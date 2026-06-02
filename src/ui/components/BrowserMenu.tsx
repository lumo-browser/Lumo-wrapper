/**
 * BrowserMenu — 3-dot menu dropdown, like Chrome/Edge
 * Settings, history, bookmarks, theme, about — all in one place.
 * No developer panels exposed here.
 */

import React from 'react';
import {
  X,
  BookOpen,
  Clock,
  Download,
  Settings,
  Info,
  Printer,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  LogIn,
  User,
} from 'lucide-react';

interface BrowserMenuProps {
  isDark: boolean;
  isLoggedIn: boolean;
  userEmail?: string;
  onClose: () => void;
  onToggleTheme: () => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  onNavigate: (url: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPrint: () => void;
}

interface MenuItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  separator?: boolean;
}

export function BrowserMenu({
  isDark,
  isLoggedIn,
  userEmail,
  onClose,
  onToggleTheme,
  onOpenAccount,
  onOpenSettings,
  onNavigate,
  onZoomIn,
  onZoomOut,
  onPrint,
}: BrowserMenuProps): React.ReactElement {
  const items: MenuItem[] = [
    { id: 'zoom-in',    icon: ZoomIn,    label: 'Zoom in',      shortcut: 'Ctrl++', onClick: () => { onZoomIn(); onClose(); } },
    { id: 'zoom-out',   icon: ZoomOut,   label: 'Zoom out',     shortcut: 'Ctrl+-', onClick: () => { onZoomOut(); onClose(); } },
    { id: 'bookmarks',  icon: BookOpen,  label: 'Bookmarks',    shortcut: 'Ctrl+B', onClick: () => { onNavigate('Lumo://bookmarks'); onClose(); }, separator: true },
    { id: 'history',    icon: Clock,     label: 'History',      shortcut: 'Ctrl+H', onClick: () => { onNavigate('Lumo://history'); onClose(); } },
    { id: 'downloads',  icon: Download,  label: 'Downloads',    shortcut: 'Ctrl+J', onClick: () => { onNavigate('Lumo://downloads'); onClose(); }, separator: true },
    { id: 'print',      icon: Printer,   label: 'Print',        shortcut: 'Ctrl+P', onClick: () => { onPrint(); onClose(); } },
    {
      id: 'theme',
      icon: isDark ? Sun : Moon,
      label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      onClick: () => { onToggleTheme(); onClose(); },
      separator: true,
    },
    { id: 'settings',   icon: Settings,  label: 'Settings',     shortcut: 'Ctrl+,', onClick: () => { onOpenSettings(); onClose(); } },
    { id: 'about',      icon: Info,      label: 'About Lumo',                        onClick: () => { onNavigate('Lumo://about'); onClose(); } },
  ];

  return (
    <div className="absolute right-2 top-full mt-1 w-56 bg-white dark:bg-[#2d2d2d] rounded-xl shadow-2xl border border-gray-200 dark:border-[#3a3a3a] z-50 overflow-hidden py-1">
      {/* Sync strip */}
      <button
        onClick={() => { onOpenAccount(); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-colors border-b border-gray-100 dark:border-[#3a3a3a] mb-1"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <Download className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">Import Browser Data</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Sync from Firefox or Chrome</p>
        </div>
      </button>

      {/* Menu items */}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <React.Fragment key={item.id}>
            {item.separator && <div className="my-1 border-t border-gray-100 dark:border-[#3a3a3a]" />}
            <button
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{item.shortcut}</span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
