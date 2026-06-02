export type AIProviderId = 'Lumo' | 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'deepseek' | 'grok' | 'custom';

export interface AIProviderDef {
  id: AIProviderId;
  name: string;
  url: string;
  color: string;
}

export const AI_PROVIDERS: AIProviderDef[] = [
  { id: 'Lumo',       name: 'Lumo Assistant', url: 'Lumo://assistant', color: 'bg-blue-500' },
  { id: 'chatgpt',    name: 'ChatGPT',        url: 'https://chatgpt.com', color: 'bg-emerald-600' },
  { id: 'claude',     name: 'Claude',         url: 'https://claude.ai', color: 'bg-amber-600' },
  { id: 'gemini',     name: 'Gemini',         url: 'https://gemini.google.com', color: 'bg-blue-600' },
  { id: 'perplexity', name: 'Perplexity',     url: 'https://www.perplexity.ai', color: 'bg-teal-500' },
  { id: 'deepseek',   name: 'DeepSeek',       url: 'https://chat.deepseek.com', color: 'bg-indigo-600' },
  { id: 'grok',       name: 'Grok',           url: 'https://grok.com', color: 'bg-gray-800' },
];

export interface AISpaceTab {
  id: string; // unique instance ID for this tab
  providerId: AIProviderId;
  customUrl?: string; // for custom providers
  customName?: string;
  isPinned: boolean;
}
