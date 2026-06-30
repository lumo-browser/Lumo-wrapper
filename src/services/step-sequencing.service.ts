/**
 * Step Sequencing Service
 * Intelligent ordering and scheduling of actions based on dependencies,
 * priorities, and execution constraints
 */

import { Logger } from '@utils/logger';
import { DecomposedAction } from './agents/planner-agent';

export interface SequencingConstraint {
  type: 'ordering' | 'timing' | 'resource' | 'conditional' | 'retry';
  description: string;
  value?: unknown;
}

export interface SequencedAction extends DecomposedAction {
  sequence: number;
  estimatedDuration: number;
  maxRetries: number;
  timeout: number;
  rollbackAction?: DecomposedAction;
}

export interface SequenceStatistics {
  totalActions: number;
  parallelizable: number;
  criticalPath: string[]; // Action IDs on critical path
  estimatedTotalTime: number;
  estimatedParallelTime: number;
  hasCircularDependencies: boolean;
  unresolvedDependencies: string[];
}

/**
 * Service for intelligent step sequencing and scheduling
 */
export class StepSequencingService {
  private logger: Logger;
  private readonly ACTION_DURATIONS: Record<string, number> = {
    navigate: 3000,
    click: 500,
    type: 1000,
    select: 800,
    extract_text: 500,
    extract_table: 2000,
    extract_list: 1500,
    submit_form: 2000,
    click_submit_button: 500,
    wait_for_element: 5000,
    wait_for_navigation: 3000,
    check: 100,
    transform: 500,
    aggregate: 1000,
    merge: 100,
    verify: 500,
    interact: 1000,
    extract: 1000,
    submit: 2000
  };

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Sequence actions based on dependencies and constraints
   */
  public sequence(actions: DecomposedAction[], constraints?: SequencingConstraint[]): SequencedAction[] {
    this.logger.debug('StepSequencingService', 'Sequencing actions', {
      actionCount: actions.length
    });

    // Validate dependencies
    const validation = this.validateDependencies(actions);
    if (!validation.valid) {
      this.logger.warn('StepSequencingService', 'Dependency validation failed', {
        errors: validation.errors
      });
    }

    // Topological sort to sequence actions
    const sequenced = this.topologicalSort(actions);

    // Convert to SequencedAction with metadata
    const sequencedActions = sequenced.map((action, index) => ({
      ...action,
      sequence: index + 1,
      estimatedDuration: this.estimateDuration(action),
      maxRetries: this.getRetryCount(action),
      timeout: this.getTimeout(action),
      rollbackAction: this.generateRollback(action)
    }));

    // Apply constraints if provided
    if (constraints && constraints.length > 0) {
      return this.applyConstraints(sequencedActions, constraints);
    }

    return sequencedActions;
  }

  /**
   * Validate dependencies are resolved
   */
  private validateDependencies(
    actions: DecomposedAction[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const actionIds = new Set(actions.map((a) => a.actionId));

    for (const action of actions) {
      for (const dep of action.dependencies) {
        if (!actionIds.has(dep)) {
          errors.push(`Action ${action.actionId} depends on non-existent action ${dep}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Topological sort for dependency-based ordering
   */
  private topologicalSort(actions: DecomposedAction[]): DecomposedAction[] {
    const visited = new Set<string>();
    const result: DecomposedAction[] = [];
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    for (const action of actions) {
      if (!adjacencyList.has(action.actionId)) {
        adjacencyList.set(action.actionId, []);
      }
      for (const dep of action.dependencies) {
        if (!adjacencyList.has(dep)) {
          adjacencyList.set(dep, []);
        }
        adjacencyList.get(dep)!.push(action.actionId);
      }
    }

    // DFS-based topological sort
    const visit = (actionId: string) => {
      if (visited.has(actionId)) return;
      visited.add(actionId);

      const action = actions.find((a) => a.actionId === actionId);
      if (!action) return;

      // Visit dependencies first
      for (const dep of action.dependencies) {
        visit(dep);
      }

      result.push(action);
    };

    // Visit all actions
    for (const action of actions) {
      visit(action.actionId);
    }

    return result;
  }

  /**
   * Estimate action duration
   */
  private estimateDuration(action: DecomposedAction): number {
    return this.ACTION_DURATIONS[action.type] || 1000;
  }

  /**
   * Get retry count based on risk level
   */
  private getRetryCount(action: DecomposedAction): number {
    const type = action.type.toLowerCase();

    if (type.includes('submit') || type.includes('delete')) {
      return 1; // High-risk operations: minimal retries
    } else if (type.includes('wait') || type.includes('navigate')) {
      return 3; // Network operations: moderate retries
    } else {
      return 2; // Default: 2 retries
    }
  }

  /**
   * Get timeout for action
   */
  private getTimeout(action: DecomposedAction): number {
    const params = action.parameters as Record<string, unknown>;

    // Check if custom timeout provided
    if (params.timeout && typeof params.timeout === 'number') {
      return params.timeout;
    }

    // Calculate based on type
    const type = action.type.toLowerCase();
    if (type.includes('navigate')) {
      return 30000;
    } else if (type.includes('wait')) {
      return 15000;
    } else if (type.includes('extract')) {
      return 10000;
    } else {
      return 5000;
    }
  }

  /**
   * Generate rollback action for error recovery
   */
  private generateRollback(action: DecomposedAction): DecomposedAction | undefined {
    const type = action.type.toLowerCase();

    // Only high-risk actions need rollback
    if (type.includes('submit') || type.includes('delete') || type.includes('save')) {
      return {
        actionId: `${action.actionId}:rollback`,
        type: 'rollback',
        description: `Rollback for ${action.type}`,
        parameters: { original_action: action.actionId },
        priority: 0,
        dependencies: [action.actionId]
      };
    }

    return undefined;
  }

  /**
   * Apply sequencing constraints
   */
  private applyConstraints(
    actions: SequencedAction[],
    constraints: SequencingConstraint[]
  ): SequencedAction[] {
    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'ordering':
          // Reorder based on constraint value
          actions = this.applyOrderingConstraint(actions, constraint);
          break;
        case 'timing':
          // Apply timing constraints
          actions = this.applyTimingConstraint(actions, constraint);
          break;
        case 'resource':
          // Apply resource constraints
          actions = this.applyResourceConstraint(actions, constraint);
          break;
        case 'conditional':
          // Apply conditional constraints
          actions = this.applyConditionalConstraint(actions, constraint);
          break;
      }
    }

    return actions;
  }

  /**
   * Apply ordering constraint
   */
  private applyOrderingConstraint(
    actions: SequencedAction[],
    constraint: SequencingConstraint
  ): SequencedAction[] {
    // Re-sequence based on specified order
    this.logger.debug('StepSequencingService', 'Applying ordering constraint', {
      constraint: constraint.description
    });

    return actions; // Placeholder - real implementation would reorder
  }

  /**
   * Apply timing constraint
   */
  private applyTimingConstraint(
    actions: SequencedAction[],
    constraint: SequencingConstraint
  ): SequencedAction[] {
    this.logger.debug('StepSequencingService', 'Applying timing constraint', {
      constraint: constraint.description
    });

    // Adjust timeouts based on constraint
    if (constraint.value && typeof constraint.value === 'number') {
      for (const action of actions) {
        if (action.estimatedDuration > constraint.value) {
          action.timeout = Math.max(action.timeout, action.estimatedDuration * 2);
        }
      }
    }

    return actions;
  }

  /**
   * Apply resource constraint
   */
  private applyResourceConstraint(
    actions: SequencedAction[],
    constraint: SequencingConstraint
  ): SequencedAction[] {
    this.logger.debug('StepSequencingService', 'Applying resource constraint', {
      constraint: constraint.description
    });

    // Force sequential execution if resource-limited
    return actions.map((action, index) => ({
      ...action,
      dependencies: index > 0 ? [actions[index - 1].actionId] : action.dependencies
    }));
  }

  /**
   * Apply conditional constraint
   */
  private applyConditionalConstraint(
    actions: SequencedAction[],
    constraint: SequencingConstraint
  ): SequencedAction[] {
    this.logger.debug('StepSequencingService', 'Applying conditional constraint', {
      constraint: constraint.description
    });

    return actions;
  }

  /**
   * Calculate sequence statistics
   */
  public getStatistics(actions: SequencedAction[]): SequenceStatistics {
    this.logger.debug('StepSequencingService', 'Calculating sequence statistics');

    const stats: SequenceStatistics = {
      totalActions: actions.length,
      parallelizable: this.countParallelizable(actions),
      criticalPath: this.calculateCriticalPath(actions),
      estimatedTotalTime: this.calculateSequentialTime(actions),
      estimatedParallelTime: this.calculateParallelTime(actions),
      hasCircularDependencies: this.hasCircularDeps(actions),
      unresolvedDependencies: this.findUnresolvedDeps(actions)
    };

    return stats;
  }

  /**
   * Count parallelizable actions
   */
  private countParallelizable(actions: SequencedAction[]): number {
    let count = 0;

    for (let i = 0; i < actions.length - 1; i++) {
      const current = actions[i];
      const next = actions[i + 1];

      // Check if next doesn't depend on current
      if (!next.dependencies.includes(current.actionId)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Calculate critical path (longest dependency chain)
   */
  private calculateCriticalPath(actions: SequencedAction[]): string[] {
    const paths: string[][] = [];

    for (const action of actions) {
      if (action.dependencies.length === 0) {
        paths.push([action.actionId]);
      } else {
        for (const dep of action.dependencies) {
          const depPath = this.findPath(dep, actions);
          paths.push([...depPath, action.actionId]);
        }
      }
    }

    // Return longest path
    return paths.reduce((a, b) => (a.length > b.length ? a : b), []);
  }

  /**
   * Find path to action
   */
  private findPath(actionId: string, actions: SequencedAction[]): string[] {
    const action = actions.find((a) => a.actionId === actionId);
    if (!action || action.dependencies.length === 0) {
      return [actionId];
    }

    const paths = action.dependencies.map((dep) => this.findPath(dep, actions));
    const longest = paths.reduce((a, b) => (a.length > b.length ? a : b), []);

    return [...longest, actionId];
  }

  /**
   * Calculate sequential execution time
   */
  private calculateSequentialTime(actions: SequencedAction[]): number {
    return actions.reduce((sum, action) => sum + action.estimatedDuration, 0);
  }

  /**
   * Calculate parallel execution time (critical path)
   */
  private calculateParallelTime(actions: SequencedAction[]): number {
    const criticalPath = this.calculateCriticalPath(actions);
    const pathActions = actions.filter((a) => criticalPath.includes(a.actionId));
    return pathActions.reduce((sum, action) => sum + action.estimatedDuration, 0);
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDeps(actions: SequencedAction[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (actionId: string): boolean => {
      visited.add(actionId);
      recursionStack.add(actionId);

      const action = actions.find((a) => a.actionId === actionId);
      if (!action) return false;

      for (const dep of action.dependencies) {
        if (recursionStack.has(dep)) {
          return true;
        }
        if (!visited.has(dep) && hasCycle(dep)) {
          return true;
        }
      }

      recursionStack.delete(actionId);
      return false;
    };

    for (const action of actions) {
      if (!visited.has(action.actionId)) {
        if (hasCycle(action.actionId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Find unresolved dependencies
   */
  private findUnresolvedDeps(actions: SequencedAction[]): string[] {
    const actionIds = new Set(actions.map((a) => a.actionId));
    const unresolved: string[] = [];

    for (const action of actions) {
      for (const dep of action.dependencies) {
        if (!actionIds.has(dep)) {
          unresolved.push(dep);
        }
      }
    }

    return [...new Set(unresolved)];
  }

  /**
   * Estimate optimal parallelization factor
   */
  public estimateParallelizationFactor(actions: SequencedAction[]): number {
    if (actions.length === 0) return 1;

    const sequential = this.calculateSequentialTime(actions);
    const parallel = this.calculateParallelTime(actions);

    // Speedup factor = sequential time / parallel time
    return parallel > 0 ? sequential / parallel : 1;
  }

  /**
   * Suggest optimization strategies
   */
  public suggestOptimizations(actions: SequencedAction[]): string[] {
    const suggestions: string[] = [];
    const stats = this.getStatistics(actions);

    if (stats.hasCircularDependencies) {
      suggestions.push('ERROR: Circular dependencies detected - cannot sequence');
    }

    if (stats.unresolvedDependencies.length > 0) {
      suggestions.push(
        `WARNING: Unresolved dependencies - ${stats.unresolvedDependencies.join(', ')}`
      );
    }

    const parallelFactor = this.estimateParallelizationFactor(actions);
    if (parallelFactor < 1.5) {
      suggestions.push(
        'Low parallelization potential - consider sequential execution for clarity'
      );
    } else if (parallelFactor > 3) {
      suggestions.push('High parallelization potential - consider executing independent actions in parallel');
    }

    if (stats.totalActions > 10) {
      suggestions.push('Large plan - consider breaking into smaller sub-workflows');
    }

    return suggestions;
  }
}
