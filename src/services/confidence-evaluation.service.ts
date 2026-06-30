/**
 * Confidence Evaluation Service
 * Multi-factor confidence scoring for AI plans based on multiple evaluation criteria
 */

import { Logger } from '@utils/logger';
import { SequencedAction } from './step-sequencing.service';
import { ValidationReport } from './error-detection.service';

export interface ConfidenceFactors {
  parameterCertainty: number; // 0-100: How well parameters are specified
  dependencyResolution: number; // 0-100: How well dependencies are resolved
  actionCoverage: number; // 0-100: How well the plan covers the goal
  executionStability: number; // 0-100: Expected success probability
  completenessScore: number; // 0-100: Plan completeness
  riskAdjustment: number; // 0-100: Risk mitigation score
  timingFeasibility: number; // 0-100: Realistic timing
  resourceAvailability: number; // 0-100: Sufficient resources
}

export interface ConfidenceResult {
  overallConfidence: number; // 0-100
  factors: ConfidenceFactors;
  weightedFactors: Record<keyof ConfidenceFactors, number>;
  breakdown: string; // Human-readable explanation
  confidence_intervals: {
    minimum: number;
    expected: number;
    maximum: number;
  };
}

/**
 * Service for comprehensive confidence scoring of plans
 */
export class ConfidenceEvaluationService {
  private logger: Logger;

  // Factor weights (must sum to 1.0 or less)
  private readonly FACTOR_WEIGHTS: Record<keyof ConfidenceFactors, number> = {
    parameterCertainty: 0.18,
    dependencyResolution: 0.18,
    actionCoverage: 0.15,
    executionStability: 0.15,
    completenessScore: 0.12,
    riskAdjustment: 0.12,
    timingFeasibility: 0.05,
    resourceAvailability: 0.05
  };

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Evaluate confidence for a plan
   */
  public evaluate(
    actions: SequencedAction[],
    validationReport: ValidationReport,
    goalComplexity: number
  ): ConfidenceResult {
    this.logger.debug('ConfidenceEvaluationService', 'Evaluating plan confidence');

    // Calculate all factors
    const factors: ConfidenceFactors = {
      parameterCertainty: this.evaluateParameterCertainty(actions),
      dependencyResolution: this.evaluateDependencyResolution(actions, validationReport),
      actionCoverage: this.evaluateActionCoverage(actions, goalComplexity),
      executionStability: this.evaluateExecutionStability(actions, validationReport),
      completenessScore: this.evaluateCompleteness(actions),
      riskAdjustment: this.evaluateRiskAdjustment(validationReport),
      timingFeasibility: this.evaluateTimingFeasibility(actions),
      resourceAvailability: this.evaluateResourceAvailability(actions)
    };

    // Apply weights
    const weightedFactors = this.applyWeights(factors);

    // Calculate overall confidence
    const overallConfidence = Object.values(weightedFactors).reduce((a, b) => a + b, 0);

    // Calculate confidence intervals
    const intervals = this.calculateConfidenceIntervals(factors, validationReport);

    // Generate breakdown
    const breakdown = this.generateBreakdown(factors, overallConfidence);

    return {
      overallConfidence: Math.round(overallConfidence),
      factors,
      weightedFactors,
      breakdown,
      confidence_intervals: intervals
    };
  }

  /**
   * Evaluate parameter certainty (0-100)
   */
  private evaluateParameterCertainty(actions: SequencedAction[]): number {
    if (actions.length === 0) return 0;

    let fullySpecified = 0;
    let partiallySpecified = 0;

    for (const action of actions) {
      const params = action.parameters as Record<string, unknown>;
      const paramCount = Object.keys(params).length;

      if (paramCount === 0) {
        partiallySpecified++;
        continue;
      }

      const emptyValues = Object.values(params).filter((v) => v === '' || v === null || v === undefined).length;
      const specificationRatio = (paramCount - emptyValues) / paramCount;

      if (specificationRatio === 1) {
        fullySpecified++;
      } else if (specificationRatio > 0.5) {
        partiallySpecified++;
      }
    }

    const percentage =
      (fullySpecified * 100 + partiallySpecified * 50) / (actions.length * 100);

    return Math.round(Math.min(percentage * 100, 100));
  }

  /**
   * Evaluate dependency resolution (0-100)
   */
  private evaluateDependencyResolution(
    actions: SequencedAction[],
    validationReport: ValidationReport
  ): number {
    // Start with 100
    let score = 100;

    // Deduct for each dependency error
    const depErrors = validationReport.errors.filter((e) => e.category.includes('Dependency'));
    score -= depErrors.length * 25;

    // Deduct for unreachable actions
    const unreachable = validationReport.errors.filter(
      (e) => e.category === 'UnreachableAction'
    );
    score -= unreachable.length * 20;

    // Bonus for complex but valid dependency structure
    if (actions.length > 1) {
      const avgDeps = actions.reduce((sum, a) => sum + a.dependencies.length, 0) / actions.length;
      if (avgDeps > 0.5 && avgDeps < 2) {
        score += 10; // Well-structured dependencies
      }
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Evaluate action coverage (0-100)
   */
  private evaluateActionCoverage(actions: SequencedAction[], goalComplexity: number): number {
    // Simple heuristic: More actions for more complex goals
    const expectedActions = Math.max(1, goalComplexity);
    const actionRatio = Math.min(actions.length / expectedActions, 2);

    // Coverage score
    let score = actionRatio * 50 + 50; // Min 50, max 100

    // Check action diversity
    const actionTypes = new Set(actions.map((a) => a.type));
    const diversity = Math.min(actionTypes.size / 5, 1); // 5+ types = 100
    score = score * 0.7 + diversity * 30; // 70% from ratio, 30% from diversity

    return Math.round(Math.min(score, 100));
  }

  /**
   * Evaluate execution stability (0-100)
   */
  private evaluateExecutionStability(
    actions: SequencedAction[],
    validationReport: ValidationReport
  ): number {
    let score = 100;

    // Deduct for each validation error
    const criticalErrors = validationReport.errors.filter((e) => e.type === 'critical');
    const warnings = validationReport.errors.filter((e) => e.type === 'warning');

    score -= criticalErrors.length * 20;
    score -= warnings.length * 5;

    // Check for retry mechanisms
    const withRetries = actions.filter((a) => a.maxRetries > 0).length;
    const retryBenefit = (withRetries / actions.length) * 20;
    score += retryBenefit;

    // Check for rollback actions
    const withRollback = actions.filter((a) => a.rollbackAction).length;
    const rollbackBenefit = (withRollback / actions.length) * 15;
    score += rollbackBenefit;

    // Check for high-risk operations
    const highRisk = actions.filter(
      (a) => a.type.includes('submit') || a.type.includes('delete')
    ).length;
    if (highRisk > 3) {
      score -= Math.min(highRisk * 5, 20);
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Evaluate plan completeness (0-100)
   */
  private evaluateCompleteness(actions: SequencedAction[]): number {
    let score = 0;

    // Has navigation
    const hasNav = actions.some((a) => a.type === 'navigate');
    if (hasNav) score += 25;

    // Has interaction
    const hasInteract = actions.some((a) => a.type.includes('click') || a.type.includes('type'));
    if (hasInteract) score += 25;

    // Has data extraction or verification
    const hasExtract = actions.some(
      (a) => a.type.includes('extract') || a.type === 'verify' || a.type === 'check'
    );
    if (hasExtract) score += 25;

    // Has completion (submit or output)
    const hasCompletion = actions.some(
      (a) => a.type.includes('submit') || a.type === 'merge' || a.type === 'output'
    );
    if (hasCompletion) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Evaluate risk adjustment (0-100)
   */
  private evaluateRiskAdjustment(validationReport: ValidationReport): number {
    // Start with plan risk score (inverse)
    let adjustment = 100 - validationReport.riskScore;

    // Bonus for having no critical errors
    const criticalCount = validationReport.errors.filter((e) => e.type === 'critical').length;
    if (criticalCount === 0) {
      adjustment = Math.min(adjustment + 20, 100);
    }

    // Penalty for too many warnings
    const warningCount = validationReport.errors.filter((e) => e.type === 'warning').length;
    if (warningCount > 5) {
      adjustment = Math.max(adjustment - 15, 0);
    }

    return Math.max(0, Math.min(adjustment, 100));
  }

  /**
   * Evaluate timing feasibility (0-100)
   */
  private evaluateTimingFeasibility(actions: SequencedAction[]): number {
    if (actions.length === 0) return 50;

    // Calculate total estimated time
    const totalTime = actions.reduce((sum, a) => sum + a.estimatedDuration, 0);

    // 5 minutes is optimal, scale from there
    const optimalTime = 300000; // 5 minutes
    const ratio = Math.min(totalTime / optimalTime, 2);

    let score = 100;

    // If too fast (< 1s), might be unrealistic
    if (totalTime < 1000) {
      score -= 30;
    }
    // If reasonable (1s - 5min), good
    else if (totalTime <= optimalTime) {
      score = 100;
    }
    // If longer, gradually reduce
    else if (totalTime <= 600000) {
      // 10 min
      score = 80;
    } else if (totalTime <= 1800000) {
      // 30 min
      score = 50;
    } else {
      score = 20;
    }

    // Check for realistic timeouts
    const unrealisticTimeouts = actions.filter((a) => a.timeout < 1000).length;
    score -= unrealisticTimeouts * 5;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Evaluate resource availability (0-100)
   */
  private evaluateResourceAvailability(actions: SequencedAction[]): number {
    let score = 100;

    // Check for too many parallel operations (might exceed resource limits)
    const parallelOps = actions.filter((a) => a.dependencies.length === 0).length;
    if (parallelOps > 5) {
      score -= Math.min((parallelOps - 5) * 5, 30);
    }

    // Check for excessive memory-intensive operations
    const extractCount = actions.filter((a) => a.type.includes('extract')).length;
    if (extractCount > 5) {
      score -= Math.min((extractCount - 5) * 3, 20);
    }

    // All actions have reasonable timeouts
    const withTimeouts = actions.filter((a) => a.timeout > 0).length;
    if (withTimeouts === actions.length) {
      score += 10;
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Apply factor weights to calculate weighted scores
   */
  private applyWeights(factors: ConfidenceFactors): Record<keyof ConfidenceFactors, number> {
    const weighted: Record<keyof ConfidenceFactors, number> = {} as any;

    for (const [factor, weight] of Object.entries(this.FACTOR_WEIGHTS)) {
      const key = factor as keyof ConfidenceFactors;
      weighted[key] = (factors[key] / 100) * weight * 100;
    }

    return weighted;
  }

  /**
   * Calculate confidence intervals (min, expected, max)
   */
  private calculateConfidenceIntervals(
    factors: ConfidenceFactors,
    validationReport: ValidationReport
  ): { minimum: number; expected: number; maximum: number } {
    // Minimum: Assume all risks materialize
    const criticalErrors = validationReport.errors.filter((e) => e.type === 'critical').length;
    const minimum = Math.max(0, 50 - criticalErrors * 10);

    // Expected: Based on factors
    const expected = Math.round(
      Object.values(factors).reduce((a, b) => a + b) / Object.keys(factors).length
    );

    // Maximum: Best case scenario
    const hasNoErrors = validationReport.errors.length === 0;
    const maximum = hasNoErrors ? 95 : Math.min(85, expected + 15);

    return {
      minimum: Math.max(0, Math.min(minimum, 100)),
      expected: Math.max(0, Math.min(expected, 100)),
      maximum: Math.max(0, Math.min(maximum, 100))
    };
  }

  /**
   * Generate human-readable confidence breakdown
   */
  private generateBreakdown(factors: ConfidenceFactors, overallConfidence: number): string {
    const parts: string[] = [];

    if (overallConfidence >= 80) {
      parts.push('HIGH CONFIDENCE');
    } else if (overallConfidence >= 60) {
      parts.push('MODERATE CONFIDENCE');
    } else if (overallConfidence >= 40) {
      parts.push('LOW CONFIDENCE');
    } else {
      parts.push('VERY LOW CONFIDENCE - Review required');
    }

    // Identify strongest and weakest factors
    const entries = Object.entries(factors) as Array<[keyof ConfidenceFactors, number]>;
    const strongest = entries.sort((a, b) => b[1] - a[1])[0];
    const weakest = entries.sort((a, b) => a[1] - b[1])[0];

    parts.push(`Strongest: ${strongest[0]} (${strongest[1]}%)`);
    parts.push(`Weakest: ${weakest[0]} (${weakest[1]}%)`);

    // Add specific insights
    if (factors.parameterCertainty < 50) {
      parts.push('Many parameters are unspecified - plan needs refinement');
    }
    if (factors.executionStability < 60) {
      parts.push('Consider adding retry logic and error handling');
    }
    if (factors.timingFeasibility < 50) {
      parts.push('Plan timing may be unrealistic - adjust timeouts or parallelize');
    }

    return parts.join('\n');
  }

  /**
   * Get confidence category
   */
  public getConfidenceCategory(
    confidence: number
  ): 'very_high' | 'high' | 'moderate' | 'low' | 'very_low' {
    if (confidence >= 85) return 'very_high';
    if (confidence >= 70) return 'high';
    if (confidence >= 55) return 'moderate';
    if (confidence >= 40) return 'low';
    return 'very_low';
  }

  /**
   * Get recommendation based on confidence
   */
  public getRecommendation(confidence: number): string {
    const category = this.getConfidenceCategory(confidence);

    switch (category) {
      case 'very_high':
        return 'Plan is well-structured and ready for execution';
      case 'high':
        return 'Plan is ready but consider minor improvements';
      case 'moderate':
        return 'Plan needs some refinement before execution';
      case 'low':
        return 'Plan requires significant improvements';
      case 'very_low':
        return 'Plan requires major revision - do not execute without review';
    }
  }
}
