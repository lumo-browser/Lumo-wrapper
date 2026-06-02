/**
 * Settings Panel Component
 * Configure browser preferences and theme
 */

import React, { useState, useEffect } from 'react';
import { logger } from '@utils/logger';

const SCOPE = 'SettingsPanel';

interface Settings {
  theme: 'dark' | 'light' | 'auto';
  autoExecute: boolean;
  debugMode: boolean;
  showLogs: boolean;
  autoSave: boolean;
}

interface SettingsPanelProps {
  onThemeChange?: (theme: 'dark' | 'light') => void;
}

export function SettingsPanel({ onThemeChange }: SettingsPanelProps): React.ReactElement {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    autoExecute: false,
    debugMode: false,
    showLogs: false,
    autoSave: true,
  });

  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('Lumo-browser-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } catch (e) {
        logger.error(SCOPE, 'Failed to parse saved settings');
      }
    }
  }, []);

  const handleSettingChange = (key: keyof Settings, value: unknown) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      // Save to localStorage
      localStorage.setItem('Lumo-browser-settings', JSON.stringify(updated));
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);

      // Handle theme change
      if (key === 'theme' && onThemeChange) {
        const theme = value as 'dark' | 'light' | 'auto';
        const effectiveTheme = theme === 'auto' ? 'dark' : theme;
        onThemeChange(effectiveTheme);
      }

      return updated;
    });
  };

  const ToggleSetting = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string;
    description: string;
    value: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div>
        <p className="font-medium text-sm text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`ml-3 relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
          value
            ? 'bg-green-600 dark:bg-green-600'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
          style={{ marginTop: '2px' }}
        />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 p-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Settings
        </h2>
        <p className="text-xs text-indigo-100 mt-1">Configure browser preferences</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Theme Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Appearance</h3>
          <div className="space-y-2">
            {(['dark', 'light', 'auto'] as const).map((theme) => (
              <label
                key={theme}
                className="flex items-center p-3 cursor-pointer bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={settings.theme === theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                />
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {theme === 'auto' ? 'Auto (System)' : `${theme.charAt(0).toUpperCase()}${theme.slice(1)} Mode`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Execution Settings */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Execution</h3>
          <div className="space-y-3">
            <ToggleSetting
              label="Auto-execute Plans"
              description="Automatically execute plans when created"
              value={settings.autoExecute}
              onChange={(val) => handleSettingChange('autoExecute', val)}
            />
            <ToggleSetting
              label="Auto-save Plans"
              description="Automatically save executed plans to history"
              value={settings.autoSave}
              onChange={(val) => handleSettingChange('autoSave', val)}
            />
          </div>
        </div>

        {/* Development Settings */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Development</h3>
          <div className="space-y-3">
            <ToggleSetting
              label="Debug Mode"
              description="Show detailed execution logs and errors"
              value={settings.debugMode}
              onChange={(val) => handleSettingChange('debugMode', val)}
            />
            <ToggleSetting
              label="Show Logs"
              description="Display console logs in browser"
              value={settings.showLogs}
              onChange={(val) => handleSettingChange('showLogs', val)}
            />
          </div>
        </div>

        {/* Status Message */}
        {settingsSaved && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">Settings saved successfully</p>
          </div>
        )}

        {/* Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">About Lumo Browser</p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Version: 0.1.0</li>
              <li>• Phase: 2 Week 5 (Planning Layer)</li>
              <li>• AI Services: 7 agents</li>
              <li>• Status: Development</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
