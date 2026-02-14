import { z } from 'zod';

export const resendWebhookEventSchema = z.object({
  type: z.string(),
  data: z.object({
    email_id: z.string().min(1),
    from: z.string().optional(),
    to: z.array(z.string()).optional(),
    subject: z.string().optional(),
    created_at: z.string().optional(),
  }),
});
