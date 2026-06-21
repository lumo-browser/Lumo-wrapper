import React, { useState } from 'react';
import { BrowserSettings, SettingSection, SettingRow } from './SettingsPage';
import { User, Plus, X, Check, Trash2 } from 'lucide-react';

export function ProfileSettingsTab({
  settings,
  onUpdateSettings,
}: {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  
  const COMMON_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robo',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Smile',
    'https://api.dicebear.com/7.x/micah/svg?seed=Jude',
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(COMMON_AVATARS[0]);

  const currentProfileId = settings.currentProfileId || 'default';
  const profiles = settings.profiles && settings.profiles.length > 0
    ? settings.profiles
    : [{ id: 'default', name: 'Default User', avatarUrl: '' }];

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const newId = `profile-${Date.now()}`;
    onUpdateSettings({
      profiles: [...profiles, { id: newId, name: newProfileName.trim(), avatarUrl: selectedAvatar }],
      currentProfileId: newId, // switch to new
    });
    setNewProfileName('');
    setSelectedAvatar(COMMON_AVATARS[0]);
    setShowModal(false);
  };

  const handleSwitch = (id: string) => {
    onUpdateSettings({ currentProfileId: id });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) return;
    const nextProfiles = profiles.filter(p => p.id !== id);
    onUpdateSettings({
      profiles: nextProfiles,
      currentProfileId: currentProfileId === id ? nextProfiles[0].id : currentProfileId,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <SettingSection title="Profiles & Users" icon={<User className="w-4 h-4" />}>
        
        <div className="p-4 bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-100 dark:border-[#333] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Browser Profiles</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Separate your browsing data for work, school, or personal use.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Profile
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-[#333]">
          {profiles.map(p => {
            const isActive = p.id === currentProfileId;
            return (
              <div 
                key={p.id} 
                onClick={() => !isActive && handleSwitch(p.id)}
                className={`flex items-center justify-between px-6 py-4 transition-colors ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer'}`}
              >
                <div className="flex items-center gap-4">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {p.name}
                      {isActive && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 tracking-wide">Active</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Local browser profile</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button 
                      onClick={() => handleSwitch(p.id)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] rounded-md transition-colors"
                    >
                      Switch to {p.name}
                    </button>
                  )}
                  {profiles.length > 1 && !isActive && (
                    <button 
                      onClick={(e) => handleDelete(p.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SettingSection>

      {/* Add Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add new profile</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProfile} className="p-5">
              <div className="flex justify-center mb-6">
                <img src={selectedAvatar} alt="Selected Avatar" className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 object-cover" />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose an Avatar
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {COMMON_AVATARS.map(url => (
                    <img 
                      key={url} 
                      src={url} 
                      alt="Avatar preset" 
                      onClick={() => setSelectedAvatar(url)}
                      className={`w-10 h-10 rounded-full cursor-pointer transition-all ${selectedAvatar === url ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
              
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Profile Name
              </label>
              <input
                autoFocus
                type="text"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="e.g. Work, Personal"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
              />
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
