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

export interface HomePageData {
  tasks: RecentTask[];
  actions: QuickAction[];
  providers: AIProvider[];
  status: string;
}

export interface Task {
  id: string;
  goal: string;
  status: 'completed' | 'failed' | 'in-progress' | 'pending';
  timestamp: Date;
  result?: string;
  confidence_score?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: string[];
  status: 'active' | 'inactive';
}
