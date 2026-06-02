/**
 * AI Planner Panel Component
 * Main interface for interacting with the PlannerAgent
 */

import React, { useState, useEffect } from 'react';
import { PlannerAgent, type PlannerOutput } from '@services/agents';
import { logger } from '@utils/logger';

const SCOPE = 'AIPlannerPanel';

interface ExecutionState {
  isLoading: boolean;
  currentPlan: PlannerOutput | null;
  error: string | null;
  successMessage: string | null;
}

export function AIPlannerPanel(): React.ReactElement {
  const [goalInput, setGoalInput] = useState('');
  const [state, setState] = useState<ExecutionState>({
    isLoading: false,
    currentPlan: null,
    error: null,
    successMessage: null,
  });

  const planner = new PlannerAgent();

  const handlePlanGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) {
      setState((s) => ({ ...s, error: 'Please enter a goal' }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null, successMessage: null }));

    try {
      await planner.initialize({
        conversationId: `conv-${Date.now()}`,
        sessionId: `session-${Date.now()}`,
        pageContext: {
          url: 'http://localhost:5173',
          title: 'Lumo Browser',
        },
        previousResults: [],
        variables: {},
      });

      const result = await planner.execute({
        goal: goalInput,
        context: { currentPage: 'http://localhost:5173' },
      });

      setState((s) => ({
        ...s,
        isLoading: false,
        currentPlan: result,
        successMessage: `Plan created with ${result.plan.length} steps (${result.confidence}% confidence)`,
      }));

      logger.info(SCOPE, 'Plan created successfully', { confidence: result.confidence, steps: result.plan.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plan';
      setState((s) => ({ ...s, isLoading: false, error: errorMessage }));
      logger.error(SCOPE, 'Plan creation failed', { error: errorMessage });
    }
  };

  const clearPlan = () => {
    setState((s) => ({ ...s, currentPlan: null, error: null, successMessage: null }));
    setGoalInput('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-50 dark:bg-green-900/30';
    if (confidence >= 60) return 'bg-yellow-50 dark:bg-yellow-900/30';
    return 'bg-red-50 dark:bg-red-900/30';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          AI Planner Agent
        </h2>
        <p className="text-xs text-blue-100 mt-1">Transform goals into executable plans</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Goal Input */}
        <form onSubmit={handlePlanGoal} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your goal
            </label>
            <textarea
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="E.g., Navigate to Google, search for TypeScript tutorials, and extract top results"
              className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={state.isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={state.isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {state.isLoading ? 'Creating Plan...' : 'Create Plan'}
          </button>
        </form>

        {/* Error Message */}
        {state.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{state.error}</p>
          </div>
        )}

        {/* Success Message */}
        {state.successMessage && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">{state.successMessage}</p>
          </div>
        )}

        {/* Plan Display */}
        {state.currentPlan && (
          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Confidence Score */}
            <div className={`p-3 rounded-lg ${getConfidenceBg(state.currentPlan.confidence)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</span>
                <span className={`text-lg font-bold ${getConfidenceColor(state.currentPlan.confidence)}`}>
                  {state.currentPlan.confidence}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    state.currentPlan.confidence >= 80
                      ? 'bg-green-600'
                      : state.currentPlan.confidence >= 60
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${state.currentPlan.confidence}%` }}
                />
              </div>
            </div>

            {/* Plan Steps */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Steps ({state.currentPlan.plan.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {state.currentPlan.plan.map((action, idx) => (
                  <div key={idx} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {idx + 1}. {action.type.toUpperCase()}
                    </p>
                    {action.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{action.description}</p>
                    )}
                    {action.estimatedDuration && (
                      <p className="text-gray-500 dark:text-gray-400 mt-1">{action.estimatedDuration}ms</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {(state.currentPlan.estimatedDuration / 1000).toFixed(1)}s
                </p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Errors</p>
                <p className="font-semibold text-gray-900 dark:text-white">{state.currentPlan.errors.length}</p>
              </div>
            </div>

            {/* Errors/Warnings */}
            {state.currentPlan.errors.length > 0 && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">Issues:</p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  {state.currentPlan.errors.slice(0, 3).map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={clearPlan}
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors duration-200"
            >
              Clear Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
