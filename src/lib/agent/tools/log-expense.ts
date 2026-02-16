/**
 * Tool: Log the categorized expense to the database.
 *
 * Creates a Transaction record and updates the vendor cache
 * for future fast-path categorization.
 *
 * Supports Dependency Injection via createLogExpenseTool() factory.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import type { TransactionCreate } from '@/types/transaction';

import { Confidence, TransactionSource } from '@/lib/enums';


const LOG_EXPENSE_SCHEMA = z.object({
  userId: z.string(),
  categoryId: z.string().describe('The ID of the matched category'),
  amount: z.number().describe('Transaction amount in SGD'),
  vendor: z.string().describe('The merchant or vendor name'),
  transactionDate: z.string().describe('The ISO 8601 date in SGT'),
  resendEmailId: z.string().describe('Resend email ID for deduplication'),
  emailSubject: z.string().describe('Original email subject'),
  confidence: z
    .enum([Confidence.HIGH, Confidence.MEDIUM, Confidence.LOW])
    .describe('AI categorization confidence level'),
});

export interface LogExpenseDeps {
  transactionRepo: {
    create(data: TransactionCreate): Promise<{ id: string }>;
  };
  vendorCacheRepo: {
    findByUserAndVendor(userId: string, vendorName: string): Promise<{ id: string } | null>;
    create(userId: string, vendorName: string, categoryId: string): Promise<unknown>;
  };
}

/**
 * Standalone function — testable without LangChain wrapper.
 */
export async function logExpense(
  params: z.infer<typeof LOG_EXPENSE_SCHEMA>,
  deps: LogExpenseDeps,
): Promise<{ transactionId: string; status: string }> {
  const { normalizeVendorName } = await import('@/lib/utils/vendor');

  const txData: TransactionCreate = {
    userId: params.userId,
    categoryId: params.categoryId,
    amount: params.amount,
    vendor: params.vendor,
    description: `Auto-categorized from email: ${params.emailSubject}`,
    transactionDate: params.transactionDate,
    resendEmailId: params.resendEmailId,
    rawEmailSubject: params.emailSubject,
    confidence: params.confidence as Confidence,
    source: TransactionSource.EMAIL,
  };

  const transaction = await deps.transactionRepo.create(txData);

  // Update vendor cache for future fast-path lookups
  const normalised = normalizeVendorName(params.vendor);
  const cached = await deps.vendorCacheRepo.findByUserAndVendor(params.userId, normalised);
  if (!cached) {
    await deps.vendorCacheRepo.create(params.userId, normalised, params.categoryId);
  }

  return { transactionId: transaction.id, status: 'success' };
}

/**
 * Dependency Injection factory.
 */
export function createLogExpenseTool(deps: LogExpenseDeps) {
  return tool(
    async (params) => JSON.stringify(await logExpense(params, deps)),
    {
      name: 'log_expense',
      description: `Log the extracted and categorized expense to the database and update the vendor cache for future lookups.`,
      schema: LOG_EXPENSE_SCHEMA,
    },
  );
}
