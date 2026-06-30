/**
 * RecentTasks Component - Professional Version
 * Displays recent executed tasks with professional status indicators
 */

import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { RecentTask } from '../../../types/home.types';

interface RecentTasksProps {
  tasks: RecentTask[];
}

const getStatusIcon = (status: string): React.ReactNode => {
  const iconClass = 'w-5 h-5';
  switch (status) {
    case 'completed':
      return <CheckCircle className={clsx(iconClass, 'text-green-600 dark:text-green-400')} />;
    case 'failed':
      return <AlertCircle className={clsx(iconClass, 'text-red-600 dark:text-red-400')} />;
    case 'in-progress':
      return <Clock className={clsx(iconClass, 'text-blue-600 dark:text-blue-400 animate-spin')} />;
    default:
      return <Clock className={clsx(iconClass, 'text-gray-600 dark:text-gray-400')} />;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'failed':
      return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'in-progress':
      return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    default:
      return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export function RecentTasks({ tasks }: RecentTasksProps): React.ReactElement {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mb-4 text-gray-400 dark:text-gray-600 flex justify-center">
          <Clock className="w-12 h-12" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No recent tasks yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Start by searching for something above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={clsx(
            'p-4 rounded-lg border transition-all hover:shadow-md',
            'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
            'hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(task.status)}
                <span
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                    getStatusColor(task.status)
                  )}
                >
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{task.goal}</p>
              {task.result && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{task.result}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{formatTime(task.timestamp)}</p>
            </div>

            {task.confidence !== undefined && (
              <div className="flex-shrink-0 text-right">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(task.confidence * 100)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">confidence</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
