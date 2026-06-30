import { BrowserSettings, SettingSection, SettingRow, Toggle } from './SettingsPage';
import { Cpu } from 'lucide-react';

export function SystemSettingsTab({
  settings,
  onUpdateSettings,
}: {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <SettingSection title="System & Performance" icon={<Cpu className="w-4 h-4" />}>
        <SettingRow 
          label="Memory Saver" 
          description="Frees up memory from inactive tabs. This keeps Lumo fast and uses less RAM."
        >
          <Toggle 
            enabled={settings.memorySaver} 
            onChange={(v) => {
              onUpdateSettings({ memorySaver: v });
              if ((window as any).electron?.send) {
                (window as any).electron.send('lumo:set-memory-saver', v);
              }
            }} 
          />
        </SettingRow>
        
        <SettingRow 
          label="Hardware Acceleration" 
          description="Use hardware acceleration when available (requires restart)"
        >
          <Toggle 
            enabled={settings.hardwareAcceleration} 
            onChange={(v) => {
              onUpdateSettings({ hardwareAcceleration: v });
              if ((window as any).electron?.send && !v) {
                (window as any).electron.send('lumo:set-hardware-acceleration', v);
              }
            }} 
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
