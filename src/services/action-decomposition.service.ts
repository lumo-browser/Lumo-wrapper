/**
 * Action Decomposition Service
 * Intelligent strategy-based decomposition of goals into executable actions
 * Supports multiple decomposition strategies based on goal complexity
 */

import { Logger } from '@utils/logger';
import { DecomposedAction } from './agents/planner-agent';
import { ParsedGoal } from './goal-parsing.service';

export enum DecompositionStrategy {
  LINEAR = 'linear', // Simple sequential steps
  HIERARCHICAL = 'hierarchical', // Nested goal breakdown
  DATA_FLOW = 'data_flow', // Actions based on data dependencies
  PARALLEL = 'parallel', // Independent actions that can run in parallel
  CONDITIONAL = 'conditional' // Actions with branching logic
}

export interface ActionTemplate {
  type: string;
  description: string;
  commonParameters: Record<string, unknown>;
  dependencies: string[];
  priority: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DecompositionStrategy {
  type: DecompositionStrategy;
  description: string;
  maxActions: number;
  parallelizable: boolean;
}

/**
 * Action templates for common task types
 */
const ACTION_TEMPLATES: Record<string, ActionTemplate[]> = {
  navigate: [
    {
      type: 'navigate',
      description: 'Navigate to a URL',
      commonParameters: { url: '', timeout: 10000 },
      dependencies: [],
      priority: 1,
      riskLevel: 'low'
    }
  ],
  interact: [
    {
      type: 'click',
      description: 'Click on an element',
      commonParameters: { selector: '', timeout: 5000 },
      dependencies: [],
      priority: 2,
      riskLevel: 'low'
    },
    {
      type: 'type',
      description: 'Type text into a field',
      commonParameters: { selector: '', text: '', delay: 50 },
      dependencies: [],
      priority: 2,
      riskLevel: 'low'
    },
    {
      type: 'select',
      description: 'Select an option from a dropdown',
      commonParameters: { selector: '', value: '' },
      dependencies: [],
      priority: 2,
      riskLevel: 'low'
    }
  ],
  extract: [
    {
      type: 'extract_text',
      description: 'Extract text content from elements',
      commonParameters: { selector: '', attribute: 'text' },
      dependencies: [],
      priority: 3,
      riskLevel: 'low'
    },
    {
      type: 'extract_table',
      description: 'Extract table data',
      commonParameters: { selector: 'table' },
      dependencies: [],
      priority: 3,
      riskLevel: 'low'
    },
    {
      type: 'extract_list',
      description: 'Extract list items',
      commonParameters: { selector: 'li, .item' },
      dependencies: [],
      priority: 3,
      riskLevel: 'low'
    }
  ],
  submit: [
    {
      type: 'submit_form',
      description: 'Submit a form',
      commonParameters: { selector: 'form, [role="form"]' },
      dependencies: [],
      priority: 4,
      riskLevel: 'high'
    },
    {
      type: 'click_submit_button',
      description: 'Click submit button',
      commonParameters: { selector: 'button[type="submit"], .submit-btn' },
      dependencies: [],
      priority: 4,
      riskLevel: 'high'
    }
  ],
  wait: [
    {
      type: 'wait_for_element',
      description: 'Wait for element to appear',
      commonParameters: { selector: '', timeout: 10000 },
      dependencies: [],
      priority: 2,
      riskLevel: 'low'
    },
    {
      type: 'wait_for_navigation',
      description: 'Wait for page navigation',
      commonParameters: { timeout: 10000 },
      dependencies: [],
      priority: 2,
      riskLevel: 'low'
    }
  ]
};

/**
 * Decomposition strategy definitions
 */
const STRATEGY_DEFINITIONS: Record<DecompositionStrategy, DecompositionStrategy> = {
  [DecompositionStrategy.LINEAR]: {
    type: DecompositionStrategy.LINEAR,
    description: 'Sequential execution of actions',
    maxActions: 5,
    parallelizable: false
  },
  [DecompositionStrategy.HIERARCHICAL]: {
    type: DecompositionStrategy.HIERARCHICAL,
    description: 'Nested goal decomposition',
    maxActions: 15,
    parallelizable: false
  },
  [DecompositionStrategy.DATA_FLOW]: {
    type: DecompositionStrategy.DATA_FLOW,
    description: 'Data dependency-based decomposition',
    maxActions: 10,
    parallelizable: true
  },
  [DecompositionStrategy.PARALLEL]: {
    type: DecompositionStrategy.PARALLEL,
    description: 'Parallel independent actions',
    maxActions: 8,
    parallelizable: true
  },
  [DecompositionStrategy.CONDITIONAL]: {
    type: DecompositionStrategy.CONDITIONAL,
    description: 'Actions with conditional branches',
    maxActions: 12,
    parallelizable: false
  }
};

/**
 * Service for intelligent action decomposition
 */
export class ActionDecompositionService {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Decompose a goal into actions using appropriate strategy
   */
  public decompose(goal: ParsedGoal, strategy?: DecompositionStrategy): DecomposedAction[] {
    this.logger.debug('Decomposing goal', {
      scope: 'ActionDecompositionService',
      objective: goal.mainObjective,
      strategy
    });

    // Select strategy based on goal complexity if not provided
    const selectedStrategy =
      strategy || this.selectStrategy(goal);

    // Decompose based on strategy
    switch (selectedStrategy) {
      case DecompositionStrategy.LINEAR:
        return this.decomposeLinear(goal);
      case DecompositionStrategy.HIERARCHICAL:
        return this.decomposeHierarchical(goal);
      case DecompositionStrategy.DATA_FLOW:
        return this.decomposeDataFlow(goal);
      case DecompositionStrategy.PARALLEL:
        return this.decomposeParallel(goal);
      case DecompositionStrategy.CONDITIONAL:
        return this.decomposeConditional(goal);
      default:
        return this.decomposeLinear(goal);
    }
  }

  /**
   * Select appropriate strategy based on goal
   */
  private selectStrategy(goal: ParsedGoal): DecompositionStrategy {
    if (goal.complexity === 'simple') {
      return DecompositionStrategy.LINEAR;
    } else if (goal.complexity === 'moderate') {
      // Check for multiple independent tasks
      if (goal.constraints.length > 2) {
        return DecompositionStrategy.DATA_FLOW;
      }
      return DecompositionStrategy.HIERARCHICAL;
    } else {
      // Complex goals
      if (goal.mainObjective.includes('compare') || goal.mainObjective.includes('multiple')) {
        return DecompositionStrategy.PARALLEL;
      }
      if (goal.mainObjective.includes('if') || goal.mainObjective.includes('condition')) {
        return DecompositionStrategy.CONDITIONAL;
      }
      return DecompositionStrategy.HIERARCHICAL;
    }
  }

  /**
   * Linear decomposition - simple sequential steps
   */
  private decomposeLinear(goal: ParsedGoal): DecomposedAction[] {
    const actions: DecomposedAction[] = [];
    const baseId = this.generateId();

    // Step 1: Navigate if URL mentioned
    if (goal.constraints.length > 0 || goal.mainObjective.includes('navigate')) {
      actions.push({
        actionId: `${baseId}-1`,
        type: 'navigate',
        description: 'Navigate to target page',
        parameters: { url: '' },
        priority: 1,
        dependencies: []
      });
    }

    // Step 2: Interact (click, type, select)
    if (
      goal.mainObjective.includes('click') ||
      goal.mainObjective.includes('type') ||
      goal.mainObjective.includes('enter')
    ) {
      actions.push({
        actionId: `${baseId}-${actions.length + 1}`,
        type: 'interact',
        description: 'Interact with page elements',
        parameters: { selector: '', action: 'click' },
        priority: 2,
        dependencies: actions.length > 0 ? [actions[0].actionId] : []
      });
    }

    // Step 3: Extract data
    if (goal.mainObjective.includes('get') || goal.mainObjective.includes('extract')) {
      actions.push({
        actionId: `${baseId}-${actions.length + 1}`,
        type: 'extract',
        description: 'Extract data from page',
        parameters: { selector: '' },
        priority: 3,
        dependencies: actions.length > 0 ? [actions[actions.length - 1].actionId] : []
      });
    }

    // Step 4: Submit if needed
    if (goal.mainObjective.includes('submit')) {
      actions.push({
        actionId: `${baseId}-${actions.length + 1}`,
        type: 'submit',
        description: 'Submit form or action',
        parameters: { selector: '' },
        priority: 4,
        dependencies: [actions[actions.length - 1].actionId]
      });
    }

    return actions.length > 0
      ? actions
      : [
          {
            actionId: `${baseId}-1`,
            type: 'navigate',
            description: 'Navigate based on goal',
            parameters: { url: '' },
            priority: 1,
            dependencies: []
          }
        ];
  }

  /**
   * Hierarchical decomposition - nested goal breakdown
   */
  private decomposeHierarchical(goal: ParsedGoal): DecomposedAction[] {
    const actions: DecomposedAction[] = [];
    const baseId = this.generateId();
    let priority = 1;

    // Primary objective
    actions.push({
      actionId: `${baseId}-${priority}`,
      type: 'navigate',
      description: `Primary: ${goal.mainObjective}`,
      parameters: { url: '' },
      priority: priority++,
      dependencies: []
    });

    // Constraint-based sub-goals
    for (const constraint of goal.constraints) {
      actions.push({
        actionId: `${baseId}-${priority}`,
        type: 'interact',
        description: `Constraint: ${constraint}`,
        parameters: { selector: '' },
        priority: priority++,
        dependencies: [actions[actions.length - 1].actionId]
      });
    }

    // Expected outcome
    actions.push({
      actionId: `${baseId}-${priority}`,
      type: 'verify',
      description: `Verify: ${goal.expectedOutcome}`,
      parameters: { check: 'outcome' },
      priority: priority,
      dependencies: [actions[actions.length - 1].actionId]
    });

    return actions;
  }

  /**
   * Data flow decomposition - based on data dependencies
   */
  private decomposeDataFlow(goal: ParsedGoal): DecomposedAction[] {
    const actions: DecomposedAction[] = [];
    const baseId = this.generateId();

    // Input data source
    actions.push({
      actionId: `${baseId}-input`,
      type: 'extract',
      description: 'Get input data',
      parameters: { selector: '' },
      priority: 1,
      dependencies: []
    });

    // Process data
    actions.push({
      actionId: `${baseId}-process`,
      type: 'transform',
      description: 'Process extracted data',
      parameters: { operation: 'filter' },
      priority: 2,
      dependencies: [`${baseId}-input`]
    });

    // Output data
    actions.push({
      actionId: `${baseId}-output`,
      type: 'submit',
      description: 'Submit or output data',
      parameters: { destination: '' },
      priority: 3,
      dependencies: [`${baseId}-process`]
    });

    return actions;
  }

  /**
   * Parallel decomposition - independent parallel actions
   */
  private decomposeParallel(goal: ParsedGoal): DecomposedAction[] {
    const actions: DecomposedAction[] = [];
    const baseId = this.generateId();

    // Navigation (sequential)
    actions.push({
      actionId: `${baseId}-nav`,
      type: 'navigate',
      description: 'Navigate to page',
      parameters: { url: '' },
      priority: 1,
      dependencies: []
    });

    // Parallel extractions
    const parallelItems = 2;
    for (let i = 0; i < parallelItems; i++) {
      actions.push({
        actionId: `${baseId}-extract-${i}`,
        type: 'extract',
        description: `Extract data set ${i + 1}`,
        parameters: { selector: '', index: i },
        priority: 2,
        dependencies: [`${baseId}-nav`] // All depend on navigation
      });
    }

    // Aggregation
    actions.push({
      actionId: `${baseId}-aggregate`,
      type: 'aggregate',
      description: 'Combine extracted data',
      parameters: { method: 'merge' },
      priority: 3,
      dependencies: actions
        .filter((a) => a.actionId.includes('extract'))
        .map((a) => a.actionId)
    });

    return actions;
  }

  /**
   * Conditional decomposition - with branching logic
   */
  private decomposeConditional(goal: ParsedGoal): DecomposedAction[] {
    const actions: DecomposedAction[] = [];
    const baseId = this.generateId();

    // Initial check
    actions.push({
      actionId: `${baseId}-check`,
      type: 'check',
      description: 'Check condition',
      parameters: { condition: '' },
      priority: 1,
      dependencies: []
    });

    // True branch
    actions.push({
      actionId: `${baseId}-true-1`,
      type: 'navigate',
      description: 'Action if condition true',
      parameters: { url: '' },
      priority: 2,
      dependencies: [`${baseId}-check`]
    });

    // False branch
    actions.push({
      actionId: `${baseId}-false-1`,
      type: 'navigate',
      description: 'Action if condition false',
      parameters: { url: '' },
      priority: 2,
      dependencies: [`${baseId}-check`]
    });

    // Merge
    actions.push({
      actionId: `${baseId}-merge`,
      type: 'merge',
      description: 'Merge branch results',
      parameters: {},
      priority: 3,
      dependencies: [`${baseId}-true-1`, `${baseId}-false-1`]
    });

    return actions;
  }

  /**
   * Get action templates for a task type
   */
  public getTemplates(taskType: string): ActionTemplate[] {
    return ACTION_TEMPLATES[taskType] || [];
  }

  /**
   * Generate unique action ID
   */
  private generateId(): string {
    return `decomp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Validate decomposed actions
   */
  public validate(actions: DecomposedAction[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const actionIds = new Set(actions.map((a) => a.actionId));

    // Check for missing dependencies
    for (const action of actions) {
      for (const dep of action.dependencies) {
        if (!actionIds.has(dep)) {
          errors.push(`Action ${action.actionId} has missing dependency: ${dep}`);
        }
      }
    }

    // Check for orphaned actions
    for (const action of actions) {
      if (action.dependencies.length === 0 && actions.indexOf(action) > 0) {
        // Check if any other action depends on this one
        const isDependedOn = actions.some((a) => a.dependencies.includes(action.actionId));
        if (!isDependedOn) {
          // First action with no deps is OK, otherwise it's orphaned
          if (actions.indexOf(action) > 0) {
            // Could be OK for parallel actions
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
