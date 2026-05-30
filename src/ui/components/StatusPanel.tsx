/**
 * Status & History Panel Component
 * Shows execution history and browser statistics
 */

import React, { useState, useEffect } from 'react';
import { logger } from '@utils/logger';

const SCOPE = 'StatusPanel';

interface ExecutionRecord {
  id: string;
  goal: string;
  confidence: number;
  stepCount: number;
  duration: number;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
}

export function StatusPanel(): React.ReactElement {
  const [history, setHistory] = useState<ExecutionRecord[]>([
    {
      id: '1',
      goal: 'Navigate to homepage',
      confidence: 95,
      stepCount: 1,
      duration: 3000,
      status: 'success',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      goal: 'Search for TypeScript',
      confidence: 88,
      stepCount: 5,
      duration: 8000,
      status: 'success',
      timestamp: new Date(Date.now() - 1800000),
    },
  ]);

  const [stats, setStats] = useState({
    totalExecutions: 2,
    successRate: 100,
    avgConfidence: 91.5,
    totalTime: 11000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'pending':
        return '...';
      default:
        return '?';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 p-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Status & History
        </h2>
        <p className="text-xs text-purple-100 mt-1">Monitor execution and plan history</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Executions</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalExecutions}</p>
          </div>

          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Success Rate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.successRate}%</p>
          </div>

          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Avg Confidence</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.avgConfidence.toFixed(0)}%</p>
          </div>

          <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Time</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{(stats.totalTime / 1000).toFixed(1)}s</p>
          </div>
        </div>

        {/* History Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            Recent Executions
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((record) => (
              <div
                key={record.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {record.goal}
                    </p>
                    <p className={`text-xs mt-1 ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)} {record.status.toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                    {formatTime(record.timestamp)}
                  </span>
                </div>

                <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span>{record.stepCount} steps</span>
                  <span>{(record.duration / 1000).toFixed(1)}s</span>
                  <span>{record.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Indicator */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">System ready for planning</span>
          </div>
        </div>
      </div>
    </div>
  );
}
