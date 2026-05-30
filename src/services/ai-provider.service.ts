/**
 * AI Provider Service — Real API calls to user-connected providers
 *
 * BYOA model: calls go directly from the browser to the provider's official API.
 * Nova never proxies or intercepts provider communication.
 * Each provider uses the user's own API key.
 */

import type { ProviderId } from '../types/ai-provider.types';
import { getProvider } from '../types/ai-provider.types';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProviderResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Send a chat message to the user's connected AI provider.
 * Throws if the request fails (wrong key, network error, rate limit).
 */
export async function sendToProvider(
  providerId: ProviderId,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<ProviderResponse> {
  switch (providerId) {
    case 'openai':
    case 'deepseek':
    case 'grok':
    case 'perplexity':
      return callOpenAICompatible(providerId, apiKey, model, messages, signal);
    case 'anthropic':
      return callAnthropic(apiKey, model, messages, signal);
    case 'gemini':
      return callGemini(apiKey, model, messages, signal);
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

// ── OpenAI-Compatible (OpenAI, DeepSeek, Grok, Perplexity) ────────────────
async function callOpenAICompatible(
  providerId: ProviderId,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<ProviderResponse> {
  const provider = getProvider(providerId);
  const url = `${provider.baseUrl}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 1024, stream: false }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message
        ?? `${provider.name} API error: ${res.status}`
    );
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    model: data.model,
    usage: data.usage
      ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
      : undefined,
  };
}

// ── Anthropic (Claude) ─────────────────────────────────────────────────────
async function callAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<ProviderResponse> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMsgs  = messages.filter((m) => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemMsg?.content,
      messages: chatMsgs.map((m) => ({ role: m.role, content: m.content })),
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message
        ?? `Claude API error: ${res.status}`
    );
  }

  const data = await res.json() as {
    content: Array<{ text: string }>;
    model: string;
    usage?: { input_tokens: number; output_tokens: number };
  };

  return {
    content: data.content[0]?.text ?? '',
    model: data.model,
    usage: data.usage
      ? { promptTokens: data.usage.input_tokens, completionTokens: data.usage.output_tokens }
      : undefined,
  };
}

// ── Gemini ─────────────────────────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<ProviderResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message
        ?? `Gemini API error: ${res.status}`
    );
  }

  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  };

  return {
    content: data.candidates[0]?.content?.parts[0]?.text ?? '',
    model,
    usage: data.usageMetadata
      ? { promptTokens: data.usageMetadata.promptTokenCount, completionTokens: data.usageMetadata.candidatesTokenCount }
      : undefined,
  };
}

/**
 * Validate an API key format before trying a real request.
 * Returns null if valid, an error string if invalid.
 */
export function validateKeyFormat(providerId: ProviderId, key: string): string | null {
  const provider = getProvider(providerId);
  const trimmed = key.trim();

  if (!trimmed) return 'API key cannot be empty.';
  if (trimmed.length < 16) return 'API key is too short.';

  if (provider.keyPrefix && !trimmed.startsWith(provider.keyPrefix)) {
    return `${provider.name} API keys start with "${provider.keyPrefix}". Please check your key.`;
  }

  return null;
}
