import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Globe, AlertTriangle } from 'lucide-react';

interface PendingRequest {
  url: string;
  host: string;
  resourceType: string;
  sessionLabel: string;
  timestamp: string;
}

export function PermissionRequest(): React.ReactElement | null {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = window.electron?.on('lumo:permission-request', (_event: unknown, data: PendingRequest) => {
      setPending(data);
      setVisible(true);
    });
    return () => unsub?.();
  }, []);

  const handleDecision = useCallback((decision: 'allow' | 'allow-once' | 'block') => {
    if (pending) {
      window.electron?.send('lumo:permission-decision', { host: pending.host, decision });
    }
    setVisible(false);
    setPending(null);
  }, [pending]);

  const handleAllowAlways = useCallback(() => {
    handleDecision('allow');
  }, [handleDecision]);

  const handleAllowOnce = useCallback(() => {
    handleDecision('allow-once');
  }, [handleDecision]);

  const handleBlock = useCallback(() => {
    handleDecision('block');
  }, [handleDecision]);

  if (!visible || !pending) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-[420px] bg-white dark:bg-[#2a2a2a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Permission Required
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Zero-Trust mode needs your approval
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-lg">
            <Globe className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 break-all">
                {pending.host}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 break-all truncate">
                {pending.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>
              This domain is not on the allow-list. Do you want to allow it?
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-zinc-900/30 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <button
            onClick={handleBlock}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Block
          </button>
          <button
            onClick={handleAllowOnce}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Allow Once
          </button>
          <button
            onClick={handleAllowAlways}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Allow Always
          </button>
        </div>
      </div>
    </div>
  );
}
