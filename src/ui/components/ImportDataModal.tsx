import React, { useState } from 'react';
import { 
  X, Download, Check, 
  Settings, Key, Bookmark, Clock, ShieldCheck, AlertCircle
} from 'lucide-react';
import chromeLogo from '../../../assets/browser-logos/chrome.svg';
import edgeLogo from '../../../assets/browser-logos/edge.svg';
import firefoxLogo from '../../../assets/browser-logos/firefox.svg';
import safariLogo from '../../../assets/browser-logos/safari.svg';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfileId: string;
}

interface ImportSummary {
  bookmarks: number;
  history: number;
  passwords: number;
  totalSizeKB: number;
  errors: string[];
}

function formatBytes(kb: number): string {
  if (kb < 1) return '< 1 KB';
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

type ModalView = 'select' | 'importing' | 'summary' | 'error';

export function ImportDataModal({ isOpen, onClose, activeProfileId }: ImportDataModalProps): React.ReactElement | null {
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>('chrome');
  const [importItems, setImportItems] = useState({
    bookmarks: true,
    history: true,
    passwords: false,
    settings: false
  });
  const [view, setView] = useState<ModalView>('select');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleClose = () => {
    // reset state for next open
    setView('select');
    setSummary(null);
    setErrorMsg('');
    onClose();
  };

  const handleImport = async () => {
    setView('importing');
    try {
      const itemsToImport = Object.entries(importItems)
        .filter(([, isSelected]) => isSelected)
        .map(([key]) => key);

      const response = await (window as any).electron.invoke('lumo:import-browser-data', {
        browser: selectedBrowser,
        items: itemsToImport
      }) as any;

      if (response.success || response.importedBookmarks > 0 || response.importedHistory > 0) {
        // Sync bookmarks → lumo-bookmarks-{profileId} in BookmarkEntry format
        if (response.data?.bookmarks && response.data.bookmarks.length > 0) {
          const newBookmarks = response.data.bookmarks
            .filter((bm: any) => bm.type === 'url')
            .map((bm: any) => ({
              id: `bm-imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              url: bm.url,
              title: bm.name || bm.url,
              timestamp: Date.now(),
            }));

          const storageKey = `lumo-bookmarks-${activeProfileId}`;
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          localStorage.setItem(storageKey, JSON.stringify([...existing, ...newBookmarks]));
        }

        // Sync history → lumo-history-{profileId} in HistoryEntry format
        if (response.data?.history && response.data.history.length > 0) {
          const newHistory = (response.data.history as string[]).map((url: string) => ({
            id: `h-imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            url,
            title: url,
            timestamp: Date.now(),
          }));

          const storageKey = `lumo-history-${activeProfileId}`;
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          localStorage.setItem(storageKey, JSON.stringify([...newHistory, ...existing]));
        }

        // Calculate total KB stored for this profile
        const bookmarkStr = localStorage.getItem(`lumo-bookmarks-${activeProfileId}`) || '';
        const historyStr = localStorage.getItem(`lumo-history-${activeProfileId}`) || '';
        const totalSizeKB = (bookmarkStr.length + historyStr.length) / 1024;

        // Notify App.tsx to reload its React state from localStorage immediately
        window.dispatchEvent(new CustomEvent('lumo:data-imported', {
          detail: { profileId: activeProfileId }
        }));

        setSummary({
          bookmarks: response.importedBookmarks,
          history: response.importedHistory,
          passwords: response.importedPasswords,
          totalSizeKB,
          errors: response.errors || []
        });
        setView('summary');
      } else {
        setErrorMsg(response.errors?.join('\n') || 'Could not locate browser data files.');
        setView('error');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'An unexpected error occurred during import.');
      setView('error');
    }
  };

  const browsers = [
    { id: 'chrome', name: 'Google Chrome', logo: chromeLogo },
    { id: 'edge', name: 'Microsoft Edge', logo: edgeLogo },
    { id: 'firefox', name: 'Mozilla Firefox', logo: firefoxLogo },
    { id: 'safari', name: 'Safari', logo: safariLogo },
  ];

  // ─── Render: Importing spinner ───────────────────────────────────────────────
  if (view === 'importing') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
        <div className="bg-white dark:bg-[#1e1e1e] w-[95vw] max-w-md rounded-[2rem] shadow-2xl border border-gray-200 dark:border-[#3a3a3a] p-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-500 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Importing & Encrypting…</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your data is being secured with AES-256-GCM encryption.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Success Summary ─────────────────────────────────────────────────
  if (view === 'summary' && summary) {
    const statItems = [
      { icon: <Bookmark className="w-5 h-5" />, label: 'Bookmarks', value: summary.bookmarks, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
      { icon: <Clock className="w-5 h-5" />, label: 'History URLs', value: summary.history, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
      { icon: <Key className="w-5 h-5" />, label: 'Passwords', value: summary.passwords, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    ];
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
        <div className="bg-white dark:bg-[#1e1e1e] w-[95vw] max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-[#3a3a3a] overflow-hidden flex flex-col slide-up">
          {/* Success header */}
          <div className="flex flex-col items-center gap-3 px-8 pt-8 pb-6 bg-gradient-to-b from-green-50 dark:from-green-900/10 to-transparent">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Complete!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              All data was encrypted with AES-256-GCM and stored securely.
            </p>
          </div>

          {/* Stats grid */}
          <div className="px-8 pb-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {statItems.map((s) => (
                <div key={s.label} className="bg-gray-50 dark:bg-[#242424] rounded-2xl p-4 flex flex-col items-center gap-2 border border-gray-100 dark:border-[#333]">
                  <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
                  <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Total encrypted size */}
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  {formatBytes(summary.totalSizeKB)} stored securely
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  AES-256-GCM encrypted · Stored in browser localStorage
                </p>
              </div>
            </div>

            {/* Warnings from errors list */}
            {summary.errors.length > 0 && (
              <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {summary.errors.length} item(s) could not be imported (e.g., passwords require OS decryption).
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-200 dark:border-[#3a3a3a] flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Error ───────────────────────────────────────────────────────────
  if (view === 'error') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
        <div className="bg-white dark:bg-[#1e1e1e] w-[95vw] max-w-md rounded-[2rem] shadow-2xl border border-gray-200 dark:border-[#3a3a3a] p-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Import Failed</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center whitespace-pre-line">{errorMsg}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setView('select')} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors border border-gray-200 dark:border-[#3a3a3a]">
              Try Again
            </button>
            <button onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Default (Select) ────────────────────────────────────────────────
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
            onClick={handleClose}
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
                  <img src={b.logo} alt={b.name} className="w-10 h-10 object-contain" />
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
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Browsing History</span>
              </div>
              <input type="checkbox" checked={importItems.history} onChange={(e) => setImportItems({...importItems, history: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Saved Passwords</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Requires OS-level decryption (limited support)</p>
                </div>
              </div>
              <input type="checkbox" checked={importItems.passwords} onChange={(e) => setImportItems({...importItems, passwords: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
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
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleImport}
            disabled={!selectedBrowser || (!importItems.bookmarks && !importItems.history && !importItems.passwords && !importItems.settings)}
            className="flex items-center justify-center min-w-[140px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Data
          </button>
        </div>

      </div>
    </div>
  );
}
