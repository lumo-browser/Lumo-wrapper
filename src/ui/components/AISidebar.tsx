/**
 * AISidebar — Sliding AI panel, browser-native style
 * Accessed via the toolbar Sparkles button. Never a full-page takeover.
 * Uses the existing PlannerAgent under the hood.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Loader2,
  Copy,
  ChevronDown,
  FileText,
  Search,
  Zap,
  BookOpen,
} from 'lucide-react';
import { PlannerAgent } from '@services/agents';
import { logger } from '@utils/logger';

const SCOPE = 'AISidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  meta?: { steps: number; confidence: number; duration: number };
}

interface QuickPrompt {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { icon: FileText, label: 'Summarize page',    prompt: 'Summarize the main content of the current page concisely.' },
  { icon: Search,   label: 'Deep research',     prompt: 'Research this topic thoroughly and provide a structured report.' },
  { icon: Zap,      label: 'Plan a task',       prompt: 'Help me plan and automate a complex browser task step by step.' },
  { icon: BookOpen, label: 'Extract key points', prompt: 'Extract the key points and important data from the current page.' },
];

const GREETING: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! I can summarize pages, research topics, plan tasks, and automate workflows. What do you need?',
  timestamp: new Date(),
};

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onRequestLogin: () => void;
  currentUrl: string;
}

export function AISidebar({
  isOpen,
  onClose,
  isLoggedIn,
  onRequestLogin,
  currentUrl,
}: AISidebarProps): React.ReactElement | null {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;
    if (!isLoggedIn) { onRequestLogin(); return; }

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

    setMessages((p) => [...p, userMsg, loadingMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const planner = new PlannerAgent();
      await planner.initialize({
        conversationId: `ai-${Date.now()}`,
        sessionId: `s-${Date.now()}`,
        pageContext: { url: currentUrl, title: document.title },
        previousResults: [],
        variables: {},
      });

      const result = await planner.execute({ goal: trimmed, context: { currentPage: currentUrl } });

      let reply: string;
      if (result.plan.length > 0) {
        const stepLines = result.plan
          .map((a, i) => `${i + 1}. ${a.type.toUpperCase()}${a.description ? ` — ${a.description}` : ''}`)
          .join('\n');
        reply = `Here is my plan (${result.confidence}% confidence):\n\n${stepLines}\n\nEstimated time: ${(result.estimatedDuration / 1000).toFixed(1)}s`;
      } else {
        reply = `Understood. I can help with "${trimmed}". Could you give me more context — such as the target URL or specific elements to interact with?`;
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        meta: { steps: result.plan.length, confidence: result.confidence, duration: result.estimatedDuration },
      };

      setMessages((p) => p.filter((m) => !m.isLoading).concat(assistantMsg));
      logger.info(SCOPE, 'AI response generated', { confidence: result.confidence });
    } catch {
      setMessages((p) =>
        p.filter((m) => !m.isLoading).concat({
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          timestamp: new Date(),
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const copyText = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div className="slide-in-right flex flex-col w-80 h-full bg-white dark:bg-[#242424] border-l border-gray-200 dark:border-[#3a3a3a] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#3a3a3a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Nova AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([GREETING])}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
            title="Clear conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
            title="Close AI panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Login gate */}
      {!isLoggedIn && (
        <div className="mx-3 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex-shrink-0">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-300">Sign in required</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 mb-2">AI features require a Nova account.</p>
          <button
            onClick={onRequestLogin}
            className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Quick prompts — only shown at start */}
      {messages.length <= 1 && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((qp) => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={!isLoggedIn}
                  className="flex items-center gap-2 px-3 py-2.5 text-left rounded-xl
                    bg-gray-50 dark:bg-[#2d2d2d] hover:bg-blue-50 dark:hover:bg-[#1e3a5f]/40
                    text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300
                    border border-gray-200 dark:border-[#3a3a3a] hover:border-blue-200 dark:hover:border-blue-800
                    transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium leading-tight">{qp.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
        {messages.map((msg) => <Bubble key={msg.id} msg={msg} onCopy={copyText} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-[#3a3a3a] flex-shrink-0">
        <div className={`flex items-end gap-2 px-3 py-2 rounded-xl transition-all
          bg-gray-100 dark:bg-[#2d2d2d] focus-within:ring-2 focus-within:ring-blue-500`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoggedIn ? 'Ask Nova AI...' : 'Sign in to use AI'}
            disabled={!isLoggedIn || isProcessing}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400
              outline-none resize-none max-h-28 scrollbar-none disabled:opacity-40"
            style={{ lineHeight: '1.5rem' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isProcessing || !isLoggedIn}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700
              disabled:bg-gray-300 dark:disabled:bg-gray-600
              flex items-center justify-center text-white transition-colors"
          >
            {isProcessing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-1.5">
          Nova AI · Powered by PlannerAgent
        </p>
      </div>
    </div>
  );
}

function Bubble({ msg, onCopy }: { msg: Message; onCopy: (s: string) => void }): React.ReactElement {
  const isUser = msg.role === 'user';

  if (msg.isLoading) {
    return (
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-[#2d2d2d] rounded-2xl rounded-tl-sm">
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
        ${isUser
          ? 'bg-gray-200 dark:bg-[#3a3a3a]'
          : 'bg-gradient-to-br from-blue-500 to-violet-600'
        }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          : <Bot className="w-3.5 h-3.5 text-white" />
        }
      </div>

      <div className={`group max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
        <div className={`px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line rounded-2xl
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}>
          {msg.content}
        </div>

        {!isUser && msg.meta && (
          <div className="flex gap-2 text-[11px] text-gray-400 px-1">
            <span>{msg.meta.steps} steps</span>
            <span
              className={msg.meta.confidence >= 80 ? 'text-green-500' : msg.meta.confidence >= 60 ? 'text-yellow-500' : 'text-red-400'}
            >
              {msg.meta.confidence}% confidence
            </span>
          </div>
        )}

        {!isUser && (
          <button
            onClick={() => onCopy(msg.content)}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
        )}
      </div>
    </div>
  );
}
