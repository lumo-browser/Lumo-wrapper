import React from 'react';
import { BrowserSettings, SettingSection, SettingRow, Toggle } from './SettingsPage';
import { Languages } from 'lucide-react';

export function LanguageSettingsTab({
  settings,
  onUpdateSettings,
}: {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <SettingSection title="Languages" icon={<Languages className="w-4 h-4" />}>
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-[#333]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Display Language</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Language used for Lumo Browser UI</p>
            </div>
            <select
              value={settings.uiLanguage}
              onChange={(e) => onUpdateSettings({ uiLanguage: e.target.value })}
              className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
        </div>
        
        <SettingRow 
          label="Offer to translate pages that aren't in a language I read" 
          description="Displays a translate icon in the address bar when viewing foreign websites"
        >
          <Toggle 
            enabled={settings.offerTranslate ?? true} 
            onChange={(v) => onUpdateSettings({ offerTranslate: v })} 
          />
        </SettingRow>

        <SettingRow 
          label="Spell Check" 
          description="Check for spelling errors when you type text on web pages"
        >
          <Toggle 
            enabled={settings.spellCheck} 
            onChange={(v) => {
              onUpdateSettings({ spellCheck: v });
              if ((window as any).electron?.send) {
                (window as any).electron.send('lumo:set-spell-check', v);
              }
            }} 
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
