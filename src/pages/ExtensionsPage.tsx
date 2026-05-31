import React, { useState } from 'react';
import { Search, Puzzle, Trash2, Power, ExternalLink, Shield, Moon, Key, Cpu, Settings } from 'lucide-react';

interface ExtensionData {
  id: string;
  name: string;
  description: string;
  version: string;
  size: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  enabled: boolean;
  canRemove: boolean;
}

const INITIAL_EXTENSIONS: ExtensionData[] = [
  {
    id: 'nova-ai',
    name: 'Nova AI Assistant',
    description: 'Built-in AI companion for page summaries and intelligent search.',
    version: '1.0.0',
    size: '12.4 MB',
    icon: Cpu,
    color: 'text-violet-500',
    enabled: true,
    canRemove: false,
  },
  {
    id: 'ad-blocker',
    name: 'Nova Ad Blocker',
    description: 'Native ad and tracker blocking engine.',
    version: '2.1.0',
    size: '4.1 MB',
    icon: Shield,
    color: 'text-red-500',
    enabled: true,
    canRemove: false,
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    description: 'Dark mode for every website. Take care of your eyes.',
    version: '4.9.80',
    size: '1.2 MB',
    icon: Moon,
    color: 'text-indigo-500',
    enabled: false,
    canRemove: true,
  },
  {
    id: 'password-mgr',
    name: 'Nova Passwords',
    description: 'Secure local password management and autofill.',
    version: '1.0.5',
    size: '2.8 MB',
    icon: Key,
    color: 'text-emerald-500',
    enabled: true,
    canRemove: true,
  }
];

interface ExtensionsPageProps {
  onNavigate: (url: string) => void;
}

export function ExtensionsPage({ onNavigate }: ExtensionsPageProps): React.ReactElement {
  const [extensions, setExtensions] = useState<ExtensionData[]>(INITIAL_EXTENSIONS);
  const [search, setSearch] = useState('');

  const toggleExtension = (id: string) => {
    setExtensions(prev => prev.map(ext => ext.id === id ? { ...ext, enabled: !ext.enabled } : ext));
  };

  const removeExtension = (id: string) => {
    setExtensions(prev => prev.filter(ext => ext.id !== id));
  };

  const filtered = extensions.filter(ext => 
    ext.name.toLowerCase().includes(search.toLowerCase()) || 
    ext.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full bg-[#f1f3f4] dark:bg-[#202124] font-sans">
      
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-transparent border-r border-gray-200 dark:border-[#3c4043] flex flex-col py-4">
        <h1 className="text-xl font-medium text-gray-800 dark:text-[#e8eaed] px-6 mb-6">Extensions</h1>
        
        <div className="flex flex-col space-y-1 px-3 flex-1">
          <button className="flex items-center gap-4 px-3 py-2.5 rounded-r-full bg-blue-100 dark:bg-[#8ab4f8]/10 text-blue-700 dark:text-[#8ab4f8] font-medium text-sm">
            <Puzzle className="w-5 h-5" />
            My Extensions
          </button>
        </div>

        <div className="px-3 pb-2 mt-auto">
          <div className="h-[1px] w-full bg-gray-200 dark:bg-[#3c4043] mb-4" />
          <button 
            onClick={() => onNavigate('https://chrome.google.com/webstore/category/extensions')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 dark:text-[#9aa0a6] hover:bg-gray-200 dark:hover:bg-[#3c4043] rounded-md transition-colors"
          >
            <span className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4" />
              Chrome Web Store
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top bar */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#292a2d]">
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#9aa0a6]" />
            <input 
              type="text"
              placeholder="Search extensions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-11 pr-4 bg-gray-100 dark:bg-[#202124] border border-transparent focus:border-blue-500 dark:focus:border-[#8ab4f8] focus:bg-white rounded-full text-sm text-gray-900 dark:text-[#e8eaed] outline-none transition-all placeholder-gray-500 dark:placeholder-[#9aa0a6]"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              
              {filtered.map(ext => {
                const Icon = ext.icon;
                return (
                  <div key={ext.id} className="bg-white dark:bg-[#292a2d] rounded-lg shadow-sm border border-gray-200 dark:border-[#3c4043] overflow-hidden flex flex-col">
                    
                    {/* Upper content */}
                    <div className="flex p-4 gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <Icon className={`w-10 h-10 ${ext.color}`} />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[13px] font-medium text-gray-900 dark:text-[#e8eaed] truncate" title={ext.name}>
                            {ext.name}
                          </h3>
                          
                          {/* Toggle */}
                          <button
                            onClick={() => toggleExtension(ext.id)}
                            className={`relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0 ${
                              ext.enabled ? 'bg-blue-500 dark:bg-[#8ab4f8]' : 'bg-gray-300 dark:bg-[#5f6368]'
                            }`}
                          >
                            <span
                              className={`absolute top-[2px] left-[2px] w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                                ext.enabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <p className="text-[12px] text-gray-600 dark:text-[#9aa0a6] mt-1">{ext.size}</p>
                        <p className="text-[13px] text-gray-600 dark:text-[#9aa0a6] mt-2 line-clamp-3 leading-relaxed">
                          {ext.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="mt-auto px-4 py-3 bg-gray-50 dark:bg-[#202124] border-t border-gray-200 dark:border-[#3c4043] flex items-center justify-end gap-2">
                      <button className="px-4 py-1.5 text-[13px] font-medium text-blue-600 dark:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#8ab4f8]/10 rounded-md transition-colors">
                        Details
                      </button>
                      {ext.canRemove && (
                        <button 
                          onClick={() => removeExtension(ext.id)}
                          className="px-4 py-1.5 text-[13px] font-medium text-gray-700 dark:text-[#e8eaed] hover:bg-gray-200 dark:hover:bg-[#3c4043] border border-gray-300 dark:border-[#5f6368] rounded-md transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
