/**
 * Webhook service — processes inbound email webhooks from Resend.
 *
 * Handles the full pipeline:
 * 1. Dedup check by resend_email_id
 * 2. Vendor extraction via regex fast-path
 * 3. Vendor cache lookup (fast-path: skip agent)
 * 4. Agent invocation for unknown vendors
 * 5. Transaction creation
 * 6. Vendor cache update
 *
 * @see ADR-008 (Service Layer Pattern)
 * @see FEAT-004 (Webhook Handler)
 */

import type { IExpenseAgent, AgentResult } from '@/lib/agent/interfaces';
import type { ITransactionRepository, IVendorCacheRepository, IUserRepository } from '@/lib/repositories/interfaces';
import type { WebhookProcessResult } from '@/types/webhook';

import { extractExpenseFromText } from '@/lib/agent/tools/extract-expense';
import { UNKNOWN_VENDOR } from '@/lib/constants';
import { Confidence, TransactionSource } from '@/lib/enums';
import { normalizeVendorName } from '@/lib/utils/vendor';

export class WebhookService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
    private readonly userRepo: IUserRepository,
    private readonly agent: IExpenseAgent,
  ) {}

  /**
   * Resolve a user from their inbound email address.
   * Returns null if no user is found (unknown recipient).
   */
  async resolveUserByInboundEmail(inboundEmail: string): Promise<string | null> {
    const user = await this.userRepo.findByInboundEmail(inboundEmail);
    return user?.id ?? null;
  }

  /**
   * Process an inbound email through the full webhook pipeline.
   *
   * Flow: Dedup → Extract → Cache Lookup → [HIT: fast path] / [MISS: agent] → Create Tx → Update Cache
   */
  async processInboundEmail(params: {
    emailHtml: string;
    emailText: string;
    emailSubject: string;
    emailDate: string;
    resendEmailId: string;
    userId: string;
  }): Promise<WebhookProcessResult> {
    const { emailHtml, emailText, emailSubject, emailDate, resendEmailId, userId } = params;

    // 1. Dedup check — has this email already been processed?
    const existing = await this.transactionRepo.findByResendEmailId(resendEmailId);
    if (existing) {
      return { status: 'duplicate' };
    }

    // 2. Regex fast-path extraction (amount, vendor, date)
    const extracted = extractExpenseFromText(emailText || emailHtml || '');

    // 3. Vendor cache lookup (only if we extracted a vendor)
    if (extracted?.vendor && extracted.vendor !== UNKNOWN_VENDOR) {
      const normalizedVendor = normalizeVendorName(extracted.vendor);
      const cachedEntry = await this.vendorCacheRepo.findByUserAndVendor(userId, normalizedVendor);

      if (cachedEntry) {
        // FAST PATH: Known vendor → create transaction immediately, skip agent
        const transaction = await this.transactionRepo.create({
          userId,
          categoryId: cachedEntry.categoryId,
          amount: extracted.amount,
          vendor: normalizedVendor,
          description: emailSubject,
          transactionDate: extracted.dateRaw || emailDate,
          resendEmailId,
          rawEmailSubject: emailSubject,
          confidence: Confidence.HIGH,
          source: TransactionSource.EMAIL,
        });

        // Increment vendor cache hit count
        await this.vendorCacheRepo.incrementHitCount(cachedEntry.id, cachedEntry.hitCount);

        return { status: 'cached', transactionId: transaction.id };
      }
    }

    // 4. Cache miss or no vendor extracted → invoke AI agent
    const agentResult: AgentResult = await this.agent.processEmail({
      emailHtml,
      emailText,
      emailSubject,
      emailDate,
      resendEmailId,
      userId,
    });

    // 5. Agent returned no transaction (non-transaction email)
    if (!agentResult.transactionId) {
      return { status: 'skipped' };
    }

    // 6. Update vendor cache for the newly processed vendor
    if (agentResult.vendor && agentResult.categoryId) {
      const normalizedVendor = normalizeVendorName(agentResult.vendor);
      const existingCache = await this.vendorCacheRepo.findByUserAndVendor(userId, normalizedVendor);

      if (existingCache) {
        // Update existing cache entry if category changed
        if (existingCache.categoryId !== agentResult.categoryId) {
          await this.vendorCacheRepo.updateCategoryId(existingCache.id, agentResult.categoryId);
        }
        await this.vendorCacheRepo.incrementHitCount(existingCache.id, existingCache.hitCount);
      } else {
        // Create new vendor cache entry
        await this.vendorCacheRepo.create(userId, normalizedVendor, agentResult.categoryId);
      }
    }

    return { status: 'processed', transactionId: agentResult.transactionId };
  }
}
