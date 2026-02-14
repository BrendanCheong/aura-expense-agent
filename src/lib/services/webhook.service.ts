/**
 * Webhook service — processes inbound email webhooks from Resend.
 *
 * Will be fully implemented during FEAT-004 (Webhook Handler).
 */

import type { ITransactionRepository, IVendorCacheRepository } from '@/lib/repositories/interfaces';

export class WebhookService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
    private readonly agent: unknown, // Will be typed to ExpenseAgent in FEAT-005
  ) {}

  async processInboundEmail(_params: {
    emailHtml: string;
    emailText: string;
    emailSubject: string;
    emailDate: string;
    resendEmailId: string;
    userId: string;
  }): Promise<{ transactionId: string } | { status: 'duplicate' | 'cached' }> {
    // TODO: Implement in FEAT-004
    throw new Error('Webhook service not yet implemented. See FEAT-004.');
  }
}
