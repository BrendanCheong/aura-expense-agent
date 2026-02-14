import { z } from 'zod';
import { idSchema } from './common.schemas';

export const createCategoryBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a 6-digit hex code').optional(),
});

export const updateCategoryParamsSchema = z.object({
  id: idSchema,
});

export const updateCategoryBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a 6-digit hex code').optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
});

export const deleteCategoryParamsSchema = updateCategoryParamsSchema;
