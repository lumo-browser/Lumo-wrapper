/**
 * AI Provider Types — BYOA (Bring Your Own Account) model
 *
 * Nova never stores passwords. Users connect their own API keys
 * from their chosen provider's official dashboard.
 */

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'perplexity'
  | 'deepseek'
  | 'grok';

export type ProviderStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AIProvider {
  id: ProviderId;
  name: string;
  shortName: string;
  description: string;
  /** URL to the provider's official API key page */
  apiKeyUrl: string;
  /** Key format hint shown to user */
  keyPrefix: string;
  keyPlaceholder: string;
  /** Provider brand color */
  color: string;
  /** Gradient for provider card */
  gradient: string;
  /** OpenAI-compatible base URL (null = custom implementation) */
  baseUrl: string;
  /** Model to use by default */
  defaultModel: string;
}

export interface ProviderConnection {
  providerId: ProviderId;
  /** Encrypted API key stored in localStorage */
  encryptedKey: string;
  connectedAt: string; // ISO string
  displayName: string;
  model: string;
}

export interface AIProviderState {
  /** Currently active provider connection */
  activeProvider: ProviderConnection | null;
  /** All connected providers */
  connections: Record<ProviderId, ProviderConnection>;
  status: ProviderStatus;
  error: string | null;
}

/** Supported provider definitions */
export const PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'ChatGPT',
    shortName: 'OpenAI',
    description: 'GPT-4o, GPT-4 Turbo, and more from OpenAI',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    color: '#10a37f',
    gradient: 'from-[#10a37f] to-[#0d8a6b]',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'anthropic',
    name: 'Claude',
    shortName: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Haiku, and Opus from Anthropic',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    color: '#d4a574',
    gradient: 'from-[#c96442] to-[#a0522d]',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-haiku-20241022',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    shortName: 'Google',
    description: 'Gemini 1.5 Pro, Flash, and more from Google',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIza...',
    color: '#4285f4',
    gradient: 'from-[#4285f4] to-[#0f9d58]',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-flash',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    shortName: 'Perplexity',
    description: 'Real-time web search + AI answers',
    apiKeyUrl: 'https://www.perplexity.ai/settings/api',
    keyPrefix: 'pplx-',
    keyPlaceholder: 'pplx-...',
    color: '#20b2aa',
    gradient: 'from-[#20b2aa] to-[#008b8b]',
    baseUrl: 'https://api.perplexity.ai',
    defaultModel: 'llama-3.1-sonar-small-128k-online',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    shortName: 'DeepSeek',
    description: 'DeepSeek Chat and Coder models',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    color: '#4f46e5',
    gradient: 'from-[#4f46e5] to-[#7c3aed]',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  {
    id: 'grok',
    name: 'Grok',
    shortName: 'xAI',
    description: 'Grok 2 and Grok Vision from xAI',
    apiKeyUrl: 'https://console.x.ai',
    keyPrefix: 'xai-',
    keyPlaceholder: 'xai-...',
    color: '#1d1d1d',
    gradient: 'from-[#333] to-[#111]',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
  },
];

export const getProvider = (id: ProviderId): AIProvider =>
  PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
