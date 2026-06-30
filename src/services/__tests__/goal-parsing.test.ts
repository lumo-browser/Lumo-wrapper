/**
 * Goal Parsing Service Tests
 * Comprehensive test suite for goal parsing service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoalParsingService } from '@services/goal-parsing.service';

describe('GoalParsingService', () => {
  let service: GoalParsingService;

  beforeEach(() => {
    service = new GoalParsingService();
  });

  describe('Goal Analysis', () => {
    it('should analyze valid goals', () => {
      const result = service.analyze('Navigate to example.com');

      expect(result).toBeDefined();
      expect(result.originalGoal).toBe('Navigate to example.com');
      expect(result.intent).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.constraints).toBeDefined();
      expect(result.requirements).toBeDefined();
      expect(result.complexity).toBeGreaterThanOrEqual(1);
      expect(result.complexity).toBeLessThanOrEqual(10);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should throw error for invalid goals', () => {
      expect(() => service.analyze('go')).toThrow();
      expect(() => service.analyze('a'.repeat(600))).toThrow();
      expect(() => service.analyze('')).toThrow();
    });
  });

  describe('Intent Extraction', () => {
    it('should detect navigate intent', () => {
      const result = service.analyze('Go to Google and search for something');

      expect(result.intent.type).toBe('navigate');
      expect(result.intent.confidence).toBeGreaterThan(0);
    });

    it('should detect interact intent', () => {
      const result = service.analyze('Click the login button and enter your password');

      expect(result.intent.type).toBe('interact');
    });

    it('should detect extract intent', () => {
      const result = service.analyze('Find all product names on this page');

      expect(result.intent.type).toBe('extract');
    });

    it('should detect analyze intent', () => {
      const result = service.analyze('Compare these two products');

      expect(result.intent.type).toBe('compare');
    });

    it('should detect submit intent', () => {
      const result = service.analyze('Submit the form with the provided data');

      expect(result.intent.type).toBe('submit');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract URLs', () => {
      const result = service.analyze('Visit https://example.com for more info');

      const urlEntity = result.entities.find((e) => e.type === 'url');
      expect(urlEntity).toBeDefined();
      expect(urlEntity?.text).toContain('example.com');
    });

    it('should extract element references', () => {
      const result = service.analyze('Click the element: submit-button');

      const elementEntity = result.entities.find((e) => e.type === 'element');
      expect(elementEntity).toBeDefined();
    });

    it('should extract quoted values', () => {
      const result = service.analyze('Enter the text "hello world" in the field');

      const valueEntity = result.entities.find((e) => e.type === 'value');
      expect(valueEntity).toBeDefined();
    });

    it('should handle multiple entities', () => {
      const result = service.analyze('Go to https://example.com, click button:submit, and enter "test@email.com"');

      expect(result.entities.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Constraint Extraction', () => {
    it('should extract timing constraints', () => {
      const result = service.analyze('Quickly navigate to the page');

      const timingConstraint = result.constraints.find((c) => c.type === 'timing');
      expect(timingConstraint).toBeDefined();
    });

    it('should extract scope constraints', () => {
      const result = service.analyze('Click only the first button');

      const scopeConstraint = result.constraints.find((c) => c.type === 'scope');
      expect(scopeConstraint).toBeDefined();
    });

    it('should detect strict vs soft constraints', () => {
      const strictResult = service.analyze('Must quickly click the save button');
      service.analyze('Prefer to use the new interface');

      const strictConstraint = strictResult.constraints.find((c) => c.strict === true);
      expect(strictConstraint).toBeDefined();
    });
  });

  describe('Requirement Extraction', () => {
    it('should detect input requirements', () => {
      const result = service.analyze('Need user to provide password');

      const inputReq = result.requirements.find((r) => r.type === 'input');
      expect(inputReq).toBeDefined();
    });

    it('should detect output requirements', () => {
      const result = service.analyze('Extract and show all product prices');

      const outputReq = result.requirements.find((r) => r.type === 'output');
      expect(outputReq).toBeDefined();
    });

    it('should detect side effects', () => {
      const result = service.analyze('Submit the form and save the response');

      const sideEffectReq = result.requirements.find((r) => r.type === 'side_effect');
      expect(sideEffectReq).toBeDefined();
    });
  });

  describe('Complexity Calculation', () => {
    it('should rate simple goals with low complexity', () => {
      const result = service.analyze('Navigate to example.com');

      expect(result.complexity).toBeLessThanOrEqual(3);
    });

    it('should rate moderate goals appropriately', () => {
      const result = service.analyze('Navigate to example.com and click the button and extract the data');

      expect(result.complexity).toBeGreaterThan(3);
      expect(result.complexity).toBeLessThanOrEqual(7);
    });

    it('should rate complex goals with higher complexity', () => {
      const result = service.analyze(
        'Create a complex workflow that involves navigating multiple pages, extracting data from each, comparing results, and submitting a form'
      );

      expect(result.complexity).toBeGreaterThan(7);
    });

    it('should increase complexity with entities', () => {
      const simpleResult = service.analyze('Do something');
      const entityResult = service.analyze('Navigate to https://example.com and click button:login and enter "email"');

      expect(entityResult.complexity).toBeGreaterThan(simpleResult.complexity);
    });
  });

  describe('Context Needs Identification', () => {
    it('should identify current page context need', () => {
      const result = service.analyze('Extract data from the current page');

      expect(result.contextNeeded).toContain('current_page_context');
    });

    it('should identify history context need', () => {
      const result = service.analyze('Based on previous navigation history, do something');

      expect(result.contextNeeded).toContain('history_context');
    });

    it('should identify user context need', () => {
      const result = service.analyze('Use the user profile information');

      expect(result.contextNeeded).toContain('user_context');
    });

    it('should identify data context need', () => {
      const result = service.analyze('Extract all data from the page');

      expect(result.contextNeeded.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Calculation', () => {
    it('should give high confidence to clear goals', () => {
      const result = service.analyze('Navigate to https://example.com and click the login button');

      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should give lower confidence to vague goals', () => {
      const result = service.analyze('Do stuff on a site');

      expect(result.confidence).toBeLessThan(50);
    });

    it('should increase confidence with punctuation', () => {
      const noPunctResult = service.analyze('Navigate to google');
      const withPunctResult = service.analyze('Navigate to google.com, please');

      expect(withPunctResult.confidence).toBeGreaterThanOrEqual(noPunctResult.confidence);
    });

    it('should increase confidence with specific entities', () => {
      const vagueResult = service.analyze('Go to a website');
      const specificResult = service.analyze('Navigate to https://github.com/username/repo');

      expect(specificResult.confidence).toBeGreaterThan(vagueResult.confidence);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with various formats', () => {
      const result1 = service.analyze('Visit www.example.com');
      const result2 = service.analyze('Go to https://example.com/path?query=value');
      service.analyze('Check example.com for details');

      expect(result1.entities.filter((e) => e.type === 'url').length).toBeGreaterThan(0);
      expect(result2.entities.filter((e) => e.type === 'url').length).toBeGreaterThan(0);
    });

    it('should handle multiple constraints', () => {
      const result = service.analyze('Quickly navigate to the page without using the search, only click once');

      expect(result.constraints.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle mixed intent keywords', () => {
      const result = service.analyze('Go to the page, find the button, click it, and extract the result');

      expect(result.entities.length).toBeGreaterThanOrEqual(1);
      expect(['navigate', 'extract', 'interact']).toContain(result.intent.type);
    });

    it('should handle goals with special characters', () => {
      const result = service.analyze('Navigate to https://example.com/search?q=test&sort=date');

      expect(result.entities.filter((e) => e.type === 'url').length).toBeGreaterThan(0);
    });
  });

  describe('Analysis Output Structure', () => {
    it('should return all required fields', () => {
      const result = service.analyze('Test goal for analysis');

      expect(result).toHaveProperty('originalGoal');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('constraints');
      expect(result).toHaveProperty('requirements');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('contextNeeded');
      expect(result).toHaveProperty('confidence');
    });

    it('should have valid field types', () => {
      const result = service.analyze('Test goal');

      expect(typeof result.originalGoal).toBe('string');
      expect(typeof result.intent).toBe('object');
      expect(Array.isArray(result.entities)).toBe(true);
      expect(Array.isArray(result.constraints)).toBe(true);
      expect(Array.isArray(result.requirements)).toBe(true);
      expect(typeof result.complexity).toBe('number');
      expect(Array.isArray(result.contextNeeded)).toBe(true);
      expect(typeof result.confidence).toBe('number');
    });
  });
});
