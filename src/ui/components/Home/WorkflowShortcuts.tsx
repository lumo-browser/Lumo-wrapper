/**
 * WorkflowShortcuts Component
 * Displays saved workflow shortcuts
 */

import React from 'react';
import clsx from 'clsx';

interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  frequency: string;
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'daily-news',
    name: 'Daily News Digest',
    description: 'Summarize top news from your favorite sources',
    icon: '',
    frequency: 'Daily',
  },
  {
    id: 'market-monitor',
    name: 'Market Monitor',
    description: 'Track stock prices and market trends',
    icon: '',
    frequency: 'Hourly',
  },
  {
    id: 'price-tracker',
    name: 'Price Tracker',
    description: 'Monitor product prices and alert on changes',
    icon: '',
    frequency: 'Every 6h',
  },
  {
    id: 'competitor-analysis',
    name: 'Competitor Analysis',
    description: 'Track competitor websites and updates',
    icon: '',
    frequency: 'Daily',
  },
];

interface WorkflowShortcutsProps {
  workflows?: Workflow[];
  onExecute?: (workflowId: string) => void;
}

export function WorkflowShortcuts({
  workflows = DEFAULT_WORKFLOWS,
  onExecute,
}: WorkflowShortcutsProps): React.ReactElement {
  if (workflows.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p>No workflows created yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {workflows.map((workflow) => (
        <button
          key={workflow.id}
          onClick={() => onExecute?.(workflow.id)}
          className={clsx(
            'p-3 rounded-lg border-2 transition-all text-left',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
            'hover:border-purple-500 dark:hover:border-purple-500',
            'hover:shadow-md hover:shadow-purple-500/20',
            'group'
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">{workflow.icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">{workflow.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">{workflow.description}</p>
              <span className="inline-block px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {workflow.frequency}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
