import { z } from 'zod';

export const idSchema = z.string().min(1);

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const yearSchema = z.coerce.number().int().min(2000).max(2100);
export const monthSchema = z.coerce.number().int().min(1).max(12);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export const amountSchema = z.coerce.number().positive();
