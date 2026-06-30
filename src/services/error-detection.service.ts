/**
 * Error Detection Service
 * Identifies potential errors, warnings, and issues in execution plans
 */

import { Logger } from '@utils/logger';
import { SequencedAction } from './step-sequencing.service';
import type { WorkflowPlan } from '../types/index';

export interface DetectedError {
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  affectedActions: string[];
  severity: number; // 1-10
  suggestion?: string;
}

export interface ValidationReport {
  planId: string;
  isValid: boolean;
  errors: DetectedError[];
  totalSeverity: number;
  riskScore: number; // 0-100
  recommendations: string[];
}

/**
 * Service for detecting errors and issues in workflow plans
 */
export class ErrorDetectionService {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Validate a plan and detect errors
   */
  public validate(plan: WorkflowPlan, actions?: SequencedAction[]): ValidationReport {
    this.logger.debug('ErrorDetectionService', 'Validating plan', {
      planId: plan.id
    });

    const errors: DetectedError[] = [];

    // Run all validation checks
    errors.push(...this.checkDependencies(plan, actions));
    errors.push(...this.checkParameters(plan, actions));
    errors.push(...this.checkRiskLevel(plan, actions));
    errors.push(...this.checkComplexity(plan));
    errors.push(...this.checkResourceUsage(plan, actions));
    errors.push(...this.checkTimeout(plan, actions));

    // Calculate metrics
    const totalSeverity = errors.reduce((sum, e) => sum + e.severity, 0);
    const riskScore = this.calculateRiskScore(errors, plan, actions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(errors, plan);

    return {
      planId: plan.id,
      isValid: errors.filter((e) => e.type === 'critical').length === 0,
      errors,
      totalSeverity,
      riskScore,
      recommendations
    };
  }

  /**
   * Check for dependency errors
   */
  private checkDependencies(_plan: WorkflowPlan, actions?: SequencedAction[]): DetectedError[] {
    const errors: DetectedError[] = [];

    if (!actions || actions.length === 0) {
      return errors;
    }

    const actionIds = new Set(actions.map((a) => a.actionId));

    for (const action of actions) {
      // Check for missing dependencies
      for (const dep of action.dependencies) {
        if (!actionIds.has(dep)) {
          errors.push({
            type: 'critical',
            category: 'MissingDependency',
            message: `Action ${action.actionId} depends on non-existent action ${dep}`,
            affectedActions: [action.actionId],
            severity: 10,
            suggestion: `Remove dependency on ${dep} or add the missing action`
          });
        }
      }

      // Check for circular dependencies
      if (this.hasCircularDependency(action, actions)) {
        errors.push({
          type: 'critical',
          category: 'CircularDependency',
          message: `Circular dependency detected involving ${action.actionId}`,
          affectedActions: [action.actionId],
          severity: 10,
          suggestion: 'Review action dependencies and break circular references'
        });
      }
    }

    // Check for orphaned actions (unreachable)
    const reachable = this.getReachableActions(actions);
    for (const action of actions) {
      if (!reachable.has(action.actionId)) {
        errors.push({
          type: 'warning',
          category: 'UnreachableAction',
          message: `Action ${action.actionId} is unreachable from initial actions`,
          affectedActions: [action.actionId],
          severity: 5,
          suggestion: 'Either add dependencies to make action reachable or remove it'
        });
      }
    }

    return errors;
  }

  /**
   * Check for parameter errors
   */
  private checkParameters(_plan: WorkflowPlan, actions?: SequencedAction[]): DetectedError[] {
    const errors: DetectedError[] = [];

    if (!actions) {
      return errors;
    }

    for (const action of actions) {
      const params = action.parameters;

      // Check for unspecified required parameters
      if (action.type === 'navigate' && (!params.url || params.url === '')) {
        errors.push({
          type: 'warning',
          category: 'UnspecifiedParameter',
          message: `Action ${action.actionId} (${action.type}) is missing URL parameter`,
          affectedActions: [action.actionId],
          severity: 6,
          suggestion: 'Specify target URL for navigation'
        });
      }

      if ((action.type === 'click' || action.type === 'type') && (!params.selector || params.selector === '')) {
        errors.push({
          type: 'warning',
          category: 'UnspecifiedParameter',
          message: `Action ${action.actionId} (${action.type}) is missing selector parameter`,
          affectedActions: [action.actionId],
          severity: 6,
          suggestion: 'Specify CSS selector or element locator'
        });
      }

      // Check for invalid parameter types
      if (params.timeout && typeof params.timeout !== 'number') {
        errors.push({
          type: 'warning',
          category: 'InvalidParameterType',
          message: `Action ${action.actionId}: timeout should be a number, got ${typeof params.timeout}`,
          affectedActions: [action.actionId],
          severity: 4,
          suggestion: 'Provide timeout as a number in milliseconds'
        });
      }
    }

    return errors;
  }

  /**
   * Check for risk level issues
   */
  private checkRiskLevel(_plan: WorkflowPlan, actions?: SequencedAction[]): DetectedError[] {
    const errors: DetectedError[] = [];

    if (!actions) {
      return errors;
    }

    let highRiskCount = 0;

    for (const action of actions) {
      const type = action.type.toLowerCase();

      // Check for high-risk operations without proper setup
      if (type.includes('submit') || type.includes('delete')) {
        highRiskCount++;

        // Check for missing rollback
        if (!action.rollbackAction) {
          errors.push({
            type: 'warning',
            category: 'HighRiskOperation',
            message: `High-risk operation ${action.actionId} (${action.type}) has no rollback`,
            affectedActions: [action.actionId],
            severity: 8,
            suggestion: 'Add rollback action for error recovery'
          });
        }

        // Check for retry count
        if (action.maxRetries < 1) {
          errors.push({
            type: 'info',
            category: 'HighRiskOperation',
            message: `High-risk operation ${action.actionId} has no retries configured`,
            affectedActions: [action.actionId],
            severity: 3,
            suggestion: 'Consider allowing 1-2 retries for reliability'
          });
        }
      }
    }

    if (highRiskCount > 3) {
      errors.push({
        type: 'warning',
        category: 'PlanComplexity',
        message: `Plan has ${highRiskCount} high-risk operations`,
        affectedActions: [],
        severity: 5,
        suggestion: 'Consider breaking plan into smaller, safer workflows'
      });
    }

    return errors;
  }

  /**
   * Check for plan complexity issues
   */
  private checkComplexity(plan: WorkflowPlan): DetectedError[] {
    const errors: DetectedError[] = [];

    const actionCount = plan.actions ? plan.actions.length : 0;

    if (actionCount > 20) {
      errors.push({
        type: 'warning',
        category: 'PlanComplexity',
        message: `Plan has ${actionCount} actions (high complexity)`,
        affectedActions: [],
        severity: 5,
        suggestion: 'Consider breaking into smaller sub-plans for better maintainability'
      });
    }

    if (actionCount > 50) {
      errors.push({
        type: 'critical',
        category: 'PlanComplexity',
        message: `Plan has ${actionCount} actions (very high complexity)`,
        affectedActions: [],
        severity: 8,
        suggestion: 'Break into multiple smaller plans'
      });
    }

    if (actionCount === 0) {
      errors.push({
        type: 'critical',
        category: 'EmptyPlan',
        message: 'Plan has no actions',
        affectedActions: [],
        severity: 10,
        suggestion: 'Add actions to the plan'
      });
    }

    return errors;
  }

  /**
   * Check for resource usage issues
   */
  private checkResourceUsage(_plan: WorkflowPlan, actions?: SequencedAction[]): DetectedError[] {
    const errors: DetectedError[] = [];

    if (!actions) {
      return errors;
    }

    // Calculate total estimated time
    const totalTime = actions.reduce((sum, a) => sum + a.estimatedDuration, 0);

    if (totalTime > 300000) {
      // 5 minutes
      errors.push({
        type: 'warning',
        category: 'ExecutionTime',
        message: `Plan estimated execution time is ${(totalTime / 1000).toFixed(1)}s (very long)`,
        affectedActions: [],
        severity: 5,
        suggestion: 'Consider optimizing or parallelizing actions where possible'
      });
    }

    // Check for timeout cascades
    for (let i = 0; i < actions.length - 1; i++) {
      const current = actions[i];
      const next = actions[i + 1];

      if (current.timeout > 30000 && next.dependencies.includes(current.actionId)) {
        errors.push({
          type: 'info',
          category: 'TimeoutCascade',
          message: `Long timeout (${current.timeout}ms) on ${current.actionId} may delay dependent actions`,
          affectedActions: [current.actionId, next.actionId],
          severity: 2,
          suggestion: 'Consider reducing timeout or executing in parallel'
        });
      }
    }

    return errors;
  }

  /**
   * Check for timeout issues
   */
  private checkTimeout(_plan: WorkflowPlan, actions?: SequencedAction[]): DetectedError[] {
    const errors: DetectedError[] = [];

    if (!actions) {
      return errors;
    }

    for (const action of actions) {
      // Check if timeout is too short for operation
      if (action.timeout < action.estimatedDuration) {
        errors.push({
          type: 'warning',
          category: 'TimeoutIssue',
          message: `Action ${action.actionId} timeout (${action.timeout}ms) may be shorter than estimated duration (${action.estimatedDuration}ms)`,
          affectedActions: [action.actionId],
          severity: 6,
          suggestion: `Increase timeout to at least ${action.estimatedDuration * 2}ms`
        });
      }

      // Check for unreasonably short timeouts
      if (action.timeout < 1000 && action.type !== 'check' && action.type !== 'merge') {
        errors.push({
          type: 'warning',
          category: 'TimeoutIssue',
          message: `Action ${action.actionId} has very short timeout (${action.timeout}ms)`,
          affectedActions: [action.actionId],
          severity: 4,
          suggestion: 'Increase timeout for better reliability'
        });
      }
    }

    return errors;
  }

  /**
   * Calculate overall risk score for plan
   */
  private calculateRiskScore(
    errors: DetectedError[],
    _plan: WorkflowPlan,
    actions?: SequencedAction[]
  ): number {
    let score = 0;

    // Error-based scoring
    for (const error of errors) {
      score += error.severity;
    }

    // Plan structure scoring
    if (actions) {
      const highRiskCount = actions.filter(
        (a) => a.type.includes('submit') || a.type.includes('delete')
      ).length;
      score += highRiskCount * 5;

      // Dependency complexity
      const avgDependencies = actions.reduce((sum, a) => sum + a.dependencies.length, 0) / actions.length;
      score += avgDependencies * 2;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate recommendations based on detected errors
   */
  private generateRecommendations(errors: DetectedError[], _plan: WorkflowPlan): string[] {
    const recommendations: string[] = [];

    // Group errors by category
    const categories = new Set(errors.map((e) => e.category));

    for (const category of categories) {
      const categoryErrors = errors.filter((e) => e.category === category);

      if (category === 'MissingDependency') {
        recommendations.push(
          `Fix ${categoryErrors.length} missing dependencies before executing the plan`
        );
      } else if (category === 'CircularDependency') {
        recommendations.push(
          'Break circular dependencies - review action ordering and dependencies'
        );
      } else if (category === 'HighRiskOperation') {
        recommendations.push(
          'Add rollback actions and test in sandbox environment before production execution'
        );
      } else if (category === 'PlanComplexity') {
        recommendations.push('Consider breaking the plan into smaller, more manageable sub-plans');
      } else if (category === 'ExecutionTime') {
        recommendations.push('Optimize long-running actions or parallelize independent steps');
      }
    }

    // Add general recommendations
    const criticalCount = errors.filter((e) => e.type === 'critical').length;
    const warningCount = errors.filter((e) => e.type === 'warning').length;

    if (criticalCount > 0) {
      recommendations.unshift(
        `BLOCKING: Resolve ${criticalCount} critical error(s) before plan execution`
      );
    }

    if (warningCount > 5) {
      recommendations.push('Address warnings to improve plan reliability and execution success rate');
    }

    return recommendations;
  }

  /**
   * Check for circular dependency involving action
   */
  private hasCircularDependency(action: SequencedAction, actions: SequencedAction[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (actionId: string): boolean => {
      visited.add(actionId);
      recursionStack.add(actionId);

      const current = actions.find((a) => a.actionId === actionId);
      if (!current) return false;

      for (const dep of current.dependencies) {
        if (recursionStack.has(dep)) {
          return true;
        }
        if (!visited.has(dep) && dfs(dep)) {
          return true;
        }
      }

      recursionStack.delete(actionId);
      return false;
    };

    return dfs(action.actionId);
  }

  /**
   * Get all reachable actions from entry points
   */
  private getReachableActions(actions: SequencedAction[]): Set<string> {
    const reachable = new Set<string>();

    // Find entry points (no dependencies)
    const entryPoints = actions
      .filter((a) => a.dependencies.length === 0)
      .map((a) => a.actionId);

    const visit = (actionId: string) => {
      if (reachable.has(actionId)) return;

      reachable.add(actionId);

      // Find actions that depend on this one
      for (const action of actions) {
        if (action.dependencies.includes(actionId)) {
          visit(action.actionId);
        }
      }
    };

    for (const entry of entryPoints) {
      visit(entry);
    }

    return reachable;
  }
}
