import React from 'react';
import { BrowserSettings, SettingSection, SettingRow, Toggle } from './SettingsPage';
import { Download, FolderOpen } from 'lucide-react';

export function DownloadSettingsTab({
  settings,
  onUpdateSettings,
}: {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}) {
  const handleSelectFolder = async () => {
    if ((window as any).electron?.invoke) {
      const folderPath = await (window as any).electron.invoke('lumo:pick-download-folder');
      if (folderPath) {
        onUpdateSettings({ downloadLocation: folderPath });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <SettingSection title="Downloads" icon={<Download className="w-4 h-4" />}>
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-[#333]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Location</p>
            <button
              onClick={handleSelectFolder}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-[#3a3a3a] hover:bg-gray-200 dark:hover:bg-[#444] text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Change...
            </button>
          </div>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{settings.downloadLocation}</p>
        </div>
        
        <SettingRow 
          label="Ask where to save each file before downloading" 
          description="If disabled, files will automatically download to the location above"
        >
          <Toggle 
            enabled={settings.askBeforeDownloading} 
            onChange={(v) => onUpdateSettings({ askBeforeDownloading: v })} 
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
