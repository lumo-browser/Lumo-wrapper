import React, { useState } from 'react';
import { 
  X, Settings, RefreshCw, LogOut, Shield, 
  Plus, Monitor, HardDrive, Key, Cloud, 
  UserPlus, Fingerprint, Lock, Camera, 
  MoreHorizontal
} from 'lucide-react';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface BrowserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  tabs?: number;
  sync?: string;
  isSecure?: boolean;
  tags?: string[];
}

interface AccountModalProps {
  isOpen: boolean;
  activeProfileId: string;
  profiles: BrowserProfile[];
  onSwitchProfile: (id: string) => void;
  onAddProfileClick?: () => void;
  onClose: () => void;
}

export function AccountModal({ isOpen, activeProfileId, profiles, onSwitchProfile, onAddProfileClick, onClose }: AccountModalProps): React.ReactElement | null {
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    setIsSyncing(profileId);
    setTimeout(() => {
      setIsSyncing(null);
    }, 1500);
  };

  const handleNavigate = (url: string) => {
    const electron = (window as any).electron;
    if (electron?.send) {
      electron.send('lumo:navigate', url);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#1e1e1e] w-[95vw] max-w-6xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-[#3a3a3a] overflow-hidden flex flex-col slide-up relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-200 dark:border-[#3a3a3a] bg-gray-50/50 dark:bg-[#252525]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select a Profile</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Keep your work, personal, and development spaces organized.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profiles Grid */}
        <div className="p-10 bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Existing Profiles */}
            {profiles.map((profile) => {
              const isActive = activeProfileId === profile.id;
              
              // Fallbacks if stats are missing
              const image = profile.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(profile.name)}&backgroundColor=b6e3f4`;
              const title = profile.id === '1' || profile.id === 'default' ? 'Primary Workspace' : 'Secondary Profile';
              const isSecure = profile.isSecure !== false; // default true
              const tags = profile.tags || ['User'];
              const tabs = profile.tabs || Math.floor(Math.random() * 20) + 1;
              const syncStr = profile.sync || 'Synced';

              return (
                <div 
                  key={profile.id} 
                  className={`our-team group cursor-pointer ${isActive ? 'ring-4 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                  onClick={() => onSwitchProfile(profile.id)}
                >
                  {/* Active Badge */}
                  {isActive && (
                    <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                      Current
                    </div>
                  )}

                  {/* Top Right Controls (Security & Menu) */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    {isSecure ? (
                      <div title="Secure Connection"><Lock className="w-4 h-4 text-green-500/80 drop-shadow-sm" /></div>
                    ) : (
                      <div title="Insecure Elements"><Shield className="w-4 h-4 text-orange-400/80 drop-shadow-sm" /></div>
                    )}
                    <button 
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1 bg-white/50 dark:bg-black/20 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); /* Open profile menu */ }}
                      title="More Options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Custom Picture Area */}
                  <div className="picture group/pic">
                    <div className="img-wrapper">
                      <img className="img-fluid" src={image} alt={profile.name} />
                      <button 
                        className="change-pic-btn"
                        onClick={(e) => { e.stopPropagation(); /* Handle image upload */ }}
                        title="Upload Custom Picture"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="team-content">
                    {/* Tags */}
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
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-center gap-4 transition-opacity duration-300 group-hover:opacity-0">
                    <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {tabs} tabs</span>
                    <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> {syncStr}</span>
                  </div>

                  {/* Social / Action Links (on hover) */}
                  <ul className="social">
                    <li>
                      <button 
                        className="flex items-center justify-center hover:text-white" 
                        title="Profile Settings"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`flex items-center justify-center hover:text-white ${isSyncing === profile.id ? 'animate-spin' : ''}`}
                        title="Force Sync"
                        onClick={(e) => handleSync(e, profile.id)}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </li>
                    <li>
                      <button 
                        className="flex items-center justify-center hover:text-white"
                        title="Privacy & Security"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Fingerprint className="w-5 h-5" />
                      </button>
                    </li>
                    <li>
                      <button 
                        className="flex items-center justify-center hover:text-white"
                        title="Sign Out"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </li>
                  </ul>
                </div>
              );
            })}

            {/* Add New Profile Card */}
            <div 
              className="our-team group cursor-pointer border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300"
              onClick={() => { 
                if (onAddProfileClick) {
                  onAddProfileClick();
                } else {
                  handleNavigate('lumo://settings?tab=profiles');
                }
              }}
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
        </div>

        {/* Global Quick Actions Footer */}
        <div className="bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#3a3a3a] px-10 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-4">
              <button 
                onClick={() => handleNavigate('lumo://settings?tab=profiles')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
              >
                <Settings className="w-4 h-4" /> Manage Profiles
              </button>
              <button 
                onClick={() => handleNavigate('lumo://passwords')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
              >
                <Key className="w-4 h-4" /> Passwords
              </button>
              <button 
                onClick={() => handleNavigate('lumo://settings?tab=sync')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
              >
                <HardDrive className="w-4 h-4" /> Sync Data
              </button>
            </div>
            
            <button 
              onClick={() => {
                const electron = (window as any).electron;
                if (electron?.send) {
                  electron.send('lumo:new-disposable-window');
                }
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
            >
              <Shield className="w-4 h-4" /> Browse as Guest
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
