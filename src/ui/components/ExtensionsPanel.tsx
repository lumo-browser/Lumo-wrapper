/**
 * ExtensionsPanel — Browser extension manager
 */

import React, { useState } from 'react';
import { Puzzle, Power, ExternalLink, Search, X } from 'lucide-react';

interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  icon: string;
}

const DEFAULT_EXTENSIONS: Extension[] = [
  {
    id: 'nova-ai-assist',
    name: 'Nova AI Assistant',
    description: 'Inline AI suggestions and page summaries powered by Nova',
    version: '1.0.0',
    enabled: true,
    icon: 'N',
  },
  {
    id: 'ad-blocker',
    name: 'Ad Blocker Pro',
    description: 'Block intrusive ads and trackers for a faster browsing experience',
    version: '2.3.1',
    enabled: true,
    icon: 'A',
  },
  {
    id: 'password-mgr',
    name: 'Password Manager',
    description: 'Securely store and autofill your passwords',
    version: '1.5.0',
    enabled: false,
    icon: 'P',
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    description: 'Dark mode for every website',
    version: '4.9.80',
    enabled: true,
    icon: 'D',
  },
];

interface ExtensionsPanelProps {
  onClose: () => void;
}

export function ExtensionsPanel({ onClose }: ExtensionsPanelProps): React.ReactElement {
  const [extensions, setExtensions] = useState<Extension[]>(DEFAULT_EXTENSIONS);
  const [search, setSearch] = useState('');

  const toggleExtension = (id: string) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, enabled: !ext.enabled } : ext))
    );
  };

  const filtered = extensions.filter(
    (ext) =>
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = extensions.filter((e) => e.enabled).length;

  return (
    <div className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Extensions</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{enabledCount} active</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search extensions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Extension List */}
      <div className="max-h-72 overflow-y-auto p-3 space-y-2">
        {filtered.map((ext) => (
          <div
            key={ext.id}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {ext.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ext.name}</p>
                <span className="text-xs text-gray-400">v{ext.version}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{ext.description}</p>
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggleExtension(ext.id)}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors
                ${ext.enabled
                  ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                  : 'text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              title={ext.enabled ? 'Disable' : 'Enable'}
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <button className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
          <ExternalLink className="w-3 h-3" />
          Manage extensions
        </button>
      </div>
    </div>
  );
}
