import React, { useState } from 'react';
import { X, Globe, DownloadCloud, CheckCircle2 } from 'lucide-react';

export interface UserAccount {
  email: string;
  name: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  // We keep the old props for compatibility with App.tsx if needed, 
  // but they are unused since we removed Nova accounts.
  currentUser?: UserAccount | null;
  onLogin?: (u: UserAccount) => void;
  onLogout?: () => void;
}

export function AccountModal({ isOpen, onClose }: AccountModalProps): React.ReactElement | null {
  const [selectedBrowser, setSelectedBrowser] = useState<'firefox' | 'chrome' | 'edge'>('chrome');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImport = () => {
    setIsImporting(true);
    // Simulate IPC call to backend to read SQLite profiles
    setTimeout(() => {
      setIsImporting(false);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e1e] w-[400px] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#3a3a3a] overflow-hidden flex flex-col slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#252525]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-blue-500" />
            Import Browser Data
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nova is a local-first browser. You don't need a cloud account.
            Instead, seamlessly move your data from your previous browser.
          </p>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Select Source Browser
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['chrome', 'firefox', 'edge'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrowser(b)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all border
                    ${selectedBrowser === b
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-[#2d2d2d] border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#3a3a3a]'
                    }`}
                >
                  {b.charAt(0).toUpperCase() + b.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-gray-50 dark:bg-[#252525] p-3 rounded-xl border border-gray-100 dark:border-[#3a3a3a]">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" defaultChecked className="rounded text-blue-500 focus:ring-blue-500 bg-white dark:bg-[#1e1e1e] border-gray-300 dark:border-gray-600" />
              Bookmarks
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" defaultChecked className="rounded text-blue-500 focus:ring-blue-500 bg-white dark:bg-[#1e1e1e] border-gray-300 dark:border-gray-600" />
              Browsing History
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" defaultChecked className="rounded text-blue-500 focus:ring-blue-500 bg-white dark:bg-[#1e1e1e] border-gray-300 dark:border-gray-600" />
              Saved Passwords
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || importSuccess}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all mt-2
              ${importSuccess
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:bg-gray-400 disabled:shadow-none'
              }`}
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : importSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Success!
              </>
            ) : (
              'Start Import'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
