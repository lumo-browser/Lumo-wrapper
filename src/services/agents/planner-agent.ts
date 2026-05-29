/**
 * Planner Agent
 * Responsible for parsing user goals, decomposing them into actions,
 * sequencing steps, detecting errors, and providing confidence scoring
 */

import { BaseAgent, AgentContext, AgentStatus, AgentMessage } from './base-agent';
import { WorkflowPlan, WorkflowAction } from '@types';
import { Validator } from '@utils/validators';
import { APP_VERSION, SYSTEM_PROMPTS } from '@core/constants';

export interface ParsedGoal {
  originalGoal: string;
  mainObjective: string;
  constraints: string[];
  expectedOutcome: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface DecomposedAction {
  actionId: string;
  type: string;
  description: string;
  parameters: Record<string, unknown>;
  priority: number;
  dependencies: string[];
}

export interface SequencedStep {
  stepNumber: number;
  action: DecomposedAction;
  estimatedDuration: number;
  rollbackAction?: DecomposedAction;
}

export interface PlannerOutput {
  plan: WorkflowPlan;
  confidence: number;
  errors: string[];
  warnings: string[];
  estimatedDuration: number;
}

/**
 * Planner Agent - Decomposes goals into actionable steps
 */
export class PlannerAgent extends BaseAgent {
  private validator: Validator;

  constructor() {
    super('planner', 'agent');
    this.validator = new Validator();
  }

  /**
   * Main execute method - creates a plan from a goal
   */
  async execute(): Promise<PlannerOutput> {
    if (!this.validateContext()) {
      throw new Error('Planner agent context not initialized');
    }

    this.status = AgentStatus.THINKING;
    this.addMessage('log', 'Planner agent started');

    try {
      // This would normally call an LLM in production
      const goal = this.context?.variables?.goal as string;
      if (!goal) {
        throw new Error('No goal provided for planning');
      }

      // Parse the goal
      const parsedGoal = this.parseGoal(goal);
      this.addMessage('log', `Parsed goal: ${parsedGoal.mainObjective}`);

      // Decompose into actions
      const actions = this.decomposeGoal(parsedGoal);
      this.addMessage('log', `Decomposed into ${actions.length} actions`);

      // Sequence the steps
      const steps = this.sequenceActions(actions);
      this.addMessage('log', `Sequenced into ${steps.length} steps`);

      // Detect errors
      const errors = this.detectErrors(steps);
      const warnings = this.detectWarnings(steps);

      // Calculate confidence
      const confidence = this.calculateConfidence(steps, errors);

      // Estimate duration
      const estimatedDuration = this.estimateDuration(steps);

      // Create final plan
      const plan: WorkflowPlan = {
        id: this.generatePlanId(),
        goal,
        actions: steps.map((s) => s.action),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.status = AgentStatus.COMPLETED;
      this.addMessage('log', 'Plan created successfully');

      return {
        plan,
        confidence,
        errors,
        warnings,
        estimatedDuration
      };
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Parse user goal into structured format
   */
  private parseGoal(goal: string): ParsedGoal {
    this.logger.debug('Parsing goal', { scope: 'Planner', goal });

    // Validate goal format
    if (!this.validator.validateString(goal, 5, 500)) {
      throw new Error('Invalid goal format');
    }

    // Simple heuristic-based parsing
    const lowerGoal = goal.toLowerCase();

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (
      lowerGoal.includes('and') ||
      lowerGoal.includes('then') ||
      lowerGoal.includes('multiple')
    ) {
      complexity = 'moderate';
    }
    if (
      lowerGoal.includes('complex') ||
      lowerGoal.includes('workflow') ||
      lowerGoal.includes('sequence')
    ) {
      complexity = 'complex';
    }

    // Extract constraints
    const constraints: string[] = [];
    if (lowerGoal.includes('without')) {
      constraints.push('avoid_specific_actions');
    }
    if (lowerGoal.includes('quickly')) {
      constraints.push('optimize_speed');
    }

    return {
      originalGoal: goal,
      mainObjective: goal.split('.')[0].trim(), // Take first sentence
      constraints,
      expectedOutcome: `Completion of: ${goal.split('.')[0]}`,
      complexity
    };
  }

  /**
   * Decompose goal into individual actions
   */
  private decomposeGoal(parsedGoal: ParsedGoal): DecomposedAction[] {
    this.logger.debug('Decomposing goal', { scope: 'Planner', goal: parsedGoal.mainObjective });

    const actions: DecomposedAction[] = [];
    const baseId = this.generateId();

    // Simple decomposition strategy
    // In production, this would use LLM to intelligently break down goals
    if (parsedGoal.complexity === 'simple') {
      actions.push({
        actionId: `${baseId}-1`,
        type: 'navigate',
        description: `Navigate to target based on: ${parsedGoal.mainObjective}`,
        parameters: { url: '' },
        priority: 1,
        dependencies: []
      });
    } else if (parsedGoal.complexity === 'moderate') {
      actions.push(
        {
          actionId: `${baseId}-1`,
          type: 'navigate',
          description: 'Navigate to initial page',
          parameters: { url: '' },
          priority: 1,
          dependencies: []
        },
        {
          actionId: `${baseId}-2`,
          type: 'interact',
          description: 'Interact with page elements',
          parameters: { selector: '', action: 'click' },
          priority: 2,
          dependencies: [`${baseId}-1`]
        }
      );
    } else {
      // Complex workflow
      actions.push(
        {
          actionId: `${baseId}-1`,
          type: 'navigate',
          description: 'Navigate to initial page',
          parameters: { url: '' },
          priority: 1,
          dependencies: []
        },
        {
          actionId: `${baseId}-2`,
          type: 'interact',
          description: 'Perform first interaction',
          parameters: { selector: '', action: 'click' },
          priority: 2,
          dependencies: [`${baseId}-1`]
        },
        {
          actionId: `${baseId}-3`,
          type: 'extract',
          description: 'Extract data from page',
          parameters: { selector: '', attribute: 'text' },
          priority: 3,
          dependencies: [`${baseId}-2`]
        }
      );
    }

    return actions;
  }

  /**
   * Sequence actions based on dependencies
   */
  private sequenceActions(actions: DecomposedAction[]): SequencedStep[] {
    this.logger.debug('Sequencing actions', { scope: 'Planner', count: actions.length });

    // Sort by dependencies and priority
    const sorted = actions.sort((a, b) => {
      if (a.dependencies.includes(b.actionId)) return 1;
      if (b.dependencies.includes(a.actionId)) return -1;
      return a.priority - b.priority;
    });

    return sorted.map((action, index) => ({
      stepNumber: index + 1,
      action,
      estimatedDuration: this.estimateActionDuration(action),
      rollbackAction: this.createRollbackAction(action)
    }));
  }

  /**
   * Detect errors in the plan
   */
  private detectErrors(steps: SequencedStep[]): string[] {
    this.logger.debug('Detecting errors in plan', { scope: 'Planner', steps: steps.length });

    const errors: string[] = [];

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(steps);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    // Check for missing dependencies
    const allActionIds = new Set(steps.map((s) => s.action.actionId));
    for (const step of steps) {
      for (const dep of step.action.dependencies) {
        if (!allActionIds.has(dep)) {
          errors.push(`Missing dependency: ${dep} for action ${step.action.actionId}`);
        }
      }
    }

    return errors;
  }

  /**
   * Detect warnings in the plan
   */
  private detectWarnings(steps: SequencedStep[]): string[] {
    this.logger.debug('Detecting warnings in plan', { scope: 'Planner', steps: steps.length });

    const warnings: string[] = [];

    // Check for long sequences
    if (steps.length > 10) {
      warnings.push(`Plan has ${steps.length} steps (might be complex)`);
    }

    // Check for high-risk actions
    for (const step of steps) {
      if (step.action.type === 'delete' || step.action.type === 'submit') {
        warnings.push(`High-risk action detected: ${step.action.type}`);
      }
    }

    // Check for unquantified parameters
    for (const step of steps) {
      const params = step.action.parameters;
      if (params.url === '' || params.selector === '') {
        warnings.push(`Action ${step.action.actionId} has unspecified parameters`);
      }
    }

    return warnings;
  }

  /**
   * Calculate confidence score for the plan
   */
  private calculateConfidence(steps: SequencedStep[], errors: string[]): number {
    // Start with 100
    let confidence = 100;

    // Reduce by number of errors (20 points each)
    confidence -= errors.length * 20;

    // Reduce based on missing parameters
    for (const step of steps) {
      const params = Object.values(step.action.parameters);
      const emptyParams = params.filter((p) => p === '' || p === null).length;
      confidence -= emptyParams * 5;
    }

    // Reduce based on complex dependencies
    for (const step of steps) {
      confidence -= step.action.dependencies.length * 3;
    }

    // Ensure confidence is between 0 and 100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Estimate action duration in milliseconds
   */
  private estimateActionDuration(action: DecomposedAction): number {
    const durationMap: Record<string, number> = {
      navigate: 3000,
      interact: 1000,
      extract: 500,
      wait: 2000,
      delete: 500,
      submit: 2000
    };

    return durationMap[action.type] || 1000;
  }

  /**
   * Estimate total plan duration
   */
  private estimateDuration(steps: SequencedStep[]): number {
    return steps.reduce((total, step) => total + step.estimatedDuration, 0);
  }

  /**
   * Create rollback action for error recovery
   */
  private createRollbackAction(action: DecomposedAction): DecomposedAction | undefined {
    // Only high-risk actions get rollback actions
    if (action.type === 'delete' || action.type === 'submit') {
      return {
        actionId: `${action.actionId}-rollback`,
        type: 'undo',
        description: `Rollback for ${action.type}`,
        parameters: { actionId: action.actionId },
        priority: 1,
        dependencies: [action.actionId]
      };
    }

    return undefined;
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(steps: SequencedStep[]): string[] {
    const circular: string[] = [];

    for (const step of steps) {
      const visited = new Set<string>();
      if (this.hasCycle(step.action.actionId, step.action.dependencies, steps, visited)) {
        circular.push(step.action.actionId);
      }
    }

    return circular;
  }

  /**
   * Check if there's a cycle in dependencies
   */
  private hasCycle(
    actionId: string,
    dependencies: string[],
    steps: SequencedStep[],
    visited: Set<string>
  ): boolean {
    if (visited.has(actionId)) return true;

    visited.add(actionId);

    for (const dep of dependencies) {
      const depStep = steps.find((s) => s.action.actionId === dep);
      if (depStep && this.hasCycle(dep, depStep.action.dependencies, steps, visited)) {
        return true;
      }
    }

    visited.delete(actionId);
    return false;
  }

  /**
   * Generate unique plan ID
   */
  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate unique action ID
   */
  private generateId(): string {
    return `plan_${Date.now()}`;
  }
}
