import { z } from 'zod';

import { amountSchema, idSchema, monthSchema, yearSchema } from './common.schemas';

export const listBudgetsQuerySchema = z.object({
  year: yearSchema.optional(),
  month: monthSchema.optional(),
});

export const createBudgetBodySchema = z.object({
  categoryId: idSchema,
  amount: amountSchema,
  year: yearSchema,
  month: monthSchema,
});

export const deleteBudgetParamsSchema = z.object({
  id: idSchema,
});
