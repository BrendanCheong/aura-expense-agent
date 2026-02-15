/**
 * Defines the shape of data flowing through the agent graph.
 *
 * Uses the Annotation API for state management.
 * The `messages` field uses a message reducer to properly accumulate
 * messages across graph nodes.
 */

import { Annotation, messagesStateReducer } from '@langchain/langgraph';

import type { Confidence } from '@/lib/enums';
import type { BaseMessage } from '@langchain/core/messages';


export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Input from email webhook
  emailHtml: Annotation<string>,
  emailText: Annotation<string>,
  emailSubject: Annotation<string>,
  emailDate: Annotation<string>,
  resendEmailId: Annotation<string>,
  userId: Annotation<string>,

  // Extracted data
  vendor: Annotation<string | null>,
  amount: Annotation<number | null>,
  transactionDate: Annotation<string | null>,

  // Category
  categoryId: Annotation<string | null>,
  categoryName: Annotation<string | null>,
  confidence: Annotation<Confidence | null>,

  // Context from strategies / tools
  userCategories: Annotation<Array<{
    id: string;
    name: string;
    description: string;
  }> | null>,
  searchResults: Annotation<string | null>,
  memoryContext: Annotation<string | null>,
  cacheHit: Annotation<boolean>,

  // Output
  transactionId: Annotation<string | null>,
  error: Annotation<string | null>,
});

export type AgentStateType = typeof AgentState.State;
