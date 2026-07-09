import React, { useState } from 'react';
import { 
  X, Download, Check, Monitor, Chrome, Globe, 
  Settings, Key, Bookmark, Clock
} from 'lucide-react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDataModal({ isOpen, onClose }: ImportDataModalProps): React.ReactElement | null {
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>('chrome');
  const [importItems, setImportItems] = useState({
    bookmarks: true,
    history: true,
    passwords: true,
    settings: false
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImport = () => {
    setIsImporting(true);
    // Simulate import / IPC call to backend
    setTimeout(() => {
      setIsImporting(false);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  const browsers = [
    { id: 'chrome', name: 'Google Chrome', icon: <Chrome className="w-8 h-8" />, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { id: 'edge', name: 'Microsoft Edge', icon: <Globe className="w-8 h-8" />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'firefox', name: 'Mozilla Firefox', icon: <Globe className="w-8 h-8" />, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { id: 'safari', name: 'Safari', icon: <Globe className="w-8 h-8" />, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#1e1e1e] w-[95vw] max-w-2xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-[#3a3a3a] overflow-hidden flex flex-col slide-up relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-[#3a3a3a] bg-gray-50/50 dark:bg-[#252525]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Browser Data</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bring your bookmarks, history, and passwords to Lumo.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 bg-gray-50 dark:bg-[#1a1a1a]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Select Source Browser</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {browsers.map((b) => (
              <div 
                key={b.id}
                onClick={() => setSelectedBrowser(b.id)}
                className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${
                  selectedBrowser === b.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                    : 'border-gray-200 dark:border-[#3a3a3a] hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#242424]'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform ${selectedBrowser === b.id ? 'scale-110' : ''} ${b.color}`}>
                  {b.icon}
                </div>
                <span className={`text-xs font-semibold text-center ${selectedBrowser === b.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {b.name}
                </span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">What to Import</h3>
          <div className="bg-white dark:bg-[#242424] rounded-xl border border-gray-100 dark:border-[#333] overflow-hidden divide-y divide-gray-50 dark:divide-[#333]">
            
            <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Bookmark className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Favorites / Bookmarks</span>
              </div>
              <input type="checkbox" checked={importItems.bookmarks} onChange={(e) => setImportItems({...importItems, bookmarks: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Key className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Saved Passwords</span>
              </div>
              <input type="checkbox" checked={importItems.passwords} onChange={(e) => setImportItems({...importItems, passwords: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Browsing History</span>
              </div>
              <input type="checkbox" checked={importItems.history} onChange={(e) => setImportItems({...importItems, history: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Settings & Autofill</span>
              </div>
              <input type="checkbox" checked={importItems.settings} onChange={(e) => setImportItems({...importItems, settings: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
            </label>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#3a3a3a] px-8 py-5 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleImport}
            disabled={isImporting || importSuccess || (!importItems.bookmarks && !importItems.history && !importItems.passwords && !importItems.settings)}
            className={`flex items-center justify-center min-w-[140px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              importSuccess 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25'
            }`}
          >
            {importSuccess ? (
              <><Check className="w-4 h-4 mr-2" /> Done!</>
            ) : isImporting ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</span>
            ) : (
              'Import Data'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
