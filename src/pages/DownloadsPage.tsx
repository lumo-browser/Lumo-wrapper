/**
 * DownloadsPage — Lumo Browser internal downloads manager
 * Tracks active + completed downloads via IPC events from the main process.
 */

import React, { useState, useEffect } from 'react';
import {
  Download, X, File, Film, Music, Image as ImageIcon,
  Archive, Code2, FileText, CheckCircle2, AlertCircle, Loader2,
  Trash2, FolderOpen, ExternalLink,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  savePath: string;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  receivedBytes: number;
  totalBytes: number;
  startedAt: number;
  endedAt?: number;
  mimeType?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatSpeed(receivedBytes: number, startedAt: number): string {
  const elapsedSec = (Date.now() - startedAt) / 1000;
  if (elapsedSec < 0.5) return '';
  const bps = receivedBytes / elapsedSec;
  return `${formatBytes(bps)}/s`;
}

function formatDuration(startedAt: number, endedAt?: number): string {
  const ms = (endedAt ?? Date.now()) - startedAt;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  if (hrs > 0) return `${hrs}h ${min % 60}m ${sec % 60}s`;
  return `${min}m ${sec % 60}s`;
}

function formatTimestamp(date: number): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getFileIcon(filename: string, mimeType?: string): React.ReactElement {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mime = mimeType ?? '';

  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext) || mime.startsWith('video/'))
    return <Film className="w-6 h-6 text-purple-400" />;
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext) || mime.startsWith('audio/'))
    return <Music className="w-6 h-6 text-pink-400" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mime.startsWith('image/'))
    return <ImageIcon className="w-6 h-6 text-green-400" />;
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext))
    return <Archive className="w-6 h-6 text-yellow-400" />;
  if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'rs', 'go', 'json', 'xml', 'html', 'css'].includes(ext))
    return <Code2 className="w-6 h-6 text-blue-400" />;
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'pptx'].includes(ext))
    return <FileText className="w-6 h-6 text-orange-400" />;
  return <File className="w-6 h-6 text-gray-400" />;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, pct)}%`,
          background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
        }}
      />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
interface DownloadsPageProps {
  onNavigate?: (url: string) => void;
}

export function DownloadsPage({ onNavigate: _onNavigate }: DownloadsPageProps): React.ReactElement {
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('lumo-downloads') ?? '[]');
    } catch {
      return [];
    }
  });

  // Persist whenever downloads change
  useEffect(() => {
    localStorage.setItem('lumo-downloads', JSON.stringify(downloads));
  }, [downloads]);

  // Listen for IPC events pushed from main process via preload
  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron?.on) return;

    const onProgress = (_: unknown, item: DownloadItem) => {
      setDownloads(prev => {
        const exists = prev.find(d => d.id === item.id);
        if (exists) {
          return prev.map(d => d.id === item.id ? { ...d, ...item } : d);
        }
        return [item, ...prev];
      });
    };

    electron.on('lumo:download-progress', onProgress);
    return () => electron.removeListener?.('lumo:download-progress', onProgress);
  }, []);

  const clearAll = () => {
    setDownloads(prev => prev.filter(d => d.state === 'progressing'));
  };

  const removeItem = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  const openFile = (savePath: string) => {
    (window as any).electron?.send?.('lumo:open-file', savePath);
  };

  const showInFolder = (savePath: string) => {
    (window as any).electron?.send?.('lumo:show-item-in-folder', savePath);
  };

  const active   = downloads.filter(d => d.state === 'progressing');
  const finished = downloads.filter(d => d.state !== 'progressing');

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-gray-100 overflow-y-auto">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5
        bg-white/80 dark:bg-[#111]/80 backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Downloads</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {downloads.length === 0
                ? 'No downloads yet'
                : `${downloads.length} item${downloads.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {finished.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30
              text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400
              transition-all duration-150 border border-gray-200 dark:border-gray-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear completed
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-8 py-6 max-w-3xl mx-auto w-full">

        {/* Empty state */}
        {downloads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.12))' }}>
              <Download className="w-9 h-9 text-violet-500/70" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No downloads yet</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Files you download while browsing will appear here.
            </p>
          </div>
        )}

        {/* Active downloads */}
        {active.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-1">
              In Progress
            </p>
            <div className="flex flex-col gap-3">
              {active.map(item => {
                const pct = item.totalBytes > 0 ? (item.receivedBytes / item.totalBytes) * 100 : 0;
                const started = formatTimestamp(item.startedAt);
                return (
                  <div key={item.id}
                    className="flex items-start gap-4 p-4 rounded-2xl
                      bg-white dark:bg-[#1a1a1a]
                      border border-gray-200 dark:border-gray-800
                      shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                      bg-gray-100 dark:bg-gray-800">
                      {getFileIcon(item.filename, item.mimeType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate mb-0.5">{item.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
                        <span>{formatBytes(item.receivedBytes)}
                          {item.totalBytes > 0 && ` / ${formatBytes(item.totalBytes)}`}
                        </span>
                        {item.totalBytes > 0 && <span>·</span>}
                        {item.totalBytes > 0 && <span>{pct.toFixed(0)}%</span>}
                        <span>·</span>
                        <span>{formatSpeed(item.receivedBytes, item.startedAt)}</span>
                        <span>·</span>
                        <span>{started}</span>
                      </div>
                      <ProgressBar pct={pct} />
                    </div>

                    <button onClick={() => removeItem(item.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Cancel">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed/cancelled downloads */}
        {finished.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-1">
              {active.length > 0 ? 'Completed' : 'Recent Downloads'}
            </p>
            <div className="flex flex-col gap-2">
              {finished.map(item => {
                const ok = item.state === 'completed';
                return (
                  <div key={item.id}
                    className="group flex items-center gap-4 px-4 py-3 rounded-2xl
                      bg-white dark:bg-[#1a1a1a]
                      border border-gray-200 dark:border-gray-800
                      hover:border-violet-300 dark:hover:border-violet-700
                      transition-all duration-150 cursor-default">

                    <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                      bg-gray-100 dark:bg-gray-800">
                      {getFileIcon(item.filename, item.mimeType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {ok
                          ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          : <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        }
                        <span>{ok ? formatBytes(item.receivedBytes) : item.state}</span>
                        <span>·</span>
                        <span>{formatDuration(item.startedAt, item.endedAt)}</span>
                      </div>
                    </div>

                    {/* Action buttons — show on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {ok && (
                        <>
                          <button
                            onClick={() => openFile(item.savePath)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Open file">
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-violet-500" />
                          </button>
                          <button
                            onClick={() => showInFolder(item.savePath)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Show in folder">
                            <FolderOpen className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Remove">
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
