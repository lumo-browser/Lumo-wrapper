import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BrowserSettings } from '../../pages/SettingsPage';

const COMMON_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Work&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Personal&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Dev&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=School&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Finance&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Games&backgroundColor=ffd5dc',
];

export function AddProfileModal({
  settings,
  onUpdateSettings,
  onClose,
}: {
  settings: BrowserSettings;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
  onClose: () => void;
}) {
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(COMMON_AVATARS[0]);

  const profiles = settings.profiles && settings.profiles.length > 0
    ? settings.profiles
    : [{ id: '1', name: 'Default User', avatarUrl: '' }];

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const newId = `profile-${Date.now()}`;
    onUpdateSettings({
      profiles: [...profiles, { id: newId, name: newProfileName.trim(), avatarUrl: selectedAvatar }],
    });
    // Immediately switch to it
    window.dispatchEvent(new CustomEvent('lumo:switch-profile', { detail: newId }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 pointer-events-none" />

        <div className="relative flex items-center justify-between px-6 py-5 border-b border-gray-100/50 dark:border-white/5">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Workspace</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Set up a new isolated profile</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleAddProfile} className="relative p-6">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
              <img src={selectedAvatar} alt="Selected Avatar" className="relative w-24 h-24 rounded-full bg-white dark:bg-[#252525] border-4 border-white dark:border-[#2a2a2a] object-cover shadow-xl" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Select Avatar
            </label>
            <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {COMMON_AVATARS.map(url => (
                <div 
                  key={url}
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative cursor-pointer transition-all duration-300 rounded-full p-1 ${selectedAvatar === url ? 'bg-gradient-to-tr from-blue-500 to-purple-500 scale-110 shadow-lg' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                >
                  <img 
                    src={url} 
                    alt="Preset" 
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2a2a2a]"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Workspace Name
            </label>
            <input
              autoFocus
              type="text"
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              placeholder="e.g. Work, Personal, Development"
              className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newProfileName.trim()}
              className="w-2/3 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
