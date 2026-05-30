// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: string;
  user_id: string;
  goal: string;
  status: 'completed' | 'failed' | 'in-progress';
  result?: string;
  confidence_score?: number;
  timestamp: string;
  created_at: string;
}

// Provider types
export interface AIProvider {
  id: string;
  user_id: string;
  name: string;
  provider_type: string;
  status: 'connected' | 'disconnected' | 'error';
  model?: string;
  last_used?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Action types
export interface QuickAction {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  icon?: string;
  category: string;
  action_type: string;
  execution_count: number;
  last_executed?: string;
  created_at: string;
}

// Workflow types
export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'hourly' | 'every-6h' | 'weekly';
  enabled: boolean;
  execution_count: number;
  last_executed?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    status: number;
    timestamp: string;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in: number;
}

// Home page data
export interface HomePageData {
  recentTasks: Task[];
  suggestedActions: QuickAction[];
  aiProviders: AIProvider[];
  workflows: Workflow[];
  systemStatus: 'ready' | 'busy' | 'error';
}
