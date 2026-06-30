/**
 * HomePage - Professional Version
 * Search-first home page for Lumo Browser
 */

import React from 'react';
import { Zap, Cog } from 'lucide-react';
import { useHome } from '@hooks/useHome';
import {
  SearchBar,
  RecentTasks,
  QuickActions,
  AIStatusWidget,
  ProviderStatus,
  WorkflowShortcuts,
} from '@ui/components/Home';
import { Logger } from '@utils/logger';

const logger = Logger.getInstance();
const SCOPE = 'HomePage';

export function HomePage(): React.ReactElement {
  const { recentTasks, suggestedActions, aiProviders, systemStatus, loading } = useHome();

  const handleSearch = (query: string): void => {
    logger.info(SCOPE, `Search query: ${query}`);
    // Would navigate to execution or chat page
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8 sm:py-12 border-b border-gray-200 dark:border-gray-800">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Lumo Browser</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              AI-powered autonomous browsing and research
            </p>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="py-12">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Status and Quick Info */}
        <div className="mb-12 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <AIStatusWidget status={systemStatus} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Recent Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Tasks</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your search and execution history</p>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                  </div>
                </div>
              ) : (
                <RecentTasks tasks={recentTasks} />
              )}
            </div>
          </div>

          {/* Right Column - AI Status & Providers */}
          <div className="space-y-6">
            {/* AI Providers */}
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Providers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active connections</p>
              </div>
              <ProviderStatus providers={aiProviders} />
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Suggested Actions</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Quick shortcuts for common tasks</p>
          </div>
          <QuickActions actions={suggestedActions} />
        </div>

        {/* Workflow Shortcuts */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Cog className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automated tasks and routines</p>
          </div>
          <WorkflowShortcuts />
        </div>

        {/* Footer */}
        <div className="py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Product</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Company</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Legal</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lumo Browser v0.1.0 • Phase 3 Week 1
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400"> 2026 Lumo Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
