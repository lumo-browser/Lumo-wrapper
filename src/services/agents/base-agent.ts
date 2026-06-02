/**
 * Base Agent Framework
 * Abstract base class for all AI agents in Lumo Browser
 * Provides common interface for agent lifecycle, execution, and communication
 */

import { Logger } from '@utils/logger';
import { Agent, WorkflowPlan, WorkflowAction } from '@types';

export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export interface AgentContext {
  conversationId: string;
  sessionId: string;
  pageContext?: {
    url: string;
    title: string;
    content: string;
  };
  previousResults?: WorkflowAction[];
  variables?: Record<string, unknown>;
}

export interface AgentMessage {
  type: 'log' | 'warning' | 'error' | 'result';
  content: string;
  timestamp: number;
}

/**
 * Abstract base class for all AI agents
 * Defines the interface that all agents must implement
 */
export abstract class BaseAgent {
  protected logger: Logger;
  protected agentId: string;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected messages: AgentMessage[] = [];
  protected context?: AgentContext;

  constructor(agentId: string, agentType: string) {
    this.logger = Logger.getInstance();
    this.agentId = `${agentType}:${agentId}`;
  }

  /**
   * Initialize the agent with context
   */
  public initialize(context: AgentContext): void {
    this.context = context;
    this.logger.info(`Agent ${this.agentId} initialized`, {
      scope: 'Agent',
      agentId: this.agentId,
      conversationId: context.conversationId
    });
  }

  /**
   * Get current agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent messages
   */
  public getMessages(): AgentMessage[] {
    return this.messages;
  }

  /**
   * Clear agent messages
   */
  public clearMessages(): void {
    this.messages = [];
  }

  /**
   * Add a message to the agent's message queue
   */
  protected addMessage(type: AgentMessage['type'], content: string): void {
    this.messages.push({
      type,
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Get agent metadata
   */
  public getMetadata(): Agent {
    return {
      id: this.agentId,
      name: this.agentId,
      type: 'base',
      status: this.status,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Execute the agent's primary task
   * Must be implemented by subclasses
   */
  abstract execute(): Promise<unknown>;

  /**
   * Validate preconditions for agent execution
   */
  protected validateContext(): boolean {
    if (!this.context) {
      this.addMessage('error', 'Agent context not initialized');
      return false;
    }
    return true;
  }

  /**
   * Handle errors during execution
   */
  protected handleError(error: Error): void {
    this.status = AgentStatus.FAILED;
    this.addMessage('error', `${error.name}: ${error.message}`);
    this.logger.error(`Agent ${this.agentId} failed`, {
      scope: 'Agent',
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Reset agent to idle state
   */
  public reset(): void {
    this.status = AgentStatus.IDLE;
    this.clearMessages();
    this.logger.debug(`Agent ${this.agentId} reset`, {
      scope: 'Agent',
      agentId: this.agentId
    });
  }
}
