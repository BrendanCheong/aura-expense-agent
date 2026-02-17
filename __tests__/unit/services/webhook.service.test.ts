import { describe, it, expect, beforeEach, vi } from 'vitest';

import webhookPayloads from '../../fixtures/webhook-payloads.json';
import {
  seedCategories,
  seedTransactions,
  seedUsers,
  seedVendorCache,
} from '../../helpers/seed';

import type { AgentResult, IExpenseAgent } from '@/lib/agent/interfaces';
import type { IEmailProvider, ReceivedEmail } from '@/lib/resend/interfaces';

import { Confidence, TransactionSource } from '@/lib/enums';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryUserRepository } from '@/lib/repositories/in-memory/user.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import { WebhookService } from '@/lib/services/webhook.service';

const USER_ID = 'test-user-001';

function createMockAgent(result?: Partial<AgentResult>): IExpenseAgent {
  return {
    processEmail: vi.fn().mockResolvedValue({
      transactionId: 'agent-tx-001',
      vendor: 'NEW VENDOR',
      amount: 42.0,
      categoryId: 'cat-other',
      categoryName: 'Other',
      confidence: Confidence.MEDIUM,
      transactionDate: '2026-02-08',
      error: null,
      ...result,
    }),
  };
}

function createMockEmailProvider(
  emailData?: Partial<ReceivedEmail>,
): IEmailProvider {
  return {
    getReceivedEmail: vi.fn().mockResolvedValue({
      id: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      to: ['user-test-user-001@inbound.yourdomain.com'],
      from: 'unialerts@uobgroup.com',
      subject: 'UOB Transaction Alert',
      html: webhookPayloads.resend_full_email_uob.html,
      text: webhookPayloads.resend_full_email_uob.text,
      createdAt: '2026-02-08T01:31:11.894719+00:00',
      ...emailData,
    }),
  };
}

describe('WebhookService', () => {
  let service: WebhookService;
  let transactionRepo: InMemoryTransactionRepository;
  let vendorCacheRepo: InMemoryVendorCacheRepository;
  let userRepo: InMemoryUserRepository;
  let categoryRepo: InMemoryCategoryRepository;
  let mockAgent: IExpenseAgent;
  let _mockEmailProvider: IEmailProvider;

  beforeEach(() => {
    transactionRepo = new InMemoryTransactionRepository();
    vendorCacheRepo = new InMemoryVendorCacheRepository();
    userRepo = new InMemoryUserRepository();
    categoryRepo = new InMemoryCategoryRepository();
    mockAgent = createMockAgent();
    _mockEmailProvider = createMockEmailProvider();

    service = new WebhookService(
      transactionRepo,
      vendorCacheRepo,
      userRepo,
      mockAgent,
    );

    // Seed fixture data via shared helpers
    seedUsers(userRepo);
    seedCategories(categoryRepo);
    seedTransactions(transactionRepo);
    seedVendorCache(vendorCacheRepo);
  });

  describe('processInboundEmail', () => {
    it('should return duplicate status when resend_email_id already exists', async () => {
      // tx-001 in fixtures has resend_email_id: "resend-001"
      const result = await service.processInboundEmail({
        emailHtml: '<p>test</p>',
        emailText: 'test',
        emailSubject: 'UOB Transaction Alert',
        emailDate: '2026-02-08T01:31:11.894719+00:00',
        resendEmailId: 'resend-001',
        userId: USER_ID,
      });

      expect(result).toEqual({ status: 'duplicate' });
      // Agent should NOT be called
      expect(mockAgent.processEmail).not.toHaveBeenCalled();
    });

    it('should fast-path via vendor cache for known vendors', async () => {
      // DIGITALOCEAN.COM is in vendor cache with cat-bills
      const result = await service.processInboundEmail({
        emailHtml: webhookPayloads.resend_full_email_uob.html,
        emailText: webhookPayloads.resend_full_email_uob.text,
        emailSubject: 'UOB Transaction Alert',
        emailDate: '2026-02-08T01:31:11.894719+00:00',
        resendEmailId: 'new-unique-email-id',
        userId: USER_ID,
      });

      // Should create transaction and return cached status
      expect(result.status).toBe('cached');
      expect(result).toHaveProperty('transactionId');

      // Verify transaction was created with vendor cache category
      const tx = await transactionRepo.findById(result.transactionId!);
      expect(tx).not.toBeNull();
      expect(tx!.categoryId).toBe('cat-bills'); // DIGITALOCEAN.COM → cat-bills
      expect(tx!.vendor).toBe('DIGITALOCEAN.COM');
      expect(tx!.amount).toBe(16.23);
      expect(tx!.confidence).toBe(Confidence.HIGH);
      expect(tx!.source).toBe(TransactionSource.EMAIL);
      expect(tx!.resendEmailId).toBe('new-unique-email-id');

      // Vendor cache hit count should be incremented
      const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'DIGITALOCEAN.COM');
      expect(cached!.hitCount).toBe(13); // was 12, now 13

      // Agent should NOT be called
      expect(mockAgent.processEmail).not.toHaveBeenCalled();
    });

    it('should invoke agent for unknown vendors (cache miss)', async () => {
      // DBS email with GRAB *GRABFOOD — wait, that IS in cache
      // Let's use a vendor not in cache
      const result = await service.processInboundEmail({
        emailHtml: '<p>SGD 50.00 at UNKNOWN_STORE on 10 Feb 2026</p>',
        emailText: 'SGD 50.00 at UNKNOWN_STORE on 10 Feb 2026',
        emailSubject: 'DBS Card Transaction',
        emailDate: '2026-02-10T12:00:00.000000+00:00',
        resendEmailId: 'agent-test-email-id',
        userId: USER_ID,
      });

      // Agent should be called
      expect(mockAgent.processEmail).toHaveBeenCalledOnce();
      expect(mockAgent.processEmail).toHaveBeenCalledWith({
        emailHtml: '<p>SGD 50.00 at UNKNOWN_STORE on 10 Feb 2026</p>',
        emailText: 'SGD 50.00 at UNKNOWN_STORE on 10 Feb 2026',
        emailSubject: 'DBS Card Transaction',
        emailDate: '2026-02-10T12:00:00.000000+00:00',
        resendEmailId: 'agent-test-email-id',
        userId: USER_ID,
      });

      expect(result).toHaveProperty('transactionId', 'agent-tx-001');
      expect(result.status).toBe('processed');
    });

    it('should skip non-transaction emails when agent returns no transaction', async () => {
      const agentNoTx = createMockAgent({
        transactionId: null,
        vendor: null,
        amount: null,
        categoryId: null,
        error: null,
      });

      const svc = new WebhookService(
        transactionRepo,
        vendorCacheRepo,
        userRepo,
        agentNoTx,
      );

      // extractRoughVendor returns null for newsletter text → no cache hit → agent invoked
      const result = await svc.processInboundEmail({
        emailHtml: webhookPayloads.resend_full_email_non_transaction.html,
        emailText: webhookPayloads.resend_full_email_non_transaction.text,
        emailSubject: 'Weekly Newsletter',
        emailDate: '2026-02-10T09:00:00.000000+00:00',
        resendEmailId: 'newsletter-email-id',
        userId: USER_ID,
      });

      expect(result).toEqual({ status: 'skipped' });
      expect(agentNoTx.processEmail).toHaveBeenCalledOnce();
    });

    it('should update vendor cache after agent processes new vendor', async () => {
      const agentWithNewVendor = createMockAgent({
        transactionId: 'agent-tx-new',
        vendor: 'SCOOT AIRLINES',
        amount: 1234.56,
        categoryId: 'cat-travel',
        categoryName: 'Travel',
        confidence: Confidence.MEDIUM,
        transactionDate: '2026-02-15',
      });

      const svc = new WebhookService(
        transactionRepo,
        vendorCacheRepo,
        userRepo,
        agentWithNewVendor,
      );

      await svc.processInboundEmail({
        emailHtml: '<p>SGD 1,234.56 at SCOOT AIRLINES on 15 Feb 2026</p>',
        emailText: 'SGD 1,234.56 at SCOOT AIRLINES on 15 Feb 2026',
        emailSubject: 'DBS Card Transaction',
        emailDate: '2026-02-15T00:00:00.000000+00:00',
        resendEmailId: 'scoot-email-id',
        userId: USER_ID,
      });

      // Vendor cache should now have SCOOT AIRLINES
      const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'SCOOT AIRLINES');
      expect(cached).not.toBeNull();
      expect(cached!.categoryId).toBe('cat-travel');
    });

    it('should extract amount and vendor from email text for cached path', async () => {
      // DBS email for GRAB *GRABFOOD — IS in vendor cache as cat-food
      const result = await service.processInboundEmail({
        emailHtml: webhookPayloads.resend_full_email_dbs.html,
        emailText: webhookPayloads.resend_full_email_dbs.text,
        emailSubject: 'DBS Card Transaction',
        emailDate: '2026-02-09T12:00:00.000000+00:00',
        resendEmailId: 'dbs-grab-email-id',
        userId: USER_ID,
      });

      expect(result.status).toBe('cached');
      const tx = await transactionRepo.findById(result.transactionId!);
      expect(tx).not.toBeNull();
      expect(tx!.vendor).toBe('GRAB *GRABFOOD');
      expect(tx!.amount).toBe(25.50);
      expect(tx!.categoryId).toBe('cat-food');
    });
  });
});
