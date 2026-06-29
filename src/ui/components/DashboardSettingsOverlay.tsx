import { X, Check, Image as ImageIcon, Layout, Zap, Edit2, Plus, Clock, Search, Link2, Sparkles, Move, Code2, Globe } from 'lucide-react';

interface DashboardSettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  onSave: (newConfig: any) => void;
  isDark: boolean;
}

const DEFAULT_SHORTCUTS = [
  { id: 's1', label: 'YouTube',  url: 'https://youtube.com',       icon: 'Youtube',     color: '#ef4444' },
  { id: 's2', label: 'GitHub',   url: 'https://github.com',        icon: 'Github',      color: '#6366f1' },
  { id: 's3', label: 'Trending', url: 'https://trends.google.com', icon: 'TrendingUp',  color: '#10b981' },
  { id: 's4', label: 'News',     url: 'https://news.google.com',   icon: 'Newspaper',   color: '#3b82f6' },
  { id: 's5', label: 'Dev.to',   url: 'https://dev.to',            icon: 'Code2',       color: '#8b5cf6' },
  { id: 's6', label: 'Amazon',   url: 'https://amazon.in',         icon: 'ShoppingBag', color: '#f59e0b' },
];

const THEMES = [
  { id: 'custom', label: 'Lumo Dynamic', color: '#8b5cf6', preview: 'linear-gradient(135deg, #0a0a0f, #1a0533)' },
  { id: 'black-and-white', label: 'Monochrome', color: '#ffffff', preview: 'linear-gradient(135deg, #000000, #1a1a1a)' },
  { id: 'crimson-red', label: 'Crimson Red', color: '#ef4444', preview: 'linear-gradient(135deg, #450a0a, #7f1d1d)' },
  { id: 'pink-heart', label: 'Pink Heart', color: '#ec4899', preview: 'linear-gradient(135deg, #500724, #9d174d)' },
  { id: 'japan-cherry-blossom', label: 'Cherry Blossom', color: '#fca5a5', preview: 'url(https://raw.githubusercontent.com/BlackStar1991/Pictures-for-sharing-/master/Japan/bg.png)' },
  { id: 'brain-network', label: 'Social Network', color: '#3b82f6', preview: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)' },
];

export function DashboardSettingsOverlay({ isOpen, onClose, config, onSave, isDark }: DashboardSettingsOverlayProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'layout' | 'shortcuts' | 'code'>('themes');
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [fileError, setFileError] = useState('');

  const [shortcuts, setShortcuts] = useState<any[]>(() => {
    try { const s = localStorage.getItem('lumo-shortcuts-v2'); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return DEFAULT_SHORTCUTS;
  });
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      if (img.width < 1280 || img.height < 720) {
        setFileError(`Image is ${img.width}x${img.height}. Minimum 1280x720 recommended for wallpapers.`);
      }
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        update({ bgImage: evt.target?.result as string });
      };
      reader.onerror = () => setFileError('Failed to process image.');
      reader.readAsDataURL(file);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setFileError('Invalid image file.');
      URL.revokeObjectURL(url);
    };
  };

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

          <button onClick={() => setActiveTab('code')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
            ${activeTab === 'code' ? 'bg-violet-600 text-white' : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'}`}>
            <Code2 className="w-4 h-4" /> Developer Mode
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
                {[...THEMES, ...(localConfig.savedThemes || []).map((t: any) => ({
                  id: t.id, label: t.label, color: '#3b82f6', preview: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', isSaved: true
                }))].map(t => (
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
                      {t.isSaved ? (
                        <Code2 className="w-4 h-4 text-white/50" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: t.color }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className={`p-5 rounded-2xl border ${border} ${panelBg}`}>
                <h4 className={`text-sm font-bold mb-2 ${text}`}>Custom Wallpaper</h4>
                <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Upload a local image/GIF or paste a URL.</p>
                
                {fileError && <p className="text-red-500 text-xs mb-3 font-bold">{fileError}</p>}
                
                <div className="flex gap-3 items-center">
                  <label className={`cursor-pointer px-4 py-3 rounded-xl text-sm font-bold transition-all border ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-800 hover:bg-gray-50'}`}>
                    Upload File
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <span className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>OR</span>
                  <input type="text" value={localConfig.bgImage || ''} onChange={e => update({ bgImage: e.target.value })}
                    placeholder="Paste direct URL..."
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
              
              <div className={`p-5 mb-6 rounded-2xl border ${border} ${panelBg}`}>
                <div className="flex gap-3">
                  <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                    placeholder="Label (e.g. Reddit)"
                    className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none border transition-colors ${isDark ? 'bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'}`} />
                  <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)}
                    placeholder="URL (e.g. reddit.com)"
                    className={`flex-[2] px-4 py-3 rounded-xl text-sm outline-none border transition-colors ${isDark ? 'bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'}`} />
                  <button onClick={() => {
                    if (!newLabel.trim() || !newUrl.trim()) return;
                    let url = newUrl.trim();
                    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
                    const next = [...shortcuts, { id: `s-${Date.now()}`, label: newLabel.trim(), url, icon: 'Globe', color: '#6366f1' }];
                    setShortcuts(next);
                    localStorage.setItem('lumo-shortcuts-v2', JSON.stringify(next));
                    window.dispatchEvent(new Event('lumo:dashboard-config-updated'));
                    setNewLabel(''); setNewUrl('');
                  }} className="px-5 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold transition-colors hover:bg-violet-700">
                    Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {shortcuts.map(s => (
                  <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border ${border} ${panelBg}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}22` }}>
                        <Globe className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-sm font-bold truncate ${text}`}>{s.label}</span>
                        <span className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.url}</span>
                      </div>
                    </div>
                    <button onClick={() => {
                      const next = shortcuts.filter(x => x.id !== s.id);
                      setShortcuts(next);
                      localStorage.setItem('lumo-shortcuts-v2', JSON.stringify(next));
                      window.dispatchEvent(new Event('lumo:dashboard-config-updated'));
                    }} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="animate-fade-in-up flex flex-col h-full">
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${text}`}>Custom Code Theme</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Build your own dynamic wallpaper using HTML, CSS, and JS.
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {isSaving ? (
                    <div className="flex gap-2 animate-fade-in">
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Theme name..." 
                        value={themeName} 
                        onChange={e => setThemeName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && themeName.trim()) {
                            const newTheme = {
                              id: `saved-${Date.now()}`, label: themeName.trim(),
                              customHtml: localConfig.customHtml, customCss: localConfig.customCss, customJs: localConfig.customJs
                            };
                            const saved = localConfig.savedThemes || [];
                            update({ savedThemes: [...saved, newTheme], theme: newTheme.id });
                            setIsSaving(false);
                            setThemeName('');
                          } else if (e.key === 'Escape') {
                            setIsSaving(false);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs outline-none border transition-colors ${isDark ? 'bg-black/30 border-white/20 text-white focus:border-violet-500' : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'}`}
                      />
                      <button onClick={() => {
                        if (!themeName.trim()) { setIsSaving(false); return; }
                        const newTheme = {
                          id: `saved-${Date.now()}`, label: themeName.trim(),
                          customHtml: localConfig.customHtml, customCss: localConfig.customCss, customJs: localConfig.customJs
                        };
                        const saved = localConfig.savedThemes || [];
                        update({ savedThemes: [...saved, newTheme], theme: newTheme.id });
                        setIsSaving(false);
                        setThemeName('');
                      }}
                        className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700">
                        Save
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setIsSaving(true)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-800 hover:bg-gray-50'}`}>
                      Save to Gallery
                    </button>
                  )}
                  <button onClick={() => update({ theme: 'custom-code' })}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${localConfig.theme === 'custom-code' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
                    {localConfig.theme === 'custom-code' ? 'Active' : 'Apply Draft'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1 min-h-[400px]">
                <div className="flex flex-col gap-2">
                  <label className={`text-xs font-bold ${text}`}>HTML</label>
                  <textarea value={localConfig.customHtml || ''} onChange={e => update({ customHtml: e.target.value })}
                    className={`flex-1 p-3 rounded-xl text-xs font-mono resize-none outline-none border ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'}`}
                    placeholder="<div>Hello World</div>" spellCheck={false} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={`text-xs font-bold ${text}`}>CSS</label>
                  <textarea value={localConfig.customCss || ''} onChange={e => update({ customCss: e.target.value })}
                    className={`flex-1 p-3 rounded-xl text-xs font-mono resize-none outline-none border ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'}`}
                    placeholder="body { background: red; }" spellCheck={false} />
                </div>
                <div className="col-span-2 flex flex-col gap-2 h-40">
                  <label className={`text-xs font-bold ${text}`}>JavaScript</label>
                  <textarea value={localConfig.customJs || ''} onChange={e => update({ customJs: e.target.value })}
                    className={`flex-1 p-3 rounded-xl text-xs font-mono resize-none outline-none border ${isDark ? 'bg-black/30 border-white/10 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'}`}
                    placeholder="console.log('Running custom script...');" spellCheck={false} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
