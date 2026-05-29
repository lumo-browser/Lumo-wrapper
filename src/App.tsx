/**
 * Root App component
 */

import React, { useEffect } from 'react';
import { logger } from '@utils/logger';

const SCOPE = 'App';

export default function App(): React.ReactElement {
  useEffect(() => {
    logger.info(SCOPE, 'App mounted');
  }, []);

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Browser</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered browser for intelligent browsing</p>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Nova Browser
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Your AI-powered browser is starting up. Features will be available soon.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  🚀 Phase 1 Foundation in progress
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100">
                  ✨ Check back soon for browser UI, AI sidebar, and automation features
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Nova Browser v0.1.0 • Made with ❤️ by the Nova team
        </p>
      </footer>
    </div>
  );
}
