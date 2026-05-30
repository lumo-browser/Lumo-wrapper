/**
 * AIStatusWidget Component - Professional Version
 * Displays AI system status with professional indicators
 */

import React from 'react';
import { CheckCircle, AlertCircle, Zap } from 'lucide-react';
import clsx from 'clsx';

interface AIStatusWidgetProps {
  status: 'ready' | 'busy' | 'error';
}

const getStatusDisplay = (
  status: string
): { icon: React.ReactNode; label: string; description: string; color: string; bgColor: string } => {
  switch (status) {
    case 'ready':
      return {
        icon: <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />,
        label: 'System Ready',
        description: 'All systems operational',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      };
    case 'busy':
      return {
        icon: <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />,
        label: 'Processing',
        description: 'Executing tasks',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      };
    case 'error':
      return {
        icon: <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
        label: 'System Error',
        description: 'Please try again',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      };
    default:
      return {
        icon: <AlertCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />,
        label: 'Unknown',
        description: 'Status unavailable',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
      };
  }
};

export function AIStatusWidget({ status }: AIStatusWidgetProps): React.ReactElement {
  const display = getStatusDisplay(status);

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border',
        'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800',
        'transition-all hover:shadow-md'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">{display.icon}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
          <p className={clsx('font-semibold', display.color)}>{display.label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{display.description}</p>
        </div>
      </div>
    </div>
  );
}
