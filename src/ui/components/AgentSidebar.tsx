import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cpu, X, Play, Square, Loader2, Target, CheckCircle2, AlertCircle, Pause, ShieldCheck, ShieldAlert, ListChecks, BarChart3 } from 'lucide-react';
import { BrowserTab } from './BrowserTabBar';
import { AGENT_TOOLS, createTaskMemory, executeToolCall, DOM_EXTRACTOR_SCRIPT, buildSystemPrompt, buildContextPrompt } from '../../agent';
import type { TaskMemory } from '../../agent';

interface AgentSidebarProps { onClose: () => void; activeTab: BrowserTab | null; openRouterApiKey: string; }
interface LogEntry { id: string; type: 'system'|'user'|'action'|'success'|'error'|'confirm'|'plan'|'compare'; message: string; }

export function AgentSidebar({ onClose, activeTab, openRouterApiKey }: AgentSidebarProps): React.ReactElement {
  const [goal, setGoal] = useState('');
  const [selectedModel, setSelectedModel] = useState('openrouter/free');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [memory, setMemory] = useState<TaskMemory | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [comparisonRec, setComparisonRec] = useState('');
  const [activeView, setActiveView] = useState<'logs'|'plan'|'compare'>('logs');

  const logsEndRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);
  const memoryRef = useRef<TaskMemory | null>(null);
  const confirmResolveRef = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  useEffect(() => { memoryRef.current = memory; }, [memory]);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, { id: Date.now() + '-' + Math.random().toString(36).slice(2, 6), type, message }]);
  }, []);

  const findWebview = useCallback((): any => {
    if (!activeTab) return null;
    let wv = document.getElementById('webview-' + activeTab.id) as any;
    if (!wv) {
      const all = document.querySelectorAll('webview');
      if (all.length === 1) wv = all[0];
      else if (all.length > 1) wv = Array.from(all).find((w: any) => w.parentElement?.style.display !== 'none');
    }
    return wv;
  }, [activeTab]);

  const waitForConfirmation = useCallback((msg: string): Promise<boolean> => {
    return new Promise(resolve => {
      setAwaitingConfirmation(true);
      setConfirmMsg(msg);
      addLog('confirm', 'CONFIRMATION REQUIRED: ' + msg);
      confirmResolveRef.current = resolve;
    });
  }, [addLog]);

  const handleConfirm = useCallback((approved: boolean) => {
    setAwaitingConfirmation(false);
    setConfirmMsg('');
    if (confirmResolveRef.current) {
      confirmResolveRef.current(approved);
      confirmResolveRef.current = null;
    }
    addLog(approved ? 'success' : 'error', approved ? 'User APPROVED the action.' : 'User REJECTED the action.');
  }, [addLog]);

  const startAgent = useCallback(async () => {
    if (!openRouterApiKey) { addLog('error', 'Please set your OpenRouter API Key in Settings.'); return; }
    if (!activeTab || !goal.trim()) return;
    const wv = findWebview();
    if (!wv) { addLog('error', 'Navigate to a real website first (e.g. google.com).'); return; }

    let currentMemory: TaskMemory;
    if (!isPaused || !memoryRef.current) {
      currentMemory = createTaskMemory(goal);
      setLogs([]);
      addLog('user', 'Goal: ' + goal);
    } else {
      currentMemory = memoryRef.current;
      addLog('system', 'Agent resumed.');
    }

    setMemory(currentMemory);
    setIsRunning(true);
    setIsPaused(false);
    setActiveView('logs');
    runningRef.current = true;

    const systemPrompt = buildSystemPrompt();
    let conversationHistory: any[] = currentMemory.conversationContext.length > 0 ? [...currentMemory.conversationContext] : [];
    let iteration = currentMemory.actionHistory.length;
    const MAX_ITERATIONS = 40;

    while (runningRef.current && iteration < MAX_ITERATIONS) {
      if (currentMemory.errorCount >= currentMemory.maxErrors) {
        addLog('error', 'Too many errors (' + currentMemory.errorCount + '). Stopping.');
        break;
      }
      try {
        iteration++;
        addLog('system', 'Step ' + iteration + ': Analyzing page...');

        const domContent = await wv.executeJavaScript(DOM_EXTRACTOR_SCRIPT);
        const currentUrl = (wv.getURL && wv.getURL()) || activeTab.url || '';
        const contextPrompt = buildContextPrompt(currentUrl, domContent, currentMemory, iteration);

        conversationHistory.push({ role: 'user', content: contextPrompt });

        // Keep conversation history manageable
        if (conversationHistory.length > 30) {
          conversationHistory = conversationHistory.slice(-20);
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + openRouterApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'system', content: systemPrompt }, ...conversationHistory],
            tools: AGENT_TOOLS,
            tool_choice: 'auto',
          }),
        });

        const data = await response.json();
        if (data.error) { addLog('error', 'API Error: ' + data.error.message); break; }

        const msg = data.choices?.[0]?.message;
        if (!msg) { addLog('error', 'Empty API response.'); break; }

        conversationHistory.push(msg);

        // If model returned text content, show it
        if (msg.content) addLog('system', 'Agent: ' + msg.content.substring(0, 300));

        if (msg.tool_calls && msg.tool_calls.length > 0) {
          for (const toolCall of msg.tool_calls) {
            if (!runningRef.current) break;
            let args: Record<string, any> = {};
            try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch { args = {}; }
            const toolName = toolCall.function.name;

            addLog('action', toolName + '(' + JSON.stringify(args).substring(0, 120) + ')');

            const result = await executeToolCall(wv, toolName, args, currentMemory);
            currentMemory = result.updatedMemory;
            setMemory({ ...currentMemory });

            // Handle confirmation gate
            if (result.requiresConfirmation) {
              const approved = await waitForConfirmation(result.confirmationMessage || result.output);
              conversationHistory.push({ role: 'tool', tool_call_id: toolCall.id, content: approved ? 'User APPROVED. Proceed.' : 'User REJECTED. Do NOT proceed with this action. Find alternative or call done.' });
              if (!approved) { addLog('system', 'Action blocked. Agent will find alternative.'); }
              continue;
            }

            // Handle comparison presentation
            if (result.comparisonData && result.comparisonData.length > 0) {
              setComparisonRec(result.comparisonRecommendation || '');
              setActiveView('compare');
              addLog('compare', 'Product comparison ready (' + result.comparisonData.length + ' products). Check the Compare tab.');
            }

            // Handle plan updates
            if (result.planSteps) {
              setActiveView('plan');
              addLog('plan', 'Plan created with ' + result.planSteps.length + ' steps.');
            }

            // Handle done
            if (result.isDone) {
              addLog(result.doneSuccess ? 'success' : 'error', result.output);
              runningRef.current = false;
              break;
            }

            // Log result
            if (result.success) {
              addLog('system', result.output.substring(0, 200));
            } else {
              addLog('error', result.output.substring(0, 200));
            }

            conversationHistory.push({ role: 'tool', tool_call_id: toolCall.id, content: result.output.substring(0, 500) });
          }
        } else if (!msg.content) {
          addLog('system', 'Agent did not act. Retrying...');
        }

        // Save conversation context in memory for resume
        currentMemory = { ...currentMemory, conversationContext: conversationHistory };
        setMemory({ ...currentMemory });

      } catch (err: any) {
        addLog('error', err.message || 'Unknown error');
        currentMemory = { ...currentMemory, errorCount: currentMemory.errorCount + 1 };
        setMemory({ ...currentMemory });
      }
    }

    if (iteration >= MAX_ITERATIONS) addLog('error', 'Reached maximum iterations (' + MAX_ITERATIONS + ').');
    setIsRunning(false);
    runningRef.current = false;
  }, [openRouterApiKey, activeTab, goal, selectedModel, isPaused, findWebview, addLog, waitForConfirmation]);

  const pauseAgent = useCallback(() => { runningRef.current = false; setIsRunning(false); setIsPaused(true); addLog('system', 'Agent paused.'); }, [addLog]);
  const stopAgent = useCallback(() => { runningRef.current = false; setIsRunning(false); setIsPaused(false); setAwaitingConfirmation(false); setMemory(null); addLog('system', 'Agent stopped.'); }, [addLog]);

  const plan = memory?.plan || [];
  const products = memory?.extractedProducts || [];

  return (
    <div className="slide-in-right flex w-full h-full bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#333] flex-col flex-shrink-0 shadow-xl z-50 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-[#333] shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Lumo Auto-Agent</span>
          {isRunning && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
          {isPaused && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs: Logs / Plan / Compare */}
      <div className="flex border-b border-gray-200 dark:border-[#333] shrink-0">
        {(['logs', 'plan', 'compare'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveView(tab)}
            className={'flex-1 py-2 text-xs font-medium transition-colors relative ' +
              (activeView === tab ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
            <div className="flex items-center justify-center gap-1">
              {tab === 'logs' && <Loader2 className="w-3 h-3" />}
              {tab === 'plan' && <ListChecks className="w-3 h-3" />}
              {tab === 'compare' && <BarChart3 className="w-3 h-3" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'compare' && products.length > 0 && <span className="ml-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full px-1.5 text-[10px]">{products.length}</span>}
              {tab === 'plan' && plan.length > 0 && <span className="ml-1 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full px-1.5 text-[10px]">{plan.filter(s => s.status === 'done').length}/{plan.length}</span>}
            </div>
            {activeView === tab && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1a1a1a]">

        {/* Logs View */}
        {activeView === 'logs' && (
          <div className="p-3 font-mono text-[11px] space-y-2">
            {logs.length === 0 && !isRunning && (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 space-y-3">
                <Target className="w-8 h-8 opacity-50" />
                <p>Enter a goal below.<br/>The agent will take full control of the browser.</p>
              </div>
            )}
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-2">
                {log.type === 'system' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0 mt-0.5" />}
                {log.type === 'user' && <Target className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />}
                {log.type === 'action' && <Cpu className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />}
                {log.type === 'success' && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />}
                {log.type === 'error' && <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />}
                {log.type === 'confirm' && <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />}
                {log.type === 'plan' && <ListChecks className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />}
                {log.type === 'compare' && <BarChart3 className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />}
                <div className={'flex-1 leading-relaxed ' + (
                  log.type === 'error' ? 'text-red-600 dark:text-red-400' :
                  log.type === 'success' ? 'text-green-600 dark:text-green-400' :
                  log.type === 'user' ? 'text-purple-600 dark:text-purple-400 font-bold' :
                  log.type === 'confirm' ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                  log.type === 'action' ? 'text-orange-600 dark:text-orange-400' :
                  'text-gray-600 dark:text-gray-300'
                )}>{log.message}</div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}

        {/* Plan View */}
        {activeView === 'plan' && (
          <div className="p-4 space-y-2">
            {plan.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No plan yet. Start the agent to generate one.</p>
            ) : plan.map(step => (
              <div key={step.id} className={'flex items-start gap-2 p-2 rounded-lg text-xs ' + (
                step.status === 'done' ? 'bg-green-50 dark:bg-green-900/20' :
                step.status === 'active' ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700' :
                step.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20' :
                'bg-gray-100 dark:bg-[#222]'
              )}>
                <div className="shrink-0 mt-0.5">
                  {step.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                  {step.status === 'active' && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                  {step.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                  {step.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />}
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">Step {step.id}:</span>{' '}
                  <span className="text-gray-600 dark:text-gray-300">{step.description}</span>
                  {step.result && <p className="text-[10px] text-gray-400 mt-0.5">{step.result}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compare View */}
        {activeView === 'compare' && (
          <div className="p-4 space-y-3">
            {products.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No products saved yet. The agent will extract and compare products automatically.</p>
            ) : (
              <>
                {products.map((p, i) => (
                  <div key={i} className="bg-white dark:bg-[#222] rounded-xl p-3 border border-gray-200 dark:border-[#333] text-xs space-y-1 shadow-sm">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{p.name}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-bold">{p.price}</span>
                      {p.rating !== 'N/A' && <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">★ {p.rating}</span>}
                      {p.reviews !== 'N/A' && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{p.reviews}</span>}
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>{p.vendor}</span>
                      <span>{p.delivery}</span>
                    </div>
                  </div>
                ))}
                {comparisonRec && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800 text-xs">
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Agent Recommendation</div>
                    <div className="text-indigo-600 dark:text-indigo-400">{comparisonRec}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Banner */}
      {awaitingConfirmation && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-t-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">ACTION REQUIRES APPROVAL</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 whitespace-pre-wrap">{confirmMsg}</p>
          <div className="flex gap-2">
            <button onClick={() => handleConfirm(true)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" /> Approve
            </button>
            <button onClick={() => handleConfirm(false)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">
              <ShieldAlert className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 dark:border-[#333] shrink-0 bg-white dark:bg-[#1e1e1e] flex flex-col gap-2">
        <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} disabled={isRunning}
          className="w-full text-xs p-1.5 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 border-none outline-none focus:ring-2 focus:ring-blue-500/50">
          <optgroup label="Premium">
            <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
            <option value="openai/gpt-4o">GPT-4o</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
          </optgroup>
          <optgroup label="Free Models">
            <option value="openrouter/free">Auto-Select Free Model (Best)</option>
            <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</option>
            <option value="google/gemini-2.0-pro-exp-02-05:free">Gemini 2.0 Pro Exp (Free)</option>
            <option value="deepseek/deepseek-chat:free">DeepSeek V3 (Free)</option>
          </optgroup>
        </select>

        <textarea value={goal} onChange={e => setGoal(e.target.value)} disabled={isRunning}
          placeholder="E.g., Order a torch on Amazon — compare prices, ratings, and delivery..."
          className="w-full h-20 p-2.5 text-sm rounded-xl bg-gray-100 dark:bg-[#2a2a2a] border border-transparent focus:border-blue-500 dark:focus:border-blue-400 outline-none text-gray-900 dark:text-white resize-none disabled:opacity-50"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(); } }} />

        <div className="flex gap-2">
          {!isRunning ? (
            <button onClick={startAgent} disabled={!goal.trim() || !openRouterApiKey || awaitingConfirmation}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
              <Play className="w-4 h-4 fill-current" />
              {isPaused ? 'Resume' : 'Run Agent'}
            </button>
          ) : (
            <button onClick={pauseAgent} className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium text-sm transition-colors">
              <Pause className="w-4 h-4" /> Pause
            </button>
          )}
          {(isRunning || isPaused) && (
            <button onClick={stopAgent} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors">
              <Square className="w-4 h-4 fill-current" /> Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
