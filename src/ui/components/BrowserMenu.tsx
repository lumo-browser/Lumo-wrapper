/**
 * BrowserMenu — 3-dot menu dropdown, like Chrome/Edge
 * Settings, history, bookmarks, theme, about — all in one place.
 * No developer panels exposed here.
 */

import React from 'react';
import {
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
  Plus,
  Ghost,
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
  onNewTab: () => void;
  onNewDisposableWindow: () => void;
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
  onClose,
  onToggleTheme,
  onOpenAccount,
  onOpenSettings,
  onNavigate,
  onNewTab,
  onNewDisposableWindow,
  onZoomIn,
  onZoomOut,
  onPrint,
}: BrowserMenuProps): React.ReactElement {
  const items: MenuItem[] = [
    { id: 'new-tab',       icon: Plus,      label: 'New Tab',             shortcut: 'Ctrl+T', onClick: () => { onNewTab(); onClose(); } },
    { id: 'new-disposable',icon: Ghost,     label: 'Private Tab', shortcut: 'Ctrl+Shift+N', onClick: () => { onNewDisposableWindow(); onClose(); }, separator: true },
    { id: 'zoom-in',       icon: ZoomIn,    label: 'Zoom in',             shortcut: 'Ctrl++', onClick: () => { onZoomIn(); onClose(); } },
    { id: 'zoom-out',   icon: ZoomOut,   label: 'Zoom out',     shortcut: 'Ctrl+-', onClick: () => { onZoomOut(); onClose(); } },
    { id: 'switch-profile', icon: User, label: 'Switch Profile', onClick: () => { onOpenAccount(); onClose(); }, separator: true },
    { id: 'bookmarks',  icon: BookOpen,  label: 'Bookmarks',    shortcut: 'Ctrl+B', onClick: () => { onNavigate('lumo://bookmarks'); onClose(); } },
    { id: 'history',    icon: Clock,     label: 'History',      shortcut: 'Ctrl+H', onClick: () => { onNavigate('lumo://history'); onClose(); } },
    { id: 'downloads',  icon: Download,  label: 'Downloads',    shortcut: 'Ctrl+J', onClick: () => { onNavigate('lumo://downloads'); onClose(); }, separator: true },
    { id: 'print',      icon: Printer,   label: 'Print',        shortcut: 'Ctrl+P', onClick: () => { onPrint(); onClose(); } },
    {
      id: 'theme',
      icon: isDark ? Sun : Moon,
      label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      onClick: () => { onToggleTheme(); onClose(); },
      separator: true,
    },
    { id: 'settings',   icon: Settings,  label: 'Settings',     shortcut: 'Ctrl+,', onClick: () => { onOpenSettings(); onClose(); } },
    { id: 'about',      icon: Info,      label: 'About Lumo',                        onClick: () => { onNavigate('lumo://about'); onClose(); } },
  ];

  return (
    <div className="absolute right-2 top-full mt-1 w-56 dropdown-menu z-50 flex flex-col gap-0.5">
      {/* Menu items */}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <React.Fragment key={item.id}>
            {item.separator && <div className="my-1 border-t border-gray-100 dark:border-white/5" />}
            <button
              onClick={item.onClick}
              className="dropdown-item"
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
