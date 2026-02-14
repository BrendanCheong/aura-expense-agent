import { z } from 'zod';
import { monthSchema, yearSchema } from './common.schemas';

export const dashboardPeriodSchema = z.enum(['week', 'month', 'year']).default('month');

export const dashboardSummaryQuerySchema = z.object({
  period: dashboardPeriodSchema,
  year: yearSchema.optional(),
  month: monthSchema.optional(),
  week: z.coerce.number().int().min(1).max(53).optional(),
});
