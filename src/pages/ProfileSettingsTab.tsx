import React, { useState, useRef } from 'react';
import { BrowserSettings, SettingSection, SettingRow } from './SettingsPage';
import { User, Plus, X, Trash2, Camera, Tag, Monitor, Cloud, Lock, Shield, MoreHorizontal, UserPlus } from 'lucide-react';

export function ProfileSettingsTab({
  settings,
  activeProfileId,
  onUpdateSettings,
}: {
  settings: BrowserSettings;
  activeProfileId: string;
  onUpdateSettings: (u: Partial<BrowserSettings>) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editingAvatarProfileId, setEditingAvatarProfileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const COMMON_AVATARS = [
    'https://api.dicebear.com/7.x/notionists/svg?seed=Work&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Personal&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Dev&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/notionists/svg?seed=School&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Finance&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Games&backgroundColor=ffd5dc',
  ];
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
      currentProfileId: newId, // switch to new
    });
    setNewProfileName('');
    setSelectedAvatar(COMMON_AVATARS[0]);
    setShowModal(false);
  };

  const handleSwitch = (id: string) => {
    window.dispatchEvent(new CustomEvent('lumo:switch-profile', { detail: id }));
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) return;
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    if (profiles.length <= 1) {
      setConfirmDeleteId(null);
      return;
    }
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const nextProfiles = profiles.filter(p => p.id !== id);
    onUpdateSettings({
      profiles: nextProfiles,
    });
    // Clean up per-profile localStorage data
    const keysToRemove = [
      `lumo-bookmarks-${id}`,
      `lumo-history-${id}`,
      `lumo-settings-${id}`,
      `lumo-downloads-${id}`,
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    // Tell main process to clear the persistent session partition
    if ((window as any).electron?.send) {
      (window as any).electron.send('lumo:clear-profile-partition', id);
    }
    // If we delete the active profile, switch to the first available one
    if (activeProfileId === id) {
      window.dispatchEvent(new CustomEvent('lumo:switch-profile', { detail: nextProfiles[0].id }));
    }
  };

  const handleCancelDelete = () => setConfirmDeleteId(null);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
          {/* Existing Profiles */}
          {profiles.map(profile => {
            const isActive = profile.id === activeProfileId;
            const image = profile.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(profile.name)}&backgroundColor=b6e3f4`;
            const title = profile.id === '1' || profile.id === 'default' ? 'Primary Workspace' : 'Secondary Profile';
            const isSecure = true; 
            const tags = ['User'];
            const tabs = Math.floor(Math.random() * 20) + 1;
            const syncStr = 'Synced';

            return (
              <div 
                key={profile.id} 
                className={`our-team group cursor-pointer border ${isActive ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-2 ring-blue-500' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                onClick={() => !isActive && handleSwitch(profile.id)}
              >
                {/* Active Badge */}
                {isActive && (
                  <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                    Current
                  </div>
                )}

                {/* Top Right Controls (Security & Menu) */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <button 
                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5 bg-white/50 dark:bg-black/20 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 disabled:opacity-0"
                    onClick={(e) => handleDelete(profile.id, e)}
                    title={profiles.length > 1 ? "Delete Profile" : "Cannot delete last profile"}
                    disabled={profiles.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                  {/* Custom Picture Area */}
                <div className="picture group/pic">
                  <div className="img-wrapper">
                    <img className="img-fluid" src={image} alt={profile.name} />
                    <button 
                      className="change-pic-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAvatarProfileId(profile.id);
                        fileInputRef.current?.click();
                      }}
                      title="Upload Custom Picture"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="team-content mt-4">
                  <div className="flex justify-center gap-1.5 mb-3 opacity-90">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="name dark:text-white">{profile.name}</h3>
                  <h4 className="title dark:text-blue-400">{title}</h4>
                </div>
                
                {/* Stats overlay (visible normally) */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-center gap-4 transition-opacity duration-300">
                  <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {tabs} tabs</span>
                  <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> {syncStr}</span>
                </div>
              </div>
            );
          })}

          {/* Add New Profile Card */}
          <div 
            className="our-team group cursor-pointer border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300"
            onClick={() => setShowModal(true)}
          >
            <div className="picture group/pic">
              <div className="img-wrapper flex items-center justify-center mx-auto bg-gray-50 dark:bg-[#1a1a1a] group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors duration-300" style={{ height: '130px', width: '130px' }}>
                <Plus className="w-12 h-12 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-125 transition-all duration-300" />
              </div>
            </div>
            <div className="team-content mt-4">
              <div className="flex justify-center gap-1.5 mb-3 opacity-90">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                  <Plus className="w-2.5 h-2.5" /> New
                </span>
              </div>
              <h3 className="name dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Add Workspace</h3>
              <h4 className="title dark:text-gray-400">Expand your setup</h4>
            </div>
            
            <ul className="social">
              <li className="w-full">
                <button className="flex items-center justify-center hover:text-white w-full gap-2">
                  <UserPlus className="w-5 h-5" /> Setup Now
                </button>
              </li>
            </ul>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || !editingAvatarProfileId) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              const updatedProfiles = profiles.map(p =>
                p.id === editingAvatarProfileId ? { ...p, avatarUrl: dataUrl } : p
              );
              onUpdateSettings({ profiles: updatedProfiles });
              setEditingAvatarProfileId(null);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
          }}
        />
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

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCancelDelete}>
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                All bookmarks, history, passwords, and cookies for this profile will be permanently deleted.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
