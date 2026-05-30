/**
 * AIStatusWidget Component
 * Displays AI system status
 */

import React from 'react';
import clsx from 'clsx';

interface AIStatusWidgetProps {
  status: 'ready' | 'busy' | 'error';
}

const getStatusDisplay = (status: string): { icon: string; label: string; color: string } => {
  switch (status) {
    case 'ready':
      return {
        icon: '🟢',
        label: 'System Ready',
        color: 'text-green-600 dark:text-green-400',
      };
    case 'busy':
      return {
        icon: '🟡',
        label: 'Processing',
        color: 'text-yellow-600 dark:text-yellow-400',
      };
    case 'error':
      return {
        icon: '🔴',
        label: 'System Error',
        color: 'text-red-600 dark:text-red-400',
      };
    default:
      return {
        icon: '⚪',
        label: 'Unknown',
        color: 'text-gray-600 dark:text-gray-400',
      };
  }
};

export function AIStatusWidget({ status }: AIStatusWidgetProps): React.ReactElement {
  const display = getStatusDisplay(status);

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border',
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl animate-pulse">{display.icon}</div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">AI Status</p>
          <p className={clsx('font-semibold', display.color)}>{display.label}</p>
        </div>
      </div>
    </div>
  );
}
