/**
 * AIProviderSetup — Connect a provider via BYOA model
 *
 * Flow:
 *  1. User sees all available providers
 *  2. Clicks one → sees setup form for that provider
 *  3. Link opens the provider's official API key page
 *  4. User pastes their API key
 *  5. Key is validated and stored (obfuscated, not plain text)
 *
 * Nova NEVER asks for passwords. NEVER proxies authentication.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Key,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Unplug,
} from 'lucide-react';
import { PROVIDERS, getProvider, type ProviderId } from '../../types/ai-provider.types';
import { useAIProviderStore } from '../../store/ai-provider.store';
import { validateKeyFormat } from '../../services/ai-provider.service';

interface AIProviderSetupProps {
  onDone: () => void;
}

type SetupView = 'picker' | 'connect';

export function AIProviderSetup({ onDone }: AIProviderSetupProps): React.ReactElement {
  const [view, setView] = useState<SetupView>('picker');
  const [selectedId, setSelectedId] = useState<ProviderId | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { connect, disconnect, connections, activeProvider, setActive } = useAIProviderStore();

  const handleProviderClick = (id: ProviderId) => {
    setSelectedId(id);
    setApiKey('');
    setValidationError(null);
    setView('connect');
  };

  const handleConnect = async () => {
    if (!selectedId) return;

    const error = validateKeyFormat(selectedId, apiKey);
    if (error) { setValidationError(error); return; }

    setIsConnecting(true);
    setValidationError(null);

    // Small artificial delay so it feels like something is happening
    await new Promise((r) => setTimeout(r, 600));

    const provider = getProvider(selectedId);
    connect(selectedId, apiKey, provider.defaultModel);

    setIsConnecting(false);
    onDone();
  };

  const handleDisconnect = (id: ProviderId, e: React.MouseEvent) => {
    e.stopPropagation();
    disconnect(id);
  };

  if (view === 'connect' && selectedId) {
    const provider = getProvider(selectedId);
    const isAlreadyConnected = !!connections[selectedId];

    return (
      <div className="flex flex-col h-full">
        {/* Back button */}
        <button
          onClick={() => setView('picker')}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All providers
        </button>

        {/* Provider header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${provider.gradient}
            flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
            {provider.name[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{provider.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{provider.shortName}</p>
          </div>
          {isAlreadyConnected && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
              <Check className="w-3.5 h-3.5" /> Connected
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          {provider.description}
        </p>

        {/* Step 1 — Get key */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
            Step 1 — Get your API key
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
            Visit the {provider.name} dashboard and create an API key. Nova will never ask for your password.
          </p>
          <a
            href={provider.apiKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400
              hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open {provider.name} API keys
          </a>
        </div>

        {/* Step 2 — Paste key */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Step 2 — Paste your API key
          </label>
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all
            ${validationError
              ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#2d2d2d]'
            }`}>
            <Key className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setValidationError(null); }}
              placeholder={provider.keyPlaceholder}
              className="flex-1 bg-transparent text-xs text-gray-900 dark:text-gray-100
                placeholder-gray-400 outline-none font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {validationError && (
            <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1.5">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {validationError}
            </p>
          )}
        </div>

        {/* Privacy note */}
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-4 leading-relaxed">
          Your key is stored locally and obfuscated. It is never sent to Nova servers.
          All AI requests go directly from your browser to {provider.name}.
        </p>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={!apiKey.trim() || isConnecting}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all
            bg-blue-600 hover:bg-blue-700 active:bg-blue-800
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Connecting...' : isAlreadyConnected ? 'Update key' : `Connect ${provider.name}`}
        </button>

        {/* Disconnect option */}
        {isAlreadyConnected && (
          <button
            onClick={(e) => { handleDisconnect(selectedId, e); setView('picker'); }}
            className="mt-2 w-full py-2 rounded-xl text-xs text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30
              transition-colors font-medium flex items-center justify-center gap-1.5"
          >
            <Unplug className="w-3.5 h-3.5" />
            Disconnect {provider.name}
          </button>
        )}
      </div>
    );
  }

  // ── Provider Picker ────────────────────────────────────────────────────────
  const connectedCount = Object.keys(connections).length;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Choose your AI</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Use your own account. No Nova sign-in required.
        </p>
      </div>

      {connectedCount > 0 && (
        <div className="mb-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
            {connectedCount} provider{connectedCount > 1 ? 's' : ''} connected
          </p>
          {activeProvider && (
            <p className="text-[11px] text-green-600 dark:text-green-500 mt-0.5">
              Active: {getProvider(activeProvider.providerId).name} · {activeProvider.model}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-thin">
        {PROVIDERS.map((provider) => {
          const isConnected = !!connections[provider.id];
          const isActive = activeProvider?.providerId === provider.id;

          return (
            <button
              key={provider.id}
              onClick={() => handleProviderClick(provider.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                transition-all duration-150 border
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : isConnected
                    ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'bg-gray-50 dark:bg-[#2d2d2d] border-gray-200 dark:border-[#3a3a3a] hover:border-gray-300 dark:hover:border-[#555] hover:bg-white dark:hover:bg-[#333]'
                }`}
            >
              {/* Provider icon */}
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${provider.gradient}
                flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                {provider.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{provider.name}</p>
                  {isConnected && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
                      <Check className="w-2.5 h-2.5" /> Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{provider.description}</p>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-600 text-center leading-relaxed">
        Nova respects each provider's terms of service.
        API keys are stored locally and never shared.
      </p>
    </div>
  );
}
