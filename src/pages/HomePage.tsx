/**
 * HomePage
 * Search-first home page for Nova Browser
 */

import React from 'react';
import clsx from 'clsx';
import { useHome } from '@hooks/useHome';
import { SearchBar, RecentTasks, QuickActions, AIStatusWidget, ProviderStatus, WorkflowShortcuts } from '@ui/components/Home';
import { Logger } from '@utils/logger';

const logger = new Logger('HomePage');
const SCOPE = 'HomePage';

export function HomePage(): React.ReactElement {
  const { recentTasks, suggestedActions, aiProviders, systemStatus, loading } = useHome();

  const handleSearch = (query: string): void => {
    logger.info(SCOPE, `Search query: ${query}`);
    // Would navigate to execution or chat page
  };

  return (
    <div className={clsx('w-full min-h-screen', 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900', 'transition-colors duration-300')}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Logo */}
        <div className="py-12 text-center">
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            🚀
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Nova Browser</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">AI-powered autonomous browser</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Status Indicator */}
        <div className="mb-12 flex justify-center">
          <AIStatusWidget status={systemStatus} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Recent Tasks */}
          <div className="lg:col-span-2">
            <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700')}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📋</span> Recent Tasks
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              ) : (
                <RecentTasks tasks={recentTasks} />
              )}
            </div>
          </div>

          {/* Right Column - AI Status & Providers */}
          <div className="space-y-6">
            {/* AI Providers */}
            <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700')}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🤖</span> AI Providers
              </h3>
              <ProviderStatus providers={aiProviders} />
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-12')}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span>⚡</span> Suggested Actions
          </h2>
          <QuickActions actions={suggestedActions} />
        </div>

        {/* Workflow Shortcuts */}
        <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-12')}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span>⚙️</span> Your Workflows
          </h2>
          <WorkflowShortcuts />
        </div>

        {/* Footer */}
        <div className="py-12 text-center border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nova Browser v0.1.0 • Phase 3 Week 1 • Search-first Interface • Made with ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
