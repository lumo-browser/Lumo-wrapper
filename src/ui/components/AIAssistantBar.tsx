/**
 * AIAssistantBar — Floating AI assistant trigger button + quick action bar
 * Provides quick access to Nova AI features from anywhere in the browser
 */

import React, { useState } from 'react';
import {
  Bot,
  MessageSquare,
  Zap,
  BookOpen,
  FileText,
  Search,
  ChevronUp,
  X,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Summarize this page',
    icon: FileText,
    prompt: 'Summarize the content of the current page in clear, concise bullet points.',
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Deep research mode',
    icon: Search,
    prompt: 'Research this topic thoroughly and provide a structured report with key findings.',
  },
  {
    id: 'plan',
    label: 'Plan Task',
    description: 'Create action plan',
    icon: Zap,
    prompt: 'Help me plan and execute a complex browser task step by step.',
  },
  {
    id: 'read',
    label: 'Reader Mode',
    description: 'Extract main content',
    icon: BookOpen,
    prompt: 'Extract and display only the main article content from this page in a clean, readable format.',
  },
];

interface AIAssistantBarProps {
  isLoggedIn: boolean;
  onOpenChat: (initialPrompt?: string) => void;
  onRequestLogin: () => void;
}

export function AIAssistantBar({ isLoggedIn, onOpenChat, onRequestLogin }: AIAssistantBarProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAction = (action: QuickAction) => {
    if (!isLoggedIn) {
      onRequestLogin();
      return;
    }
    onOpenChat(action.prompt);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-30 flex flex-col items-start gap-2">
      {/* Quick Actions Tray */}
      {isExpanded && (
        <div className="flex flex-col gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 mb-1 w-52 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Actions</p>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20
                  text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300
                  transition-colors group text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{action.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{action.description}</p>
                </div>
              </button>
            );
          })}

          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-2">
            <button
              onClick={() => { onOpenChat(); setIsExpanded(false); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Open Full Chat
            </button>
          </div>
        </div>
      )}

      {/* Main FAB Button */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200
            bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700
            hover:scale-105 active:scale-95 text-white`}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </button>

        {/* Tooltip */}
        {showTooltip && !isExpanded && (
          <div className="absolute left-14 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            Nova AI Assistant
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        )}

        {/* Login badge */}
        {!isLoggedIn && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>
    </div>
  );
}
