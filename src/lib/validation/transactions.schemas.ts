import { z } from 'zod';
import {
  amountSchema,
  idSchema,
  isoDateTimeSchema,
  paginationSchema,
  sortOrderSchema,
} from './common.schemas';

export const transactionSourceSchema = z.enum(['email', 'manual']);

export const listTransactionsQuerySchema = paginationSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: idSchema.optional(),
  source: transactionSourceSchema.optional(),
  sortBy: z.enum(['transactionDate', 'amount', 'vendor', 'confidence', 'createdAt', 'updatedAt']).default('transactionDate'),
  sortOrder: sortOrderSchema,
});

export const createTransactionBodySchema = z.object({
  amount: amountSchema,
  vendor: z.string().min(1).max(200),
  categoryId: idSchema,
  transactionDate: isoDateTimeSchema,
  description: z.string().max(1000).optional(),
});

export const updateTransactionParamsSchema = z.object({
  id: idSchema,
});

export const updateTransactionBodySchema = z.object({
  categoryId: idSchema.optional(),
  amount: amountSchema.optional(),
  vendor: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  transactionDate: isoDateTimeSchema.optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
});

export const deleteTransactionParamsSchema = updateTransactionParamsSchema;
