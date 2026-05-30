/**
 * RecentTasks Component
 * Displays recent executed tasks
 */

import React from 'react';
import clsx from 'clsx';
import { RecentTask } from '@types/home.types';

interface RecentTasksProps {
  tasks: RecentTask[];
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'failed':
      return '❌';
    case 'in-progress':
      return '⏳';
    default:
      return '📋';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    case 'failed':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    case 'in-progress':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
  }
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export function RecentTasks({ tasks }: RecentTasksProps): React.ReactElement {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No recent tasks. Start by searching for something above!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={clsx(
            'p-4 rounded-lg border transition-all hover:shadow-md',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getStatusIcon(task.status)}</span>
                <span className={clsx('px-2 py-1 rounded text-xs font-medium', getStatusColor(task.status))}>
                  {task.status}
                </span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">{task.goal}</p>
              {task.result && <p className="text-sm text-gray-600 dark:text-gray-400">{task.result}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{formatTime(task.timestamp)}</p>
            </div>

            {task.confidence !== undefined && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(task.confidence * 100)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">confidence</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
