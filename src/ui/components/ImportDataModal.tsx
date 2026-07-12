import React, { useState } from 'react';
import { 
  X, Download, Check, 
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

  const ChromeLogo = () => (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <circle cx="24" cy="24" r="22" fill="#fff"/>
      <path d="M24 8C15.16 8 8 15.16 8 24h10.6c0-2.95 2.4-5.35 5.4-5.35s5.4 2.4 5.4 5.35H40c0-8.84-7.16-16-16-16z" fill="#EA4335"/>
      <path d="M8 24c0 5.18 2.44 9.79 6.24 12.72L19.8 24H8z" fill="#4285F4"/>
      <path d="M24 40c6.18 0 11.54-3.38 14.4-8.38L28.2 24l-4.2 10.35c-.84.15-1.7.15-2.55 0L14.24 36.72C17.04 39.12 20.36 40 24 40z" fill="#34A853"/>
      <path d="M40 24H28.2l6 11.62C36.46 32.2 38 28.38 38 24h2z" fill="#FBBC05"/>
      <circle cx="24" cy="24" r="8" fill="#fff"/>
      <circle cx="24" cy="24" r="5.4" fill="#4285F4"/>
    </svg>
  );

  const EdgeLogo = () => (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <circle cx="24" cy="24" r="22" fill="#fff"/>
      <path d="M24 6C13.5 6 5 14 5 25c0 6 2.8 11.2 7 14.5V25c0-6.6 5.4-12 12-12 4.4 0 8.2 2.4 10.2 6H35c-4.4-5-10-8-11-8z" fill="#0078D4"/>
      <path d="M12 25c0 6.6 5.4 12 12 12 5.5 0 10.2-3.6 11.8-8.5H25c-1 0-1.5-.5-1.5-1.5s.5-1.5 1.5-1.5h12c1 0 1.5.5 1.5 1.5v1.5c0 7.7-6.3 14-14 14C15.4 43 9 36.6 9 28.5c0-2 .4-4 1.2-5.7" fill="#50E6FF"/>
      <path d="M24 13c5.5 0 10 4.5 10 10 0 2-.5 4-1.5 5.7-1 1.7-2.5 3-4.5 3.5h-12c-.5 0-1 .5-1 1s.5 1 1 1h13.5c3.5-.5 6-3.5 6.5-7 .5-5-3.5-10.2-8.5-12-1.2-.5-2.5-.7-4-.7H24z" fill="#0078D4"/>
    </svg>
  );

  const FirefoxLogo = () => (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <circle cx="24" cy="24" r="22" fill="#fff"/>
      <path d="M24 6C13.5 6 5 14 5 25c0 7 4 13.5 10 17l2-3c-4-3-7-8-7-14 0-8 7-15 14-15 3 0 5.5 1 7.5 2.5C29 8 26.5 6 24 6z" fill="#FF9500"/>
      <path d="M15 42c3 1.5 6 2 9 2 11 0 20-8 20-19 0-3-.5-5.5-2-8-1.5-2.5-3.5-4-6-5 1 1.5 1.5 3.5 1.5 5.5 0 9-7 16-16 16-3 0-5-.5-7-1.5" fill="#FF3750"/>
      <path d="M38 16c1 2.5 1 5 1 8 0 11-9 19-20 19-3 0-6-1-9-3l2-3c2 1 4 1.5 7 1.5 10 0 18-7 18-17 0-2-.5-4-1.5-5.5" fill="#FFBD4F"/>
      <circle cx="26" cy="26" r="8" fill="#3ACBFF"/>
      <circle cx="26" cy="26" r="5" fill="#fff"/>
      <circle cx="26" cy="26" r="3.5" fill="#1C4E8A"/>
    </svg>
  );

  const SafariLogo = () => (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <circle cx="24" cy="24" r="22" fill="#fff"/>
      <circle cx="24" cy="24" r="18" fill="url(#safariGrad)" stroke="#ddd" strokeWidth="0.5"/>
      <defs>
        <linearGradient id="safariGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F0FE"/>
          <stop offset="100%" stopColor="#C5D9F0"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="16" fill="none" stroke="#999" strokeWidth="0.4"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => (
        <line key={deg} x1="24" y1="6" x2="24" y2="9" stroke="#888" strokeWidth={deg % 90 === 0 ? 1.2 : 0.5}
          transform={`rotate(${deg} 24 24)`} />
      ))}
      <polygon points="24,10 26.5,22 24,24 21.5,22" fill="#FF3B30"/>
      <polygon points="24,38 21.5,26 24,24 26.5,26" fill="#fff"/>
      <polygon points="10,24 22,21.5 24,24 22,26.5" fill="#fff" opacity="0.8"/>
      <polygon points="38,24 26,26.5 24,24 26,21.5" fill="#fff" opacity="0.8"/>
      <circle cx="24" cy="24" r="1.8" fill="#333"/>
    </svg>
  );

  const browsers = [
    { id: 'chrome', name: 'Google Chrome', logo: <ChromeLogo />, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { id: 'edge', name: 'Microsoft Edge', logo: <EdgeLogo />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'firefox', name: 'Mozilla Firefox', logo: <FirefoxLogo />, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { id: 'safari', name: 'Safari', logo: <SafariLogo />, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
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
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform ${selectedBrowser === b.id ? 'scale-110' : ''}`}>
                  {b.logo}
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
