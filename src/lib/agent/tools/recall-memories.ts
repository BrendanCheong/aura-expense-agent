/**
 * Tool: Recall user correction memories from Mem0 Cloud.
 *
 * Tier 2 in the categorization strategy chain. Searches for past
 * user preferences about vendor categorization.
 *
 * Supports Dependency Injection via createRecallMemoriesTool() factory,
 * and a default export that uses the global Mem0 client.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { getMem0Client } from '@/lib/mem0/client';

const RECALL_SCHEMA = z.object({
  userId: z.string().describe('The Appwrite user ID'),
  vendor: z.string().describe('The vendor name to search memories for'),
});

/**
 * Standalone function — testable without LangChain wrapper.
 */
export async function recallMemories(
  userId: string,
  vendor: string,
  mem0Client: { search(query: string, opts: { user_id: string; top_k: number }): Promise<Array<{ memory?: string; score?: number }>> },
): Promise<string> {
  const memories = await mem0Client.search(
    `How should I categorize ${vendor}?`,
    { user_id: userId, top_k: 5 },
  );

  if (!memories || memories.length === 0) {
    return `No previous memories found for vendor "${vendor}". Proceed with default categorization.`;
  }

  const formattedMemories = memories
    .map(({ memory, score }, i) => {
      const content = memory || '(no content)';
      const relevance = score ? ` (relevance: ${(score * 100).toFixed(0)}%)` : '';
      return `${i + 1}. ${content}${relevance}`;
    })
    .join('\n');

  return `Found ${memories.length} relevant memories for vendor "${vendor}":\n${formattedMemories}\nUse these memories to inform your categorization decision. User preferences from past feedback should take priority.`;
}

/**
 * Dependency Injection factory.
 */
export function createRecallMemoriesTool(
  mem0Client: { search(query: string, opts: { user_id: string; top_k: number }): Promise<Array<{ memory?: string; score?: number }>> },
) {
  return tool(
    ({ userId, vendor }) => recallMemories(userId, vendor, mem0Client),
    {
      name: 'recall_memories',
      description: `Search the user's feedback memory (Mem0) for past corrections and preferences about a vendor or expense category. Use this AFTER a vendor cache miss, BEFORE attempting to categorize with your own reasoning. If the user has previously corrected a categorization for this or a similar vendor, their preference should take priority.`,
      schema: RECALL_SCHEMA,
    },
  );
}

/**
 * Default export — uses the global Mem0 client singleton.
 */
export const recallMemoriesTool = tool(
  ({ userId, vendor }) => {
    const mem0 = getMem0Client();
    return recallMemories(userId, vendor, mem0);
  },
  {
    name: 'recall_memories',
    description: `Search the user's feedback memory (Mem0) for past corrections and preferences about a vendor or expense category. Use this AFTER a vendor cache miss, BEFORE attempting to categorize with your own reasoning.`,
    schema: RECALL_SCHEMA,
  },
);
