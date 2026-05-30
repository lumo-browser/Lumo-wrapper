/**
 * Root App component
 */

import React, { useEffect, useState } from 'react';
import { logger } from '@utils/logger';
import { AIPlannerPanel, StatusPanel, SettingsPanel } from '@ui/components';
import { HomePage } from './pages/HomePage';

const SCOPE = 'App';

type TabType = 'home' | 'planner' | 'status' | 'settings';

export default function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    logger.info(SCOPE, 'App mounted with dark mode');

    // Set dark mode as default
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    // Check for saved preference
    const savedTheme = localStorage.getItem('nova-browser-settings');
    if (savedTheme) {
      try {
        const settings = JSON.parse(savedTheme);
        const effectiveDark = settings.theme === 'light' ? false : true;
        setIsDark(effectiveDark);
        if (effectiveDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        logger.error(SCOPE, 'Failed to parse saved settings');
      }
    }
  }, []);

  const handleThemeChange = (theme: 'dark' | 'light') => {
    const isDarkMode = theme === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'planner', label: 'AI Planner', icon: '🤖' },
    { id: 'status', label: 'Status', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Browser</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered autonomous browser with planning</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-600 dark:text-gray-400">System Ready</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-4">
        <div className="flex-1 flex gap-4">
          {/* Left Panel - Content (wider) */}
          <div className="flex-1 min-w-0">
            {activeTab === 'home' && <HomePage />}
            {activeTab === 'planner' && <AIPlannerPanel />}
            {activeTab === 'status' && <StatusPanel />}
            {activeTab === 'settings' && <SettingsPanel onThemeChange={handleThemeChange} />}
            {activeTab === 'settings' && <SettingsPanel onThemeChange={handleThemeChange} />}
          </div>

          {/* Right Sidebar - Quick Info */}
          <div className="w-64 hidden lg:flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 p-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💡</span>
                Quick Info
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Features */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">✨ Available Features</h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✅ AI Goal Planning</li>
                  <li>✅ Action Decomposition</li>
                  <li>✅ Dependency Sequencing</li>
                  <li>✅ Confidence Scoring</li>
                  <li>✅ Error Detection</li>
                  <li>⏳ Browser Automation (Week 6)</li>
                  <li>⏳ Plan Verification (Week 6)</li>
                </ul>
              </div>

              {/* Tips */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">💭 Try These Goals</h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    "Navigate to Google and search for TypeScript"
                  </li>
                  <li className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    "Fill out the contact form"
                  </li>
                  <li className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    "Extract data from table"
                  </li>
                </ul>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">📈 System Stats</h4>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Services:</span>
                    <span className="font-medium text-gray-900 dark:text-white">7 Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phase:</span>
                    <span className="font-medium text-gray-900 dark:text-white">2 (Week 5)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tests:</span>
                    <span className="font-medium text-gray-900 dark:text-white">100+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage:</span>
                    <span className="font-medium text-gray-900 dark:text-white">80%+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Nova Browser v0.1.0 • Phase 2 Week 5 • AI Planning System • Made with ❤️
        </p>
      </footer>
    </div>
  );
}
