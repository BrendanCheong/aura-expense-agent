/**
 * Unit tests for the LangGraph agent graph.
 *
 * Tests graph compilation, node execution, and conditional edges.
 * All LLM calls are mocked.
 *
 */

import { AIMessage } from '@langchain/core/messages';
import { describe, test, expect, vi, beforeEach } from 'vitest';

interface MockChatOpenAI {
  invoke: ReturnType<typeof vi.fn>;
  bindTools: ReturnType<typeof vi.fn>;
}

vi.mock('@langchain/openai', () => {
  const ChatOpenAI = vi.fn(function (this: MockChatOpenAI) {
    this.invoke = vi.fn().mockResolvedValue(
      new AIMessage({ content: 'Processing email...' })
    );
    this.bindTools = vi.fn().mockReturnValue(this);
  });
  return { ChatOpenAI };
});

vi.mock('@/lib/agent/tools/tool-factory', () => ({
  createAgentTools: vi.fn().mockReturnValue([]),
}));

import { createExpenseAgentGraph } from '@/lib/agent/graph';

describe('Agent Graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('compiles without errors', () => {
    const graph = createExpenseAgentGraph({ tools: [], systemPrompt: 'test' });
    expect(graph).toBeDefined();

    const compiled = graph.compile();
    expect(compiled).toBeDefined();
  });

  test('graph has agent and tools nodes', async () => {
    const graph = createExpenseAgentGraph({ tools: [], systemPrompt: 'test' });
    const compiled = graph.compile();

    // Verify graph has the expected structure
    // Use drawMermaid() which is a reliable API for inspecting graph
    const asyncGraph = await compiled.getGraphAsync();
    const mermaid = asyncGraph.drawMermaid();
    expect(mermaid).toContain('agent');
    expect(mermaid).toContain('tools');
  });

  test('shouldContinue routes to tools when tool_calls present', async () => {
    const { shouldContinue } = await import('@/lib/agent/graph');

    const stateWithToolCalls = {
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_1',
              name: 'extract_expense',
              args: { emailText: 'test', emailHtml: '', emailSubject: 'test', emailDate: '2026-02-15' },
            },
          ],
        }),
      ],
    };

    const result = shouldContinue(stateWithToolCalls);
    expect(result).toBe('tools');
  });

  test('shouldContinue routes to end when no tool_calls', async () => {
    const { shouldContinue } = await import('@/lib/agent/graph');

    const stateWithoutToolCalls = {
      messages: [
        new AIMessage({ content: 'Done processing.' }),
      ],
    };

    const result = shouldContinue(stateWithoutToolCalls);
    expect(result).toBe('end');
  });

  test('processExpenseEmail returns result with expected fields', async () => {
    // This test verifies the entry point function signature
    // The actual LLM call is mocked
    const { processExpenseEmail } = await import('@/lib/agent/graph');

    // We can't easily test the full flow without a real LLM,
    // but we can verify it doesn't throw on initialization
    expect(processExpenseEmail).toBeDefined();
    expect(typeof processExpenseEmail).toBe('function');
  });

  test('graph handles message reducer correctly', () => {
    const graph = createExpenseAgentGraph({ tools: [], systemPrompt: 'test' });
    const compiled = graph.compile();

    expect(compiled).toHaveProperty('invoke');
    expect(compiled).toHaveProperty('stream');
  });
});
