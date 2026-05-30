/**
 * AISidebar — Browser-native AI panel (BYOA model)
 *
 * No Nova account required.
 * User connects their own AI provider (OpenAI, Claude, Gemini, etc.)
 * Messages are sent directly from the browser to the provider's API.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Loader2,
  Copy,
  FileText,
  Search,
  Zap,
  BookOpen,
  Settings2,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { useAIProviderStore } from '../../store/ai-provider.store';
import { sendToProvider, type ChatMessage } from '../../services/ai-provider.service';
import { getProvider } from '../../types/ai-provider.types';
import { AIProviderSetup } from './AIProviderSetup';
import { logger } from '@utils/logger';

const SCOPE = 'AISidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

const QUICK_PROMPTS = [
  { icon: FileText, label: 'Summarize',   prompt: 'Summarize the main content of the current page in clear bullet points.' },
  { icon: Search,   label: 'Research',    prompt: 'Research this topic and provide a structured, detailed report.' },
  { icon: Zap,      label: 'Plan task',   prompt: 'Help me plan and automate a browser task step by step.' },
  { icon: BookOpen, label: 'Key points',  prompt: 'Extract the key facts and important data from the current page.' },
];

const SYSTEM_PROMPT = `You are Nova, an intelligent browser assistant. You help users
research topics, summarize web pages, plan tasks, extract information, and automate
browser workflows. Be concise, accurate, and helpful. When relevant, structure your
responses clearly.`;

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  pageTitle: string;
}

export function AISidebar({ isOpen, onClose, currentUrl, pageTitle }: AISidebarProps): React.ReactElement | null {
  const { activeProvider, getActiveKey, status } = useAIProviderStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  const hasProvider = status === 'connected' && !!activeProvider;

  // Auto-scroll + focus
  useEffect(() => {
    if (isOpen && view === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (hasProvider) setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [messages, isOpen, view, hasProvider]);

  // Reset to chat when provider connects
  useEffect(() => {
    if (hasProvider && view === 'settings') {
      setView('chat');
    }
  }, [hasProvider]);

  if (!isOpen) return null;

  const activeProviderDef = activeProvider ? getProvider(activeProvider.providerId) : null;

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing || !hasProvider) return;

    const apiKey = getActiveKey();
    if (!apiKey || !activeProvider) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    const loadingMsg: Message = {
      id: `l-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsProcessing(true);

    // Build context-aware messages
    const historyMsgs: ChatMessage[] = messages
      .filter((m) => !m.isLoading && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    const contextNote = currentUrl
      ? `\n\nCurrent page: ${pageTitle || 'Unknown'} (${currentUrl})`
      : '';

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextNote },
      ...historyMsgs,
      { role: 'user', content: trimmed },
    ];

    abortRef.current = new AbortController();

    try {
      const result = await sendToProvider(
        activeProvider.providerId,
        apiKey,
        activeProvider.model,
        apiMessages,
        abortRef.current.signal
      );

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.filter((m) => !m.isLoading).concat(assistantMsg));
      logger.info(SCOPE, 'Response received', { provider: activeProvider.providerId, model: result.model });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => prev.filter((m) => !m.isLoading).concat(errMsg));
      logger.error(SCOPE, 'Provider request failed');
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
    }
  }, [isProcessing, hasProvider, getActiveKey, activeProvider, messages, currentUrl, pageTitle]);

  const handleStop = () => {
    abortRef.current?.abort();
    setMessages((prev) => prev.filter((m) => !m.isLoading));
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const copyText = (text: string) => navigator.clipboard.writeText(text).catch(() => {});
  const clearChat = () => setMessages([]);

  return (
    <div className="slide-in-right flex flex-col w-80 h-full bg-white dark:bg-[#242424]
      border-l border-gray-200 dark:border-[#3a3a3a] flex-shrink-0 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2.5
        border-b border-gray-200 dark:border-[#3a3a3a] flex-shrink-0">

        {/* Left: Provider selector */}
        <button
          onClick={() => setShowProviderMenu((v) => !v)}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
        >
          {activeProviderDef ? (
            <>
              <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${activeProviderDef.gradient}
                flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                {activeProviderDef.name[0]}
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {activeProviderDef.name}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Nova AI</span>
            </>
          )}
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="w-7 h-7 rounded-full flex items-center justify-center
                text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setView(view === 'settings' ? 'chat' : 'settings')}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
              ${view === 'settings'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
              }`}
            title="Manage AI providers"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center
              text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Provider quick-switch menu */}
      {showProviderMenu && (
        <ProviderQuickMenu onClose={() => setShowProviderMenu(false)} onManage={() => { setView('settings'); setShowProviderMenu(false); }} />
      )}

      {/* ── Settings / Provider Setup ── */}
      {view === 'settings' ? (
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          <AIProviderSetup onDone={() => setView('chat')} />
        </div>
      ) : (
        <>
          {/* ── No provider connected ── */}
          {!hasProvider ? (
            <div className="flex-1 flex flex-col items-center justify-center px-5 text-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600
                flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Connect your AI</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Use ChatGPT, Claude, Gemini, or any supported provider with your own API key. No Nova account needed.
                </p>
              </div>
              <button
                onClick={() => setView('settings')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold
                  rounded-xl transition-colors shadow-sm"
              >
                Choose a provider
              </button>
            </div>
          ) : (
            <>
              {/* ── Quick prompts (shown when chat is empty) ── */}
              {messages.length === 0 && (
                <div className="px-3 pt-3 pb-1 flex-shrink-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_PROMPTS.map((qp) => {
                      const Icon = qp.icon;
                      return (
                        <button
                          key={qp.label}
                          onClick={() => sendMessage(qp.prompt)}
                          className="flex items-center gap-2 px-3 py-2.5 text-left rounded-xl
                            bg-gray-50 dark:bg-[#2d2d2d]
                            hover:bg-blue-50 dark:hover:bg-[#1e3a5f]/40
                            text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300
                            border border-gray-200 dark:border-[#3a3a3a] hover:border-blue-200 dark:hover:border-blue-800
                            transition-all duration-150"
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium leading-tight">{qp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
                {messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} onCopy={copyText} />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* ── Input ── */}
              <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-[#3a3a3a] flex-shrink-0">
                <div className="flex items-end gap-2 px-3 py-2 rounded-xl
                  bg-gray-100 dark:bg-[#2d2d2d]
                  focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    disabled={isProcessing}
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100
                      placeholder-gray-400 outline-none resize-none max-h-28 scrollbar-none"
                    style={{ lineHeight: '1.5rem' }}
                  />
                  <button
                    onClick={isProcessing ? handleStop : () => sendMessage(input)}
                    disabled={!isProcessing && !input.trim()}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                      text-white transition-colors
                      bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                      disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    {isProcessing
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
                <p className="text-[10px] text-center mt-1.5 text-gray-400 dark:text-gray-600">
                  {activeProviderDef?.name} · {activeProvider?.model}
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Provider quick-switch ──────────────────────────────────────────────────
function ProviderQuickMenu({ onClose, onManage }: { onClose: () => void; onManage: () => void }): React.ReactElement {
  const { connections, activeProvider, setActive } = useAIProviderStore();
  const connected = Object.values(connections);

  return (
    <div className="border-b border-gray-200 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#1e1e1e] flex-shrink-0">
      {connected.length === 0 ? (
        <div className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">No providers connected.</div>
      ) : (
        <div className="py-1">
          {connected.map((conn) => {
            const def = getProvider(conn.providerId);
            const isActive = activeProvider?.providerId === conn.providerId;
            return (
              <button
                key={conn.providerId}
                onClick={() => { setActive(conn.providerId); onClose(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#2d2d2d]'}`}
              >
                <div className={`w-5 h-5 rounded bg-gradient-to-br ${def.gradient}
                  flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                  {def.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{def.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{conn.model}</p>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={onManage}
        className="w-full px-3 py-2 text-xs text-blue-600 dark:text-blue-400 text-left
          hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors border-t border-gray-200 dark:border-[#3a3a3a]"
      >
        Manage providers
      </button>
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────────────
function Bubble({ msg, onCopy }: { msg: Message; onCopy: (s: string) => void }): React.ReactElement {
  const isUser = msg.role === 'user';

  if (msg.isLoading) {
    return (
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600
          flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 dark:bg-[#2d2d2d] rounded-2xl rounded-tl-sm">
          {[0, 150, 300].map((d) => (
            <div key={d} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
        ${isUser ? 'bg-gray-200 dark:bg-[#3a3a3a]' : 'bg-gradient-to-br from-blue-500 to-violet-600'}`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          : <Bot className="w-3.5 h-3.5 text-white" />
        }
      </div>

      <div className={`group max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
        <div className={`px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap rounded-2xl
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : msg.error
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-tl-sm'
              : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}>
          {msg.error && <AlertCircle className="w-3.5 h-3.5 inline mr-1 mb-0.5" />}
          {msg.content}
        </div>

        {!isUser && !msg.error && (
          <button
            onClick={() => onCopy(msg.content)}
            className="opacity-0 group-hover:opacity-100 transition-opacity
              flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
        )}
      </div>
    </div>
  );
}
