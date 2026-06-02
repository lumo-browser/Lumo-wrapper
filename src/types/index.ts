/**
 * Core type definitions for Lumo Browser
 * These types are shared across all layers
 */

// Browser Types
export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isDirty: boolean;
  createdAt: Date;
}

export interface BrowserState {
  tabs: Tab[];
  activeTabId: string | null;
  history: HistoryEntry[];
  bookmarks: Bookmark[];
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitedAt: Date;
  visitCount: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folder: string;
  createdAt: Date;
}

// AI & Automation Types
export interface AIGoal {
  id: string;
  description: string;
  context?: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkflowAction {
  id: string;
  type: 'click' | 'type' | 'scroll' | 'navigate' | 'extract' | 'wait' | 'screenshot';
  selector?: string;
  value?: string;
  parameters?: Record<string, unknown>;
  description: string;
}

export interface WorkflowPlan {
  id: string;
  goalId: string;
  actions: WorkflowAction[];
  description: string;
  createdAt: Date;
}

export interface WorkflowExecution {
  id: string;
  planId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  actions: WorkflowActionResult[];
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface WorkflowActionResult {
  actionId: string;
  status: 'success' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
  duration: number; // milliseconds
}

// Page Context
export interface PageContext {
  url: string;
  title: string;
  text: string;
  html: string;
  screenshot?: string;
  metadata?: Record<string, unknown>;
}

// Permissions
export type PermissionScope =
  | 'read:page'
  | 'interact:click'
  | 'interact:type'
  | 'extract:data'
  | 'navigate:url'
  | 'execute:purchase'
  | 'execute:payment'
  | 'execute:password_change'
  | 'execute:send_message';

export interface Permission {
  id: string;
  scope: PermissionScope;
  website: string;
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
}

// Audit Log
export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  scope: PermissionScope;
  userConfirmed: boolean;
  result: 'success' | 'failure';
  error?: string;
  metadata?: Record<string, unknown>;
}

// Agent Types
export interface Agent {
  name: string;
  version: string;
  execute(): Promise<unknown>;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: string;
  payload: unknown;
  timestamp: Date;
}

// Conversation
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoSave: boolean;
  confirmSensitiveActions: boolean;
  defaultLLMProvider: 'openai' | 'claude' | 'gemini';
}

// LLM Configuration
export interface LLMConfig {
  provider: 'openai' | 'claude' | 'gemini';
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
}

// Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
