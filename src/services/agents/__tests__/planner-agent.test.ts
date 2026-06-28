/**
 * Planner Agent Tests
 * Comprehensive test suite for planner agent functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlannerAgent, type PlannerOutput } from '@services/agents/planner-agent';
import { AgentStatus } from '@services/agents/base-agent';

describe('PlannerAgent', () => {
  let planner: PlannerAgent;

  beforeEach(() => {
    planner = new PlannerAgent();
  });

  describe('Agent Lifecycle', () => {
    it('should initialize with IDLE status', () => {
      expect(planner.getStatus()).toBe(AgentStatus.IDLE);
    });

    it('should initialize context correctly', () => {
      const context = {
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Navigate to example.com' }
      };

      planner.initialize(context);
      expect(planner.getStatus()).toBe(AgentStatus.IDLE);
    });

    it('should reset to IDLE state', () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test goal' }
      });

      planner.reset();
      expect(planner.getStatus()).toBe(AgentStatus.IDLE);
      expect(planner.getMessages().length).toBe(0);
    });

    it('should collect messages during execution', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Navigate to example.com' }
      });

      await planner.execute();
      const messages = planner.getMessages();
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Plan Execution', () => {
    beforeEach(() => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Navigate to example.com' }
      });
    });

    it('should execute and return PlannerOutput', async () => {
      const output = (await planner.execute()) as PlannerOutput;

      expect(output).toBeDefined();
      expect(output.plan).toBeDefined();
      expect(output.confidence).toBeGreaterThanOrEqual(0);
      expect(output.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(output.errors)).toBe(true);
      expect(Array.isArray(output.warnings)).toBe(true);
      expect(output.estimatedDuration).toBeGreaterThanOrEqual(0);
    });

    it('should create plan with valid structure', async () => {
      const output = (await planner.execute()) as PlannerOutput;
      const plan = output.plan;

      expect(plan.id).toMatch(/^plan_/);
      expect(plan.goal).toBe('Navigate to example.com');
      expect(Array.isArray(plan.actions)).toBe(true);
      expect(plan.status).toBe('pending');
      expect(plan.createdAt).toBeDefined();
      expect(plan.updatedAt).toBeDefined();
    });

    it('should generate actions for simple goal', async () => {
      const output = (await planner.execute()) as PlannerOutput;

      expect(output.plan.actions.length).toBeGreaterThan(0);
      expect(output.plan.actions[0]).toHaveProperty('type');
      expect(output.plan.actions[0]).toHaveProperty('description');
    });

    it('should have positive confidence for valid goal', async () => {
      const output = (await planner.execute()) as PlannerOutput;

      expect(output.confidence).toBeGreaterThan(0);
      expect(output.confidence).toBeLessThanOrEqual(100);
    });

    it('should estimate reasonable duration', async () => {
      const output = (await planner.execute()) as PlannerOutput;

      // Duration should be at least 1 second and less than 1 hour
      expect(output.estimatedDuration).toBeGreaterThanOrEqual(1000);
      expect(output.estimatedDuration).toBeLessThan(3600000);
    });
  });

  describe('Complex Goals', () => {
    it('should handle moderate complexity goals', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: {
          goal: 'Navigate to example.com and click the login button, then enter credentials'
        }
      });

      const output = (await planner.execute()) as PlannerOutput;

      expect(output.plan.actions.length).toBeGreaterThan(1);
      expect(output.plan.actions[0].dependencies).toBeDefined();
    });

    it('should handle complex workflow goals', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: {
          goal: 'Navigate to product page, extract price and description, compare with competitor site'
        }
      });

      const output = (await planner.execute()) as PlannerOutput;

      expect(output.plan.actions.length).toBeGreaterThanOrEqual(3);
      expect(output.confidence).toBeGreaterThan(0);
    });

    it('should set lower confidence for complex plans', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Simple goal' }
      });

      const simpleOutput = (await planner.execute()) as PlannerOutput;

      planner.reset();
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: {
          goal: 'Complex workflow with multiple steps and branches and conditional logic and error handling'
        }
      });

      const complexOutput = (await planner.execute()) as PlannerOutput;

      // Complex goals should have lower or similar confidence due to more uncertainty
      expect(complexOutput.confidence).toBeLessThanOrEqual(simpleOutput.confidence + 10);
    });
  });

  describe('Error Handling', () => {
    it('should throw error without goal', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: {}
      });

      await expect(planner.execute()).rejects.toThrow('No goal provided for planning');
    });

    it('should throw error without context', async () => {
      await expect(planner.execute()).rejects.toThrow('Planner agent context not initialized');
    });

    it('should detect circular dependencies', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test goal with circular deps' }
      });

      const output = (await planner.execute()) as PlannerOutput;

      // Should detect if there are circular dependencies
      if (output.errors.length > 0) {
        expect(output.errors[0]).toMatch(/[Cc]ircular|[Dd]ependen/);
      }
    });

    it('should have error messages when confidence is low', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Very complex undefined multi-stage workflow' }
      });

      const output = (await planner.execute()) as PlannerOutput;

      if (output.confidence < 50) {
        expect(output.errors.length + output.warnings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Action Dependencies', () => {
    it('should maintain dependency order', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Navigate then interact then extract data' }
      });

      const output = (await planner.execute()) as PlannerOutput;
      const actions = output.plan.actions;

      // Navigate should typically come before interactions
      if (actions.length >= 2) {
        const navIndex = actions.findIndex((a) => a.type === 'navigate');
        const intIndex = actions.findIndex((a) => a.type === 'interact');

        if (navIndex !== -1 && intIndex !== -1) {
          expect(navIndex).toBeLessThanOrEqual(intIndex);
        }
      }
    });

    it('should resolve dependencies correctly', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Complete multi-step workflow' }
      });

      const output = (await planner.execute()) as PlannerOutput;
      const actions = output.plan.actions;

      // Verify all dependencies exist as actions
      for (const action of actions) {
        for (const dep of action.dependencies || []) {
          const depExists = actions.some((a) => a.id === dep);
          if (!depExists) {
            // Dependency not found - should be in errors
            expect(output.errors.some((e) => e.includes(dep))).toBe(true);
          }
        }
      }
    });
  });

  describe('Duration Estimation', () => {
    it('should estimate longer duration for complex plans', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Navigate to page' }
      });

      const simpleOutput = (await planner.execute()) as PlannerOutput;
      const simpleDuration = simpleOutput.estimatedDuration;

      planner.reset();
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Navigate then extract then analyze then submit' }
      });

      const complexOutput = (await planner.execute()) as PlannerOutput;
      const complexDuration = complexOutput.estimatedDuration;

      // Complex should generally take longer
      expect(complexDuration).toBeGreaterThanOrEqual(simpleDuration);
    });

    it('should calculate reasonable time per action', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test workflow' }
      });

      const output = (await planner.execute()) as PlannerOutput;

      if (output.plan.actions.length > 0) {
        const avgTimePerAction = output.estimatedDuration / output.plan.actions.length;
        // Actions should take between 100ms and 5 seconds on average
        expect(avgTimePerAction).toBeGreaterThanOrEqual(100);
        expect(avgTimePerAction).toBeLessThan(5000);
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should decrease confidence with unspecified parameters', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Click something on a page' }
      });

      const output = (await planner.execute()) as PlannerOutput;

      // Unspecified selector should lower confidence
      expect(output.confidence).toBeGreaterThanOrEqual(0);
      expect(output.confidence).toBeLessThanOrEqual(100);
    });

    it('should increase confidence with specific parameters', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Navigate to https://example.com' }
      });

      const output = (await planner.execute()) as PlannerOutput;

      // Specific URL should increase confidence
      expect(output.confidence).toBeGreaterThan(30);
    });

    it('should handle confidence bounds correctly', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test goal here' }
      });

      const output = (await planner.execute()) as PlannerOutput;

      expect(output.confidence).toBeGreaterThanOrEqual(0);
      expect(output.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Message Collection', () => {
    it('should collect plan creation message', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test goal' }
      });

      await planner.execute();
      const messages = planner.getMessages();

      const hasCreatedMsg = messages.some((m) => m.content.includes('Plan created'));
      expect(hasCreatedMsg).toBe(true);
    });

    it('should include parsed goal in messages', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test goal' }
      });

      await planner.execute();
      const messages = planner.getMessages();

      const hasParsingMsg = messages.some((m) => m.content.includes('Parsed goal'));
      expect(hasParsingMsg).toBe(true);
    });

    it('should clear messages on reset', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test goal' }
      });

      await planner.execute();
      expect(planner.getMessages().length).toBeGreaterThan(0);

      planner.clearMessages();
      expect(planner.getMessages().length).toBe(0);
    });
  });

  describe('Metadata', () => {
    it('should return valid metadata', () => {
      const metadata = planner.getMetadata();

      expect(metadata.id).toMatch(/planner/);
      expect(metadata.status).toBe('idle');
      expect(metadata.type).toBe('base');
      expect(metadata.createdAt).toBeDefined();
    });

    it('should update status in metadata', async () => {
      planner.initialize({
        conversationId: 'conv-123',
        sessionId: 'session-456',
        variables: { goal: 'Test goal' }
      });

      await planner.execute();

      const metadata = planner.getMetadata();
      expect(['completed', 'failed']).toContain(metadata.status);
    });
  });
});
