import { z } from 'zod';

export const updateUserProfileBodySchema = z
  .object({
    monthlySalary: z.coerce.number().nonnegative().optional(),
    budgetMode: z.enum(['direct', 'percentage']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });
