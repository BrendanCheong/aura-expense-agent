/**
 * LangGraph agent state definition.
 * Defines the shape of data flowing through the agent graph.
 *
 * Will be implemented in FEAT-005 (AI Agent).
 */

import type { AgentInput, AgentOutput } from '@/types/agent';

export interface AgentState {
  input: AgentInput;
  output?: AgentOutput;
  intermediateSteps: unknown[];
  error?: string;
}

export function createInitialState(input: AgentInput): AgentState {
  return {
    input,
    intermediateSteps: [],
  };
}
