/**
 * AIChatPanel — Real-time AI chat sidebar powered by the Lumo planning engine
 * Uses existing PlannerAgent and GoalParsingService infrastructure
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, Bot, User, Loader2, RotateCcw, Copy, ThumbsUp } from 'lucide-react';
import { PlannerAgent } from '@services/agents';
import { logger } from '@utils/logger';

const SCOPE = 'AIChatPanel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  confidence?: number;
  planSteps?: number;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onRequestLogin: () => void;
}

const GREETING: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hello! I am Lumo, your AI browsing assistant. I can help you plan tasks, research topics, fill forms, extract data, or automate workflows. What would you like to accomplish?',
  timestamp: new Date(),
};

const QUICK_PROMPTS = [
  'Research a company for me',
  'Summarize the current page',
  'Find product alternatives',
  'Help me fill this form',
];

export function AIChatPanel({ isOpen, onClose, isLoggedIn, onRequestLogin }: AIChatPanelProps): React.ReactElement | null {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    if (!isLoggedIn) {
      onRequestLogin();
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const planner = new PlannerAgent();
      await planner.initialize({
        conversationId: `chat-${Date.now()}`,
        sessionId: `session-${Date.now()}`,
        pageContext: { url: window.location.href, title: document.title },
        previousResults: [],
        variables: {},
      });

      const result = await planner.execute({ goal: text, context: { currentPage: window.location.href } });

      const steps = result.plan.map((a, i) => `${i + 1}. **${a.type.toUpperCase()}** — ${a.description ?? ''}`).join('\n');
      const summary = result.plan.length > 0
        ? `I have analyzed your request and created a ${result.plan.length}-step plan:\n\n${steps}\n\nEstimated time: ${(result.estimatedDuration / 1000).toFixed(1)}s  |  Confidence: ${result.confidence}%`
        : `I understand your request: "${text}". Let me help you with that. Could you provide more context or specify the website you want to work with?`;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: summary,
        timestamp: new Date(),
        confidence: result.confidence,
        planSteps: result.plan.length,
      };

      setMessages((prev) => prev.filter((m) => !m.isLoading).concat(assistantMsg));
      logger.info(SCOPE, 'Chat response generated', { confidence: result.confidence });
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again or rephrase your goal.',
        timestamp: new Date(),
      };
      setMessages((prev) => prev.filter((m) => !m.isLoading).concat(errMsg));
      logger.error(SCOPE, 'Chat processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => setMessages([GREETING]);

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  return (
    <div
      className={`fixed right-4 z-40 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300
        ${isMinimized ? 'bottom-4 w-72 h-auto' : 'bottom-4 w-96 h-[580px]'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Lumo AI</p>
            {!isMinimized && (
              <p className="text-xs text-blue-100">{isLoggedIn ? 'Connected' : 'Sign in to unlock'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} title="Clear chat" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? 'Expand' : 'Minimize'} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors">
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} title="Close" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Login Gate */}
          {!isLoggedIn && (
            <div className="mx-3 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Sign in to use AI Chat</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your account unlocks full AI capabilities.</p>
              <button onClick={onRequestLogin} className="mt-2 text-xs px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium">
                Sign In
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onCopy={copyMessage} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (only when chat is empty-ish) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setInput(p); inputRef.current?.focus(); }}
                    className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 rounded-full transition-colors border border-gray-200 dark:border-gray-600 hover:border-blue-300"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-2">
            <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoggedIn ? 'Describe your goal... (Enter to send)' : 'Sign in to chat with Lumo AI'}
                disabled={!isLoggedIn || isProcessing}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none resize-none max-h-24 disabled:opacity-50"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing || !isLoggedIn}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 flex items-center justify-center text-white transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  onCopy,
}: {
  message: ChatMessage;
  onCopy: (c: string) => void;
}): React.ReactElement {
  const isUser = message.role === 'user';

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-br from-blue-500 to-violet-600'}`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
          : <Bot className="w-3.5 h-3.5 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`group max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
          }`}>
          {message.content}
        </div>

        {/* Metadata */}
        {!isUser && message.planSteps !== undefined && (
          <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
            <span>{message.planSteps} steps</span>
            {message.confidence !== undefined && (
              <span className={message.confidence >= 80 ? 'text-green-500' : 'text-yellow-500'}>
                {message.confidence}% confidence
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <button onClick={() => onCopy(message.content)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Copy className="w-3 h-3" />
            </button>
            <button className="text-gray-400 hover:text-green-500">
              <ThumbsUp className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
