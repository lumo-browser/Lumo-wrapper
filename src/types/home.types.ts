/**
 * Home Page Types
 */

export interface RecentTask {
  id: string;
  goal: string;
  status: 'completed' | 'failed' | 'in-progress';
  timestamp: Date;
  result?: string;
  confidence?: number;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'research' | 'productivity' | 'automation' | 'tools';
  action: () => void;
  tags: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  model?: string;
  lastUsed?: Date;
}

export interface HomeState {
  recentTasks: RecentTask[];
  suggestedActions: QuickAction[];
  aiProviders: AIProvider[];
  systemStatus: 'ready' | 'busy' | 'error';
  loading: boolean;
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
}
