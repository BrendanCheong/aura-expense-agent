/**
 * IExpenseAgent — Interface for the AI expense processing agent.
 *
 * Abstracts the LangGraph agent behind a clean DI boundary so that:
 * - WebhookService depends on the interface, not the implementation
 * - Tests can inject a mock agent without LangChain/OpenAI dependencies
 * - The real implementation delegates to processExpenseEmail() from graph.ts
 *
 * @see FEAT-005 (AI Agent)
 */

import type { Confidence } from '@/lib/enums';

/**
 * Result returned by the agent after processing an email.
 */
export interface AgentResult {
  transactionId: string | null;
  vendor: string | null;
  amount: number | null;
  categoryId: string | null;
  categoryName: string | null;
  confidence: Confidence | null;
  transactionDate: string | null;
  error: string | null;
}

/**
 * Input parameters for processing an expense email.
 */
export interface AgentEmailInput {
  emailHtml: string;
  emailText: string;
  emailSubject: string;
  emailDate: string;
  resendEmailId: string;
  userId: string;
}

/**
 * Interface for the expense processing agent.
 * Implementations: LangGraphExpenseAgent (production), MockExpenseAgent (tests).
 */
export interface IExpenseAgent {
  processEmail(input: AgentEmailInput): Promise<AgentResult>;
}
