import React from 'react';
import { BrowserSettings, SettingSection, SettingRow } from './SettingsPage';
import { User, Plus } from 'lucide-react';

export function ProfileSettingsTab({
  settings,
  onUpdateSettings,
}: {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <SettingSection title="Profiles & Users" icon={<User className="w-4 h-4" />}>
        {settings.profiles && settings.profiles.length > 0 ? (
          settings.profiles.map(p => (
            <SettingRow key={p.id} label={p.name} description="Browser Profile">
              <span className="text-xs text-blue-500">Active</span>
            </SettingRow>
          ))
        ) : (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#333] flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">No Extra Profiles</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
              You are using the default Lumo Browser profile. Add profiles to separate browsing data.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Profile
            </button>
          </div>
        )}
      </SettingSection>
    </div>
  );
}
