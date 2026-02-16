/**
 * LangGraphExpenseAgent — Production implementation of IExpenseAgent.
 *
 * Wraps the LangGraph processExpenseEmail() function behind the
 * IExpenseAgent interface for DI compatibility.
 *
 */

import { processExpenseEmail } from './graph';

import type { IExpenseAgent, AgentEmailInput, AgentResult } from './interfaces';
import type { Confidence } from '@/lib/enums';

export class LangGraphExpenseAgent implements IExpenseAgent {
  async processEmail(input: AgentEmailInput): Promise<AgentResult> {
    try {
      const state = await processExpenseEmail({
        emailHtml: input.emailHtml,
        emailText: input.emailText,
        emailSubject: input.emailSubject,
        emailDate: input.emailDate,
        resendEmailId: input.resendEmailId,
        userId: input.userId,
      });

      return {
        transactionId: state.transactionId ?? null,
        vendor: state.vendor ?? null,
        amount: state.amount ?? null,
        categoryId: state.categoryId ?? null,
        categoryName: state.categoryName ?? null,
        confidence: (state.confidence as Confidence) ?? null,
        transactionDate: state.transactionDate ?? null,
        error: state.error ?? null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown agent error';
      console.error('[LangGraphExpenseAgent] Agent failed:', message);

      return {
        transactionId: null,
        vendor: null,
        amount: null,
        categoryId: null,
        categoryName: null,
        confidence: null,
        transactionDate: null,
        error: message,
      };
    }
  }
}
