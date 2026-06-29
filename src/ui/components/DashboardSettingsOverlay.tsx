import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, Layout, Zap, Edit2, Plus, Clock, Search, Link2, Sparkles, Move } from 'lucide-react';

interface DashboardSettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  onSave: (newConfig: any) => void;
  isDark: boolean;
}

const THEMES = [
  { id: 'custom', label: 'Lumo Dynamic', color: '#8b5cf6', preview: 'linear-gradient(135deg, #0a0a0f, #1a0533)' },
  { id: 'black-and-white', label: 'Monochrome', color: '#ffffff', preview: 'linear-gradient(135deg, #000000, #1a1a1a)' },
  { id: 'crimson-red', label: 'Crimson Red', color: '#ef4444', preview: 'linear-gradient(135deg, #450a0a, #7f1d1d)' },
  { id: 'pink-heart', label: 'Pink Heart', color: '#ec4899', preview: 'linear-gradient(135deg, #500724, #9d174d)' },
];

export function DashboardSettingsOverlay({ isOpen, onClose, config, onSave, isDark }: DashboardSettingsOverlayProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'layout' | 'shortcuts'>('themes');
  const [localConfig, setLocalConfig] = useState(config);

  if (!isOpen) return null;

  const update = (updates: any) => {
    const next = { ...localConfig, ...updates };
    setLocalConfig(next);
    onSave(next);
  };

  const bg = isDark ? 'bg-[#0f0f15]' : 'bg-[#f8f9fa]';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const border = isDark ? 'border-white/10' : 'border-gray-200';
  const panelBg = isDark ? 'bg-white/5' : 'bg-white';

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in backdrop-blur-md bg-black/60">
      <div className={`w-full max-w-5xl m-auto h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex border ${border} ${bg} flex-col md:flex-row`}>
        
        {/* Sidebar */}
        <div className={`w-full md:w-64 border-r ${border} p-6 flex flex-col gap-2`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h2 className={`font-bold text-lg tracking-tight ${text}`}>Personalize</h2>
          </div>

          <button onClick={() => setActiveTab('themes')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
            ${activeTab === 'themes' ? 'bg-violet-600 text-white' : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'}`}>
            <ImageIcon className="w-4 h-4" /> Theme Gallery
          </button>
          
          <button onClick={() => setActiveTab('layout')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
            ${activeTab === 'layout' ? 'bg-violet-600 text-white' : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'}`}>
            <Layout className="w-4 h-4" /> Layout & Widgets
          </button>

          <button onClick={() => setActiveTab('shortcuts')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
            ${activeTab === 'shortcuts' ? 'bg-violet-600 text-white' : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'}`}>
            <Link2 className="w-4 h-4" /> Shortcuts Manager
          </button>

          <div className="mt-auto">
            <button onClick={onClose}
              className={`w-full py-3 rounded-xl font-bold transition-colors border ${border} ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'}`}>
              Done
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          <button onClick={onClose} className={`absolute top-6 right-6 p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>

          {activeTab === 'themes' && (
            <div className="animate-fade-in-up">
              <h3 className={`text-2xl font-bold mb-2 ${text}`}>Theme Gallery</h3>
              <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Choose a pre-built aesthetic or create your own.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => update({ theme: t.id, accentColor: t.color })}
                    className={`relative p-1 rounded-2xl border-2 transition-all ${localConfig.theme === t.id ? 'border-violet-500 scale-[1.02]' : 'border-transparent hover:border-white/20 hover:scale-[1.01]'}`}>
                    <div className="h-32 rounded-xl w-full" style={{ background: t.preview }} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                      <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">Apply Theme</span>
                    </div>
                    {localConfig.theme === t.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-lg">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className="mt-3 px-2 flex items-center justify-between">
                      <span className={`text-sm font-bold ${text}`}>{t.label}</span>
                      <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: t.color }} />
                    </div>
                  </button>
                ))}
              </div>

              <div className={`p-5 rounded-2xl border ${border} ${panelBg}`}>
                <h4 className={`text-sm font-bold mb-4 ${text}`}>Custom Wallpaper</h4>
                <div className="flex gap-3">
                  <input type="text" value={localConfig.bgImage || ''} onChange={e => update({ bgImage: e.target.value })}
                    placeholder="Paste direct image URL (e.g. Unsplash)"
                    className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none border transition-colors ${isDark ? 'bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'}`} />
                  {localConfig.bgImage && (
                    <button onClick={() => update({ bgImage: '' })} className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="animate-fade-in-up">
              <h3 className={`text-2xl font-bold mb-2 ${text}`}>Layout & Widgets</h3>
              <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Toggle the elements you want to see on your new tab page.</p>

              <div className="space-y-3">
                {[
                  { id: 'showClock', icon: Clock, label: 'Digital Clock', desc: 'Displays the current time and date in large typography.' },
                  { id: 'showSearch', icon: Search, label: 'Search Bar', desc: 'The central search input for web navigation.' },
                  { id: 'showShortcuts', icon: Link2, label: 'Quick Shortcuts', desc: 'Your saved quick-access links grid.' },
                  { id: 'showAITips', icon: Sparkles, label: 'AI Power Tips', desc: 'Helpful hints on how to use Lumo AI.' },
                ].map(w => (
                  <div key={w.id} className={`flex items-center justify-between p-4 rounded-2xl border ${border} ${panelBg} transition-all`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        <w.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${text}`}>{w.label}</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{w.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => update({ [w.id]: localConfig[w.id as keyof typeof localConfig] === false ? true : false })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${localConfig[w.id as keyof typeof localConfig] !== false ? 'bg-violet-500' : isDark ? 'bg-white/10' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${localConfig[w.id as keyof typeof localConfig] !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="animate-fade-in-up">
              <h3 className={`text-2xl font-bold mb-2 ${text}`}>Shortcuts Manager</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage the quick links that appear on your dashboard.</p>
              
              <div className={`p-8 rounded-2xl border border-dashed ${border} flex flex-col items-center justify-center text-center`}>
                <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  <Move className="w-6 h-6" />
                </div>
                <h4 className={`font-bold mb-2 ${text}`}>Shortcut Customizer</h4>
                <p className={`text-sm max-w-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  To add or remove shortcuts, click the "+" button directly on the New Tab Page. 
                  (Drag-and-drop reordering is coming in the next update!)
                </p>
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors">
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
