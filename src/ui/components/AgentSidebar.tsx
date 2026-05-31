import React, { useState, useRef, useEffect } from 'react';
import { Cpu, X, Play, Square, Loader2, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrowserTab } from './BrowserTabBar';

interface AgentSidebarProps {
  onClose: () => void;
  activeTab: BrowserTab | null;
  openRouterApiKey: string;
}

interface LogEntry {
  id: string;
  type: 'system' | 'user' | 'action' | 'success' | 'error';
  message: string;
}

// The script injected into the webview to read the DOM and act
const DOM_EXTRACTOR_SCRIPT = `
  (function() {
    let elements = [];
    let idCounter = 1;
    
    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    }

    const interactables = document.querySelectorAll('a, button, input, textarea, select, [role="button"]');
    
    // Clear old tags
    document.querySelectorAll('.nova-agent-tag').forEach(e => e.remove());

    interactables.forEach(el => {
      if (!isVisible(el)) return;
      const id = idCounter++;
      
      // Store reference on the window for action execution
      window.__novaAgentElements = window.__novaAgentElements || {};
      window.__novaAgentElements[id] = el;

      let text = el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || '';
      text = text.trim().substring(0, 50);
      
      elements.push('[' + id + '] ' + el.tagName.toLowerCase() + ' - "' + text + '"');

      // Visually tag the element for the user to see (optional UI flair)
      const tag = document.createElement('div');
      tag.className = 'nova-agent-tag';
      tag.textContent = id;
      tag.style.cssText = "position: absolute; top: " + (el.getBoundingClientRect().top + window.scrollY) + "px; left: " + (el.getBoundingClientRect().left + window.scrollX) + "px; background: #ef4444; color: white; font-size: 10px; font-weight: bold; padding: 1px 4px; border-radius: 4px; z-index: 2147483647; pointer-events: none;";
      document.body.appendChild(tag);
    });

    return elements.join('\\n');
  })();
`;

export function AgentSidebar({ onClose, activeTab, openRouterApiKey }: AgentSidebarProps): React.ReactElement {
  const [goal, setGoal] = useState('');
  const [selectedModel, setSelectedModel] = useState('openrouter/free');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random().toString(), type, message }]);
  };

  const executeCommand = async (webview: any, actionName: string, args: any) => {
    if (actionName === 'navigate') {
      webview.loadURL(args.url);
      addLog('action', `Navigating to ${args.url}`);
      return new Promise(resolve => setTimeout(resolve, 3000)); // wait for load
    }
    
    if (actionName === 'click') {
      await webview.executeJavaScript(`
        if (window.__novaAgentElements && window.__novaAgentElements[${args.id}]) {
          window.__novaAgentElements[${args.id}].click();
        }
      `);
      addLog('action', `Clicked element [${args.id}]`);
      return new Promise(resolve => setTimeout(resolve, 2000)); // wait for UI update
    }

    if (actionName === 'type') {
      await webview.executeJavaScript(`
        if (window.__novaAgentElements && window.__novaAgentElements[${args.id}]) {
          const el = window.__novaAgentElements[${args.id}];
          el.value = '${args.text}';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `);
      addLog('action', `Typed "${args.text}" into element [${args.id}]`);
      return new Promise(resolve => setTimeout(resolve, 500));
    }

    if (actionName === 'done') {
      addLog('success', args.message);
      setIsRunning(false);
      runningRef.current = false;
      return true;
    }
  };

  const startAgent = async () => {
    if (!openRouterApiKey) {
      addLog('error', 'Please enter your OpenRouter API Key in Settings.');
      return;
    }
    if (!activeTab || !goal.trim()) return;

    let wv = document.getElementById(`webview-${activeTab.id}`) as any;
    
    // Fallback: If ID lookup fails, search the DOM directly
    if (!wv) {
      const allWebviews = document.querySelectorAll('webview');
      if (allWebviews.length === 1) {
        wv = allWebviews[0];
      } else if (allWebviews.length > 1) {
        // Find the one that isn't hidden by display: none
        wv = Array.from(allWebviews).find((w: any) => w.parentElement?.style.display !== 'none');
      }
    }

    if (!wv) {
      addLog('error', 'Agent paused: You are currently on an internal browser page. Please type a website address (like google.com or amazon.com) into the search bar at the top, hit Enter to load it, and then run the Agent again!');
      return;
    }

    setIsRunning(true);
    runningRef.current = true;
    setLogs([]);
    addLog('user', `Goal: ${goal}`);

    let messageHistory: any[] = [];

    const systemPrompt = `
You are an autonomous web browser agent. Your job is to achieve the user's goal by interacting with the provided simplified web page DOM.
You must use the provided tools to interact with the page.
If you are on the wrong page, navigate.
If you see an element you need to interact with, click or type into it using its numerical [ID].
When you believe the user's goal has been accomplished, call the 'done' tool.
`;

    const tools = [
      {
        type: "function",
        function: {
          name: "navigate",
          description: "Navigate the browser to a specific URL",
          parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
        }
      },
      {
        type: "function",
        function: {
          name: "click",
          description: "Click a button or link by its numerical ID",
          parameters: { type: "object", properties: { id: { type: "integer" } }, required: ["id"] }
        }
      },
      {
        type: "function",
        function: {
          name: "type",
          description: "Type text into an input field by its numerical ID",
          parameters: { type: "object", properties: { id: { type: "integer" }, text: { type: "string" } }, required: ["id", "text"] }
        }
      },
      {
        type: "function",
        function: {
          name: "done",
          description: "Call this when the user's goal has been completely achieved.",
          parameters: { type: "object", properties: { message: { type: "string" } }, required: ["message"] }
        }
      }
    ];

    while (runningRef.current) {
      try {
        addLog('system', 'Analyzing page...');
        // Extract DOM
        const pageContent = await wv.executeJavaScript(DOM_EXTRACTOR_SCRIPT);
        
        const userPrompt = `CURRENT URL: ${activeTab.url}\n\nCURRENT PAGE ELEMENTS:\n${pageContent}\n\nWhat is your next action to achieve: "${goal}"?`;
        
        messageHistory.push({ role: 'user', content: userPrompt });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel, 
            messages: [{ role: 'system', content: systemPrompt }, ...messageHistory],
            tools: tools,
            tool_choice: "auto"
          })
        });

        const data = await response.json();
        
        if (data.error) {
          addLog('error', `API Error: ${data.error.message}`);
          break;
        }

        const message = data.choices[0].message;
        messageHistory.push(message);

        if (message.tool_calls && message.tool_calls.length > 0) {
          const toolCall = message.tool_calls[0];
          const args = JSON.parse(toolCall.function.arguments);
          
          messageHistory.push({
            role: 'tool',
            name: toolCall.function.name,
            tool_call_id: toolCall.id,
            content: "Action executed successfully."
          });

          const isDone = await executeCommand(wv, toolCall.function.name, args);
          if (isDone === true) break; // Finished!
        } else {
          // Model didn't use a tool, meaning it might be stuck or conversing
          addLog('system', `Agent says: ${message.content}`);
          // Stop if it stops acting
          break;
        }

      } catch (err: any) {
        addLog('error', err.message || 'Unknown error occurred.');
        break;
      }
    }

    setIsRunning(false);
    runningRef.current = false;
  };

  const stopAgent = () => {
    runningRef.current = false;
    setIsRunning(false);
    addLog('system', 'Agent stopped by user.');
  };

  return (
    <div className="slide-in-right flex w-[350px] h-full bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#333] flex-col flex-shrink-0 shadow-xl z-50 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-[#333] shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Auto-Agent</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#1a1a1a] font-mono text-[11px] space-y-3">
        {logs.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3">
            <Target className="w-8 h-8 opacity-50" />
            <p>Enter a goal below to let the agent take control of the browser.</p>
          </div>
        )}

        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-2">
            {log.type === 'system' && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0 mt-0.5" />}
            {log.type === 'user' && <Target className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />}
            {log.type === 'action' && <Cpu className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />}
            {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />}
            {log.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
            
            <div className={
              'flex-1 ' + (
                log.type === 'error' ? 'text-red-600 dark:text-red-400' :
                log.type === 'success' ? 'text-green-600 dark:text-green-400' :
                log.type === 'user' ? 'text-purple-600 dark:text-purple-400 font-bold' :
                'text-gray-600 dark:text-gray-300'
              )
            }>
              {log.message}
            </div>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-[#333] shrink-0 bg-white dark:bg-[#1e1e1e] flex flex-col gap-3">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isRunning}
          className="w-full text-xs p-2 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 border-none outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <optgroup label="Premium (Requires Credits)">
            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            <option value="openai/gpt-4o">GPT-4o</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
          </optgroup>
          <optgroup label="Free Models">
            <option value="openrouter/free">Auto-Select Free Model (Recommended)</option>
            <option value="google/gemma-2-9b-it:free">Google Gemma 2 9B (Free)</option>
            <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B (Free)</option>
          </optgroup>
        </select>
        
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={isRunning}
          placeholder="E.g., Go to amazon and add a red mechanical keyboard to my cart..."
          className="w-full h-24 p-3 text-sm rounded-xl bg-gray-100 dark:bg-[#2a2a2a] border border-transparent focus:border-blue-500 dark:focus:border-blue-400 outline-none text-gray-900 dark:text-white resize-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              startAgent();
            }
          }}
        />
        
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={startAgent}
              disabled={!goal.trim() || !openRouterApiKey}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              Run Agent
            </button>
          ) : (
            <button
              onClick={stopAgent}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop Agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
