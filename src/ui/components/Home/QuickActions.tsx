/**
 * QuickActions Component
 * Displays suggested quick actions
 */

import React from 'react';
import clsx from 'clsx';
import { QuickAction } from '@types/home.types';

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps): React.ReactElement {
  if (actions.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No suggestions available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.action}
          className={clsx(
            'p-4 rounded-lg border-2 transition-all text-left',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
            'hover:border-blue-500 dark:hover:border-blue-500',
            'hover:shadow-md hover:shadow-blue-500/20',
            'group'
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{action.description}</p>
              <div className="flex flex-wrap gap-1">
                {action.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs',
                      'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
