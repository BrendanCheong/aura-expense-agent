import { z } from 'zod';
import { idSchema } from './common.schemas';

export const feedbackConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

export const feedbackBodySchema = z.object({
  transactionId: idSchema,
  feedbackText: z.string().min(1).max(4000),
  conversationHistory: z.array(feedbackConversationMessageSchema).default([]),
});

export const feedbackApproveBodySchema = z.object({
  transactionId: idSchema,
  newCategoryId: idSchema,
  vendor: z.string().min(1).max(200),
  reasoning: z.string().min(1).max(4000),
});
