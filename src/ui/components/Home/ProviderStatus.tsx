/**
 * ProviderStatus Component
 * Displays AI provider connection status
 */

import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { AIProvider } from '../../../types/home.types';

interface ProviderStatusProps {
  providers: AIProvider[];
}

const getStatusBadge = (status: string): { Icon: React.ComponentType<{ className?: string }>; color: string } => {
  switch (status) {
    case 'connected':
      return { Icon: CheckCircle, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
    case 'disconnected':
      return { Icon: XCircle, color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' };
    case 'error':
      return { Icon: AlertCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
    default:
      return { Icon: AlertCircle, color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' };
  }
};

const formatLastUsed = (date?: Date): string => {
  if (!date) return 'Never';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return 'Today';
};

export function ProviderStatus({ providers }: ProviderStatusProps): React.ReactElement {
  if (providers.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p>No AI providers configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {providers.map((provider) => {
        const badge = getStatusBadge(provider.status);

        return (
          <div
            key={provider.id}
            className={clsx(
              'p-3 rounded-lg border',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
              'flex items-center justify-between'
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center', badge.color)}>
                <badge.Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{provider.name}</p>
                {provider.model && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">{provider.model}</p>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-2">
              {formatLastUsed(provider.lastUsed)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
