/**
 * Nova AI Space — The ultimate AI integration
 *
 * No API keys. Users simply select a provider, it opens as a tab in the sidebar,
 * and they log in securely using the provider's official flow.
 * Providers run in webviews alongside the native Nova Assistant.
 */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        allowpopups?: string;
        partition?: string;
        useragent?: string;
      };
    }
  }
}

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Pin,
  PinOff,
  Sparkles,
  Bot,
  User,
  Send,
  Loader2,
  Copy,
  ChevronDown,
  FileText,
  Search,
  Zap,
  BookOpen,
} from 'lucide-react';
import { useAISpaceStore } from '../../store/ai-space.store';
import { AI_PROVIDERS, type AIProviderId } from '../../types/ai-space.types';
import { PlannerAgent } from '@services/agents';
import { logger } from '@utils/logger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const QUICK_PROMPTS = [
  { icon: FileText, label: 'Summarize', prompt: 'Summarize the main content of the current page.' },
  { icon: Search,   label: 'Research',  prompt: 'Research this topic and provide a structured report.' },
  { icon: Zap,      label: 'Plan task', prompt: 'Help me plan and automate a browser task step by step.' },
  { icon: BookOpen, label: 'Key points', prompt: 'Extract the key facts and data from the current page.' },
];

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  pageTitle: string;
  width?: number;
}

export function AISidebar({ isOpen, onClose, currentUrl, pageTitle }: AISidebarProps): React.ReactElement | null {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab, togglePin } = useAISpaceStore();
  const [showAddMenu, setShowAddMenu] = useState(false);

  if (!isOpen) return null;

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeProvider = AI_PROVIDERS.find((p) => p.id === activeTab?.providerId);

  return (
    <div className="flex w-full h-full bg-white dark:bg-[#1e1e1e]
      border-l border-gray-200 dark:border-[#3a3a3a] flex-shrink-0 z-50">

      {/* ── Left Sidebar (Provider Navigation) ── */}
      <div className="w-36 bg-[#f9fafb] dark:bg-[#18181b] border-r border-gray-200 dark:border-[#3a3a3a] flex flex-col py-3">
        <div className="px-3 mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            AI Space
          </span>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-none">
          {tabs.map((tab) => {
            const provider = AI_PROVIDERS.find((p) => p.id === tab.providerId);
            if (!provider) return null;
            const isActive = tab.id === activeTabId;

            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-medium select-none
                  ${isActive
                    ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                  }`}
              >
                {/* Icon */}
                <div className={`w-4 h-4 rounded-md shadow-sm flex items-center justify-center text-white text-[9px] font-bold ${provider.color} flex-shrink-0`}>
                  {provider.name[0]}
                </div>
                <span className="flex-1 truncate">{tab.customName || provider.name}</span>

                {/* Actions (Pin/Close) - Only on hover */}
                {tab.providerId !== 'nova' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-500 transition-opacity"
                    title="Remove Provider"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Provider Dropdown */}
          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-[#3a3a3a]">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 transition-colors text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Provider
            </button>

            {showAddMenu && (
              <div className="mt-1 flex flex-col gap-0.5">
                {AI_PROVIDERS.filter((p) => p.id !== 'nova').map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { addTab(p.id); setShowAddMenu(false); }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 transition-colors text-xs"
                  >
                    <div className={`w-3 h-3 rounded-sm text-white text-[7px] font-bold flex items-center justify-center ${p.color}`}>
                      {p.name[0]}
                    </div>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#2d2d2d]">
        {activeTab?.providerId === 'nova' ? (
          <NovaAssistant currentUrl={currentUrl} pageTitle={pageTitle} />
        ) : (
          <ProviderWebview provider={activeProvider} />
        )}
      </div>
    </div>
  );
}

// ── Native Nova Assistant ──────────────────────────────────────────────────
function NovaAssistant({ currentUrl, pageTitle }: { currentUrl: string; pageTitle: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: 'Hello! I am your native Nova Assistant. I have full context of your tabs, pages, and browser state. How can I help?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: trimmed, timestamp: new Date() },
      { id: `l-${Date.now()}`, role: 'assistant', content: '', timestamp: new Date(), isLoading: true },
    ]);
    setInput('');
    setIsProcessing(true);

    try {
      const planner = new PlannerAgent();
      await planner.initialize({
        conversationId: `ai-${Date.now()}`,
        sessionId: `s-${Date.now()}`,
        pageContext: { url: currentUrl, title: pageTitle },
        previousResults: [],
        variables: {},
      });

      const result = await planner.execute({ goal: trimmed, context: { currentPage: currentUrl } });
      const reply = result.plan.length > 0
        ? `Here is my plan (${result.confidence}% confidence):\n\n${result.plan.map((a, i) => `${i + 1}. ${a.type.toUpperCase()}${a.description ? ` — ${a.description}` : ''}`).join('\n')}\n\nEstimated time: ${(result.estimatedDuration / 1000).toFixed(1)}s`
        : `Understood. I can help with "${trimmed}". Please provide more details.`;

      setMessages((prev) => prev.filter((m) => !m.isLoading).concat({
        id: `a-${Date.now()}`, role: 'assistant', content: reply, timestamp: new Date(),
      }));
    } catch (e) {
      setMessages((prev) => prev.filter((m) => !m.isLoading).concat({
        id: `e-${Date.now()}`, role: 'assistant', content: 'Task failed.', timestamp: new Date(),
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
              ${msg.role === 'user' ? 'bg-gray-200 dark:bg-[#3a3a3a]' : 'bg-gradient-to-br from-blue-500 to-violet-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-gray-500" /> : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className={`px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap rounded-2xl max-w-[85%]
              ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-[#3a3a3a] text-gray-900 dark:text-gray-100 rounded-tl-sm'}`}>
              {msg.isLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-[#2d2d2d] border-t border-gray-200 dark:border-[#3a3a3a]">
        <div className="flex items-end gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#1e1e1e] focus-within:ring-2 focus-within:ring-blue-500">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask Nova Assistant..."
            rows={1}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none resize-none max-h-28 scrollbar-none"
            style={{ lineHeight: '1.5rem' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isProcessing}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider Webview ───────────────────────────────────────────────────────
function ProviderWebview({ provider }: { provider?: typeof AI_PROVIDERS[0] }) {
  if (!provider) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#2d2d2d]">
      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-center flex-shrink-0">
        <p className="text-[11px] font-medium text-yellow-800 dark:text-yellow-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Log in safely. Nova securely embeds {provider.name} and cannot see your passwords.
        </p>
      </div>

      <div className="flex-1 relative bg-white dark:bg-black flex items-center justify-center">
        {/*
          Use Electron's <webview> tag to bypass X-Frame-Options restrictions.
          This only works when the app is run inside the Electron environment (not in a standard web browser).
        */}
        <webview
          src={provider.url}
          className="w-full h-full relative z-10 border-none bg-transparent"
          title={provider.name}
          allowpopups="true"
          partition={`persist:ai-${provider.id}`}
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        />
      </div>
    </div>
  );
}
