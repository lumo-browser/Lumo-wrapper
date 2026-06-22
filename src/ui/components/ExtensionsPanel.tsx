/**
 * ExtensionsPanel — Browser extension manager
 */

import React, { useState } from 'react';
import { Puzzle, MoreVertical, Pin, Settings, X, Shield, Moon, Key, Cpu } from 'lucide-react';

interface Extension {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  isPinned: boolean;
  color: string;
}

const DEFAULT_EXTENSIONS: Extension[] = [
  {
    id: 'Lumo-ai',
    name: 'Lumo AI Assistant',
    icon: Cpu,
    isPinned: true,
    color: 'text-violet-500',
  },
  {
    id: 'ad-blocker',
    name: 'Ad Blocker Pro',
    icon: Shield,
    isPinned: true,
    color: 'text-red-500',
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    icon: Moon,
    isPinned: false,
    color: 'text-indigo-500',
  },
  {
    id: 'password-mgr',
    name: 'Password Manager',
    icon: Key,
    isPinned: false,
    color: 'text-emerald-500',
  },
];

interface ExtensionsPanelProps {
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export function ExtensionsPanel({ onClose, onNavigate }: ExtensionsPanelProps): React.ReactElement {
  const [extensions, setExtensions] = useState<Extension[]>(DEFAULT_EXTENSIONS);

  const togglePin = (id: string) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, isPinned: !ext.isPinned } : ext))
    );
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#202124] rounded-xl shadow-2xl border border-gray-200 dark:border-[#3c4043] z-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-[14px] font-medium text-gray-900 dark:text-[#e8eaed]">Extensions</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-[#9aa0a6] hover:bg-gray-100 dark:hover:bg-[#3c4043] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="h-[1px] w-full bg-gray-200 dark:bg-[#3c4043]" />

      {/* Extension List */}
      <div className="py-2">
        {extensions.map((ext) => {
          const Icon = ext.icon;
          return (
            <div
              key={ext.id}
              className="group flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3c4043] transition-colors cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${ext.color}`} />
                </div>
                <span className="text-[13px] text-gray-900 dark:text-[#e8eaed]">{ext.name}</span>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => togglePin(ext.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
                    ${ext.isPinned 
                      ? 'text-blue-600 dark:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#8ab4f8]/10' 
                      : 'text-gray-500 dark:text-[#9aa0a6] hover:bg-gray-200 dark:hover:bg-[#4a4d51]'
                    }`}
                  title={ext.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-[#9aa0a6] hover:bg-gray-200 dark:hover:bg-[#4a4d51] transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-[1px] w-full bg-gray-200 dark:bg-[#3c4043]" />

      {/* Footer */}
      <button 
        onClick={() => onNavigate('lumo://extensions')}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#3c4043] transition-colors"
      >
        <Settings className="w-5 h-5 text-gray-500 dark:text-[#9aa0a6]" />
        <span className="text-[13px] text-gray-700 dark:text-[#e8eaed]">Manage extensions</span>
      </button>
    </div>
  );
}
