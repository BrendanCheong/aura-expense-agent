/**
 * LangGraph agent graph definition.
 * Orchestrates the expense processing pipeline using a
 * StateGraph with tool-calling loop (agent ↔ tools).
 *
*/

import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import { StateGraph, type RetryPolicy } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { AgentState, type AgentStateType } from './state';

import type { StructuredToolInterface } from '@langchain/core/tools';
export const AGENT_TIMEOUT_MS = 25_000;
export const AGENT_RECURSION_LIMIT = 15;

/**
 * Default retry policy for agent nodes.
 * Retries transient LLM / network errors with exponential backoff.
 */
export const AGENT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialInterval: 500,
  backoffFactor: 2,
  maxInterval: 5_000,
  jitter: true,
};

export interface GraphConfig {
  tools: StructuredToolInterface[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}

/**
 * Determines whether the agent should call more tools or finish the reasoning loop.
 * Acts as a coditional edge.
 */
export function shouldContinue(
  state: Pick<AgentStateType, 'messages'>,
): 'tools' | 'end' {
  const lastMessage = state.messages[state.messages.length - 1];

  // If the LLM wants to call tools, route to tool node
  if (
    lastMessage instanceof AIMessage &&
    (lastMessage.tool_calls?.length ?? 0) > 0
  ) {
    return 'tools';
  }

  return 'end';
}

// ---------------------------------------------------------------------------
// Graph builder
// ---------------------------------------------------------------------------

/**
 * Build the raw StateGraph (not yet compiled).
 */
export function createExpenseAgentGraph(config: GraphConfig) {
  const {
    tools,
    systemPrompt = SYSTEM_PROMPT,
    model: modelName = 'gpt-5.2',
    temperature = 0,
  } = config;

  const model = new ChatOpenAI({ model: modelName, temperature }).bindTools(tools);
  const toolNode = new ToolNode(tools);

  async function agentNode(state: AgentStateType) {
    const emailContent = state.emailText || state.emailHtml || '';
    const systemMsg = new SystemMessage(systemPrompt);
    const humanMsg = new HumanMessage(
      buildUserPrompt(emailContent, state.emailSubject),
    );

    // Build the messages array: system + human + any accumulated messages
    const inputMessages: BaseMessage[] = [systemMsg, humanMsg, ...state.messages];

    const response = await model.invoke(inputMessages);
    return { messages: [response] };
  }

  const graph = new StateGraph(AgentState)
    .addNode('agent', agentNode, { retryPolicy: AGENT_RETRY_POLICY })
    .addNode('tools', toolNode, { retryPolicy: AGENT_RETRY_POLICY })
    .addEdge('__start__', 'agent')
    .addConditionalEdges('agent', shouldContinue, {
      tools: 'tools',
      end: '__end__',
    })
    .addEdge('tools', 'agent');

  return graph;
}

/**
 * Create a compiled, ready to invoke expense agent.
 */
export function createExpenseAgent(config?: Partial<GraphConfig>) {
  const graph = createExpenseAgentGraph({
    tools: config?.tools ?? [],
    systemPrompt: config?.systemPrompt,
    model: config?.model,
    temperature: config?.temperature,
  });

  return graph.compile();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Convenience function for processing an email.
 * Wires up tools from the production container and invokes the graph.
 */
export async function processExpenseEmail(params: {
  emailHtml: string;
  emailText: string;
  emailSubject: string;
  emailDate: string;
  resendEmailId: string;
  userId: string;
  tools?: StructuredToolInterface[];
}) {
  const agent = createExpenseAgent({ tools: params.tools ?? [] });

  const initialState = {
    emailHtml: params.emailHtml,
    emailText: params.emailText,
    emailSubject: params.emailSubject,
    emailDate: params.emailDate,
    resendEmailId: params.resendEmailId,
    userId: params.userId,
    messages: [],
    vendor: null,
    amount: null,
    transactionDate: null,
    categoryId: null,
    categoryName: null,
    confidence: null,
    userCategories: null,
    searchResults: null,
    memoryContext: null,
    cacheHit: false,
    transactionId: null,
    error: null,
  };

  // Race the agent invocation against a timeout to ensure the webhook
  // can respond within Resend's 30-second deadline (25s agent + 5s buffer).
  const agentPromise = agent.invoke(initialState, {
    recursionLimit: AGENT_RECURSION_LIMIT,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Agent timed out after ${AGENT_TIMEOUT_MS}ms`)),
      AGENT_TIMEOUT_MS,
    );
  });

  const result = await Promise.race([agentPromise, timeoutPromise]);

  return result;
}
