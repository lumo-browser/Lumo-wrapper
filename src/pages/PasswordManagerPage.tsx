import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Trash2,
  Key,
  ExternalLink,
  X,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Lock,
  Shield,
} from 'lucide-react';
import { PasswordEntry } from '../types';

interface PasswordManagerPageProps {
  activeProfileId: string;
  onNavigate: (url: string) => void;
}

function generatePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = upper + lower + digits + special;
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 12; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function PasswordManagerPage({ activeProfileId, onNavigate }: PasswordManagerPageProps): React.ReactElement {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state for add/edit
  const [formUrl, setFormUrl] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

  useEffect(() => {
    loadVault();
  }, [activeProfileId]);

  async function loadVault() {
    setLoading(true);
    try {
      if (window.electron?.vaultGetAll) {
        const data = await window.electron.vaultGetAll(activeProfileId) as PasswordEntry[];
        setEntries(data || []);
      }
    } catch (err) {
      console.error('Failed to load password vault:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formUrl || !formUsername || !formPassword) return;
    const domain = extractDomain(formUrl);
    const entry: Partial<PasswordEntry> = {
      url: formUrl,
      domain,
      username: formUsername,
      password: formPassword,
      title: domain,
    };
    if (editEntry) {
      entry.id = editEntry.id;
    }
    try {
      if (window.electron?.vaultSave) {
        await window.electron.vaultSave(activeProfileId, entry);
      }
      await loadVault();
      closeForm();
    } catch (err) {
      console.error('Failed to save password entry:', err);
    }
  }

  async function handleDelete(id: string) {
    try {
      if (window.electron?.vaultDelete) {
        await window.electron.vaultDelete(activeProfileId, id);
      }
      await loadVault();
    } catch (err) {
      console.error('Failed to delete password entry:', err);
    } finally {
      setShowDeleteConfirm(null);
    }
  }

  function closeForm() {
    setShowAddModal(false);
    setEditEntry(null);
    setFormUrl('');
    setFormUsername('');
    setFormPassword('');
  }

  function openEdit(entry: PasswordEntry) {
    setEditEntry(entry);
    setFormUrl(entry.url);
    setFormUsername(entry.username);
    setFormPassword(entry.password);
    setShowAddModal(true);
  }

  function toggleVisible(id: string) {
    setVisibleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.domain.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q)
    );
  }, [entries, search]);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#333] bg-white dark:bg-[#252525]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Password Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search passwords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <button
            onClick={() => { setEditEntry(null); setFormUrl(''); setFormUsername(''); setFormPassword(''); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Password
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <Key className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">
              {search ? 'No matching passwords' : 'No saved passwords'}
            </p>
            <p className="text-sm">
              {search ? 'Try a different search term' : 'Passwords you save will appear here'}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-2">
            {filtered.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444] transition-colors group"
              >
                {/* Favicon */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${entry.domain}&sz=32`}
                    alt=""
                    className="w-5 h-5"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entry.domain}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.username}</p>
                </div>

                {/* Password */}
                <div className="flex items-center gap-2 text-sm font-mono min-w-0 max-w-[160px]">
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {visibleIds.has(entry.id) ? entry.password : '••••••••'}
                  </span>
                  <button
                    onClick={() => toggleVisible(entry.id)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                  >
                    {visibleIds.has(entry.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(entry.username)}
                    title="Copy username"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(entry.password)}
                    title="Copy password"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate(entry.url)}
                    title="Open site"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(entry)}
                    title="Edit"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(entry.id)}
                    title="Delete"
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-2xl p-6 w-96 border border-gray-200 dark:border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {editEntry ? 'Edit Password' : 'Add Password'}
              </h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="user@example.com"
                  value={formUsername}
                  onChange={e => setFormUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={() => setFormPassword(generatePassword())}
                    title="Generate strong password"
                    className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#444] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 transition-colors text-xs font-medium"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formUrl || !formUsername || !formPassword}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editEntry ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-2xl p-6 w-80 border border-gray-200 dark:border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete Password?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
