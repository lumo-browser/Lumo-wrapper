/**
 * Goal Parsing Service
 * Advanced natural language processing for goal parsing
 * Extracts intent, entities, constraints, and requirements from user goals
 */

import { Logger } from '@utils/logger';
import { Validator } from '@utils/validators';

export interface GoalIntent {
  type: 'navigate' | 'interact' | 'extract' | 'analyze' | 'automate' | 'compare' | 'submit' | 'unknown';
  confidence: number;
}

export interface GoalEntity {
  text: string;
  type: 'url' | 'element' | 'action' | 'value' | 'resource' | 'data' | 'unknown';
  confidence: number;
}

export interface GoalConstraint {
  type: 'timing' | 'scope' | 'method' | 'data' | 'behavior' | 'unknown';
  description: string;
  strict: boolean; // true if hard requirement, false if soft preference
}

export interface GoalRequirement {
  type: 'input' | 'output' | 'side_effect' | 'precondition' | 'postcondition';
  description: string;
}

export interface AnalyzedGoal {
  originalGoal: string;
  intent: GoalIntent;
  entities: GoalEntity[];
  constraints: GoalConstraint[];
  requirements: GoalRequirement[];
  complexity: number; // 1-10 scale
  contextNeeded: string[];
  confidence: number;
}

const INTENT_KEYWORDS = {
  navigate: ['go to', 'visit', 'open', 'navigate', 'access', 'reach', 'load', 'browse'],
  interact: [
    'click',
    'type',
    'enter',
    'fill',
    'submit',
    'select',
    'choose',
    'tick',
    'check',
    'uncheck'
  ],
  extract: [
    'get',
    'find',
    'retrieve',
    'collect',
    'gather',
    'search',
    'look for',
    'identify',
    'locate',
    'scrape'
  ],
  analyze: [
    'analyze',
    'review',
    'examine',
    'compare',
    'evaluate',
    'assess',
    'understand',
    'interpret',
    'check'
  ],
  automate: [
    'automate',
    'repeat',
    'loop',
    'batch',
    'process',
    'bulk',
    'multiple',
    'all items'
  ],
  compare: ['compare', 'difference', 'contrast', 'versus', 'vs', 'similar'],
  submit: ['submit', 'send', 'post', 'upload', 'save', 'commit', 'publish']
};

const CONSTRAINT_KEYWORDS = {
  timing: ['quickly', 'fast', 'slow', 'immediately', 'by', 'before', 'after', 'wait', 'delay'],
  scope: [
    'only',
    'just',
    'not',
    'without',
    'except',
    'exclude',
    'include',
    'all',
    'specific'
  ],
  method: ['using', 'via', 'with', 'through', 'by means of', 'method'],
  data: ['with', 'containing', 'matching', 'filter', 'where', 'if', 'that has']
};

/**
 * Service for parsing and analyzing natural language goals
 */
export class GoalParsingService {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Main analyze method - comprehensive goal analysis
   */
  public analyze(goal: string): AnalyzedGoal {
    this.logger.debug('GoalParsingService', 'Analyzing goal', { goal });

    // Validate input
    try {
      Validator.validateString(goal, 'goal', 5, 500);
    } catch {
      throw new Error('Goal must be between 5 and 500 characters');
    }

    const normalized = this.normalizeGoal(goal);

    return {
      originalGoal: goal,
      intent: this.extractIntent(normalized),
      entities: this.extractEntities(normalized),
      constraints: this.extractConstraints(normalized),
      requirements: this.extractRequirements(normalized),
      complexity: this.calculateComplexity(normalized),
      contextNeeded: this.identifyContextNeeds(normalized),
      confidence: this.calculateConfidence(normalized)
    };
  }

  /**
   * Normalize goal text for analysis
   */
  private normalizeGoal(goal: string): string {
    return goal
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Extract primary intent from goal
   */
  private extractIntent(goal: string): GoalIntent {
    let bestMatch: { type: keyof typeof INTENT_KEYWORDS | 'unknown'; confidence: number } = {
      type: 'unknown',
      confidence: 0
    };

    for (const [type, keywords] of Object.entries(INTENT_KEYWORDS)) {
      const matches = keywords.filter((kw) => goal.includes(kw)).length;
      const confidence = matches / keywords.length;

      if (confidence > bestMatch.confidence) {
        bestMatch = { type: type as keyof typeof INTENT_KEYWORDS, confidence };
      }
    }

    return {
      type: bestMatch.type as GoalIntent['type'],
      confidence: Math.min(bestMatch.confidence, 1)
    };
  }

  /**
   * Extract entities (URLs, elements, actions, values) from goal
   */
  private extractEntities(goal: string): GoalEntity[] {
    const entities: GoalEntity[] = [];

    // URL detection
    const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|(?:site|page|url)(?:\s+)?:?\s*([^\s\.]+)/gi;
    let match;
    while ((match = urlPattern.exec(goal)) !== null) {
      entities.push({
        text: match[0],
        type: 'url',
        confidence: 0.9
      });
    }

    // Element selector detection (CSS-like patterns)
    const elementPattern = /(?:element|button|input|link|text|field)(?:\s+)?:?\s*["']?([^"'\s,]+)["']?/gi;
    while ((match = elementPattern.exec(goal)) !== null) {
      entities.push({
        text: match[1],
        type: 'element',
        confidence: 0.7
      });
    }

    // Action verbs
    const actionPattern = /(?:action:|do:)\s*["']?([^"'\s,]+)["']?/gi;
    while ((match = actionPattern.exec(goal)) !== null) {
      entities.push({
        text: match[1],
        type: 'action',
        confidence: 0.8
      });
    }

    // Values in quotes
    const valuePattern = /["']([^"']{3,})["']/g;
    while ((match = valuePattern.exec(goal)) !== null) {
      entities.push({
        text: match[1],
        type: 'value',
        confidence: 0.6
      });
    }

    return entities;
  }

  /**
   * Extract constraints from goal
   */
  private extractConstraints(goal: string): GoalConstraint[] {
    const constraints: GoalConstraint[] = [];

    for (const [type, keywords] of Object.entries(CONSTRAINT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (goal.includes(keyword)) {
          constraints.push({
            type: type as GoalConstraint['type'],
            description: `${type}: ${keyword}`,
            strict: !['soft', 'maybe', 'prefer'].some((w) => goal.includes(w))
          });
        }
      }
    }

    return constraints;
  }

  /**
   * Extract requirements from goal
   */
  private extractRequirements(goal: string): GoalRequirement[] {
    const requirements: GoalRequirement[] = [];

    // Input requirements
    if (goal.includes('need') || goal.includes('require')) {
      requirements.push({
        type: 'input',
        description: 'User must provide input'
      });
    }

    // Output requirements
    if (
      goal.includes('return') ||
      goal.includes('show') ||
      goal.includes('display') ||
      goal.includes('extract')
    ) {
      requirements.push({
        type: 'output',
        description: 'Extract or return data'
      });
    }

    // Side effects
    if (goal.includes('save') || goal.includes('delete') || goal.includes('submit')) {
      requirements.push({
        type: 'side_effect',
        description: 'May modify state on server'
      });
    }

    // Preconditions
    if (goal.includes('after') || goal.includes('following')) {
      requirements.push({
        type: 'precondition',
        description: 'Dependencies exist'
      });
    }

    return requirements;
  }

  /**
   * Calculate complexity score (1-10)
   */
  private calculateComplexity(goal: string): number {
    let score = 1;

    // Length factor
    score += Math.min(goal.length / 50, 2);

    // Structural complexity (commas, clauses)
    const commaClauses = (goal.match(/,/g) || []).length;
    score += Math.min(commaClauses * 1.5, 3);

    // Keyword factor
    const complexKeywords = [
      'and',
      'then',
      'if',
      'loop',
      'multiple',
      'batch',
      'compare',
      'analyze'
    ];
    const matches = complexKeywords.filter((kw) => goal.includes(kw)).length;
    score += matches;

    // Constraint count
    score += this.extractConstraints(goal).length;

    // Entity count
    score += this.extractEntities(goal).length * 0.5;

    return Math.min(Math.round(score), 10);
  }

  /**
   * Identify what context is needed
   */
  private identifyContextNeeds(goal: string): string[] {
    const needs: string[] = [];

    if (goal.includes('current') || goal.includes('this page')) {
      needs.push('current_page_context');
    }
    if (goal.includes('previous') || goal.includes('history')) {
      needs.push('history_context');
    }
    if (goal.includes('user') || goal.includes('profile')) {
      needs.push('user_context');
    }
    if (goal.includes('data') || goal.includes('extract') || goal.includes('get')) {
      needs.push('page_data_context');
    }

    return needs;
  }

  /**
   * Calculate overall confidence in the analysis
   */
  private calculateConfidence(goal: string): number {
    let confidence = 40; // Base confidence

    // Clarity factors
    if (goal.length > 20) confidence += 10;
    if (goal.includes('please')) confidence += 5;
    if (goal.includes(',') || goal.includes('.')) confidence += 5;

    // Specificity factors
    const entities = this.extractEntities(goal);
    confidence += Math.min(entities.length * 10, 20);

    // Intent clarity
    const intent = this.extractIntent(goal);
    if (intent.type !== 'unknown') {
      confidence += intent.confidence * 10;
    }

    return Math.min(confidence, 100);
  }
}
