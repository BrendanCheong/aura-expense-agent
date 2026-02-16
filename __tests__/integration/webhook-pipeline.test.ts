/**
 * Integration tests — Webhook Inbound Email Pipeline.
 *
 * Tests the full POST /api/webhooks/resend handler end-to-end
 * through the service layer
 *
 * Pattern: Prepare → Act → Assert
 *
 * Dev mode (PROJECT_ENV=dev) bypasses Svix signature verification.
 *
 */

import { NextRequest } from 'next/server';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import categoriesFixture from '../fixtures/categories.json';
import transactionsFixture from '../fixtures/transactions.json';
import usersFixture from '../fixtures/users.json';
import vendorCacheFixture from '../fixtures/vendor-cache.json';
import webhookPayloads from '../fixtures/webhook-payloads.json';

import type { AgentResult, IExpenseAgent } from '@/lib/agent/interfaces';
import type { IEmailProvider, ReceivedEmail } from '@/lib/resend/interfaces';
import type { Transaction } from '@/types/transaction';

import { Confidence, TransactionSource, type OAuthProvider, type BudgetMode } from '@/lib/enums';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryTransactionRepository } from '@/lib/repositories/in-memory/transaction.repository';
import { InMemoryUserRepository } from '@/lib/repositories/in-memory/user.repository';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
// eslint-disable-next-line import/order -- POST must be imported after vi.mock
import { WebhookService } from '@/lib/services/webhook.service';

const _containerRef: {
  webhookService: WebhookService | null;
  emailProvider: IEmailProvider | null;
} = { webhookService: null, emailProvider: null };

vi.mock('@/lib/container/container', () => ({
  createContainer: vi.fn(() => Promise.resolve(_containerRef)),
}));

// Import route handler AFTER vi.mock (which is hoisted above all imports)
// eslint-disable-next-line import/order
import { POST } from '@/app/api/webhooks/resend/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = 'test-user-001';
const WEBHOOK_URL = 'http://localhost:4321/api/webhooks/resend';

function createWebhookRequest(payload: unknown): NextRequest {
  return new NextRequest(WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
}

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

function buildEmailMap(): Record<string, ReceivedEmail> {
  const sources = [
    webhookPayloads.resend_full_email_uob,
    webhookPayloads.resend_full_email_dbs,
    webhookPayloads.resend_full_email_ocbc,
    webhookPayloads.resend_full_email_non_transaction,
  ];

  const map: Record<string, ReceivedEmail> = {};
  for (const src of sources) {
    map[src.id] = {
      id: src.id,
      to: src.to,
      from: src.from,
      subject: src.subject,
      html: src.html,
      text: src.text,
      createdAt: src.created_at,
    };
  }
  return map;
}

function createMockEmailProvider(
  extraEmails?: Record<string, ReceivedEmail>,
): IEmailProvider {
  const allEmails = { ...buildEmailMap(), ...extraEmails };
  return {
    getReceivedEmail: vi.fn().mockImplementation(
      (id: string) => Promise.resolve(allEmails[id] ?? null),
    ),
  };
}

// ---------------------------------------------------------------------------
// Seed helpers (snake_case fixtures -> camelCase domain objects)
// ---------------------------------------------------------------------------

function seedUser(userRepo: InMemoryUserRepository): void {
  const u = usersFixture.test_user;
  userRepo.seed({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatar_url,
    inboundEmail: u.inbound_email,
    oauthProvider: u.oauth_provider as OAuthProvider,
    monthlySalary: u.monthly_salary,
    budgetMode: u.budget_mode as BudgetMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

function seedCategories(categoryRepo: InMemoryCategoryRepository): void {
  for (const cat of categoriesFixture) {
    categoryRepo.seed({
      id: cat.id,
      userId: cat.user_id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.is_default,
      sortOrder: cat.sort_order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

function seedTransactions(transactionRepo: InMemoryTransactionRepository): void {
  for (const tx of transactionsFixture) {
    transactionRepo.seed({
      id: tx.id,
      userId: tx.user_id,
      categoryId: tx.category_id,
      amount: tx.amount,
      vendor: tx.vendor,
      description: tx.description,
      transactionDate: tx.transaction_date,
      resendEmailId: tx.resend_email_id,
      rawEmailSubject: tx.raw_email_subject,
      confidence: tx.confidence as Transaction['confidence'],
      source: tx.source as Transaction['source'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

function seedVendorCache(vendorCacheRepo: InMemoryVendorCacheRepository): void {
  for (const vc of vendorCacheFixture) {
    vendorCacheRepo.seed({
      id: vc.id,
      userId: vc.user_id,
      vendorName: vc.vendor_name,
      categoryId: vc.category_id,
      hitCount: vc.hit_count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Integration: Webhook Pipeline (POST /api/webhooks/resend)', () => {
  let transactionRepo: InMemoryTransactionRepository;
  let vendorCacheRepo: InMemoryVendorCacheRepository;
  let userRepo: InMemoryUserRepository;
  let categoryRepo: InMemoryCategoryRepository;
  let mockAgent: IExpenseAgent;
  let mockEmailProvider: IEmailProvider;

  beforeAll(() => {
    process.env.PROJECT_ENV = 'dev';
  });

  beforeEach(() => {
    transactionRepo = new InMemoryTransactionRepository();
    vendorCacheRepo = new InMemoryVendorCacheRepository();
    userRepo = new InMemoryUserRepository();
    categoryRepo = new InMemoryCategoryRepository();

    mockAgent = createMockAgent();
    mockEmailProvider = createMockEmailProvider();

    const webhookService = new WebhookService(
      transactionRepo,
      vendorCacheRepo,
      userRepo,
      mockAgent,
    );

    seedUser(userRepo);
    seedCategories(categoryRepo);
    seedTransactions(transactionRepo);
    seedVendorCache(vendorCacheRepo);

    _containerRef.webhookService = webhookService;
    _containerRef.emailProvider = mockEmailProvider;
  });

  // =========================================================================
  // Test #1: Vendor cache fast path (known vendor)
  // =========================================================================
  it('should fast-path via vendor cache for known vendor (UOB -> DIGITALOCEAN.COM)', async () => {
    // ---- Prepare ----
    const payload = webhookPayloads.resend_email_received;

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('cached');
    expect(body.transactionId).toBeDefined();

    const tx = await transactionRepo.findById(body.transactionId);
    expect(tx).not.toBeNull();
    expect(tx!.categoryId).toBe('cat-bills');
    expect(tx!.vendor).toBe('DIGITALOCEAN.COM');
    expect(tx!.amount).toBe(16.23);
    expect(tx!.confidence).toBe(Confidence.HIGH);
    expect(tx!.source).toBe(TransactionSource.EMAIL);
    expect(tx!.resendEmailId).toBe(payload.data.email_id);

    const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'DIGITALOCEAN.COM');
    expect(cached!.hitCount).toBe(13);

    expect(mockAgent.processEmail).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Test #2: Agent required (cache miss)
  // =========================================================================
  it('should invoke agent for unknown vendor (cache miss)', async () => {
    // ---- Prepare ----
    const unknownEmailId = 'unknown-vendor-email-001';
    _containerRef.emailProvider = createMockEmailProvider({
      [unknownEmailId]: {
        id: unknownEmailId,
        to: ['user-test-user-001@inbound.yourdomain.com'],
        from: 'alerts@bank.com',
        subject: 'Card Transaction',
        html: '<p>SGD 99.00 at BRAND_NEW_STORE on 12 Feb 2026</p>',
        text: 'SGD 99.00 at BRAND_NEW_STORE on 12 Feb 2026',
        createdAt: '2026-02-12T10:00:00.000000+00:00',
      },
    });

    const payload = {
      type: 'email.received',
      data: {
        email_id: unknownEmailId,
        from: 'alerts@bank.com',
        to: ['user-test-user-001@inbound.yourdomain.com'],
        subject: 'Card Transaction',
        created_at: '2026-02-12T10:00:00.000000+00:00',
      },
    };

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('processed');
    expect(body.transactionId).toBe('agent-tx-001');

    expect(mockAgent.processEmail).toHaveBeenCalledOnce();

    const cached = await vendorCacheRepo.findByUserAndVendor(USER_ID, 'NEW VENDOR');
    expect(cached).not.toBeNull();
    expect(cached!.categoryId).toBe('cat-other');
  });

  // =========================================================================
  // Test #3: Duplicate email (idempotency)
  // =========================================================================
  it('should return duplicate status for already-processed email', async () => {
    // ---- Prepare ----
    _containerRef.emailProvider = createMockEmailProvider({
      'resend-001': {
        id: 'resend-001',
        to: ['user-test-user-001@inbound.yourdomain.com'],
        from: 'unialerts@uobgroup.com',
        subject: 'UOB Transaction Alert (duplicate)',
        html: '<p>SGD 10.00 at SOME VENDOR</p>',
        text: 'SGD 10.00 at SOME VENDOR',
        createdAt: '2026-02-01T12:30:00.000000+00:00',
      },
    });

    const payload = webhookPayloads.resend_duplicate_email;

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('duplicate');
    expect(body.transactionId).toBeUndefined();
    expect(mockAgent.processEmail).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Test #4: Non-transaction email (newsletter -> skipped)
  // =========================================================================
  it('should skip non-transaction emails when agent finds no expense', async () => {
    // ---- Prepare ----
    const agentNoTx = createMockAgent({
      transactionId: null,
      vendor: null,
      amount: null,
      categoryId: null,
      error: null,
    });

    _containerRef.webhookService = new WebhookService(
      transactionRepo,
      vendorCacheRepo,
      userRepo,
      agentNoTx,
    );

    const newsletterEmailId = webhookPayloads.resend_full_email_non_transaction.id;
    const payload = {
      type: 'email.received',
      data: {
        email_id: newsletterEmailId,
        from: 'newsletter@company.com',
        to: ['user-test-user-001@inbound.yourdomain.com'],
        subject: 'Weekly Newsletter',
        created_at: '2026-02-10T09:00:00.000000+00:00',
      },
    };

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('skipped');
    expect(agentNoTx.processEmail).toHaveBeenCalledOnce();
  });

  // =========================================================================
  // Test #5: Unknown recipient
  // =========================================================================
  it('should return 200 with error for unknown recipient', async () => {
    // ---- Prepare ----
    const unknownEmailId = 'unknown-recipient-email-001';
    _containerRef.emailProvider = createMockEmailProvider({
      [unknownEmailId]: {
        id: unknownEmailId,
        to: ['nobody@inbound.yourdomain.com'],
        from: 'alerts@bank.com',
        subject: 'Transaction Alert',
        html: '<p>SGD 10.00 at VENDOR</p>',
        text: 'SGD 10.00 at VENDOR',
        createdAt: '2026-02-12T10:00:00.000000+00:00',
      },
    });

    const payload = {
      type: 'email.received',
      data: {
        email_id: unknownEmailId,
        from: 'alerts@bank.com',
        to: ['nobody@inbound.yourdomain.com'],
        subject: 'Transaction Alert',
        created_at: '2026-02-12T10:00:00.000000+00:00',
      },
    };

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.error).toBe('Unknown recipient');
    expect(mockAgent.processEmail).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Test #6: Non email.received event type
  // =========================================================================
  it('should ignore non email.received events', async () => {
    // ---- Prepare ----
    const payload = {
      type: 'email.sent',
      data: {
        email_id: 'sent-email-001',
        from: 'us@example.com',
        to: ['recipient@example.com'],
        subject: 'Outgoing email',
        created_at: '2026-02-12T10:00:00.000000+00:00',
      },
    };

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ignored');
    expect(mockAgent.processEmail).not.toHaveBeenCalled();
    expect(mockEmailProvider.getReceivedEmail).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Test #7: Invalid signature (non-dev mode)
  // =========================================================================
  it('should return 400 for invalid signature when not in dev mode', async () => {
    // ---- Prepare ----
    const originalEnv = process.env.PROJECT_ENV;
    process.env.PROJECT_ENV = 'prod';
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

    const payload = {
      type: 'email.received',
      data: {
        email_id: 'some-email-id',
        from: 'alerts@bank.com',
        to: ['user-test-user-001@inbound.yourdomain.com'],
        subject: 'Alert',
        created_at: '2026-02-12T10:00:00.000000+00:00',
      },
    };

    const request = new NextRequest(WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'invalid',
        'svix-timestamp': 'invalid',
        'svix-signature': 'invalid',
      },
    });

    // ---- Act ----
    const response = await POST(request);

    // ---- Assert ----
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid webhook signature');

    process.env.PROJECT_ENV = originalEnv;
  });

  // =========================================================================
  // Test #8: Idempotency (process + duplicate)
  // =========================================================================
  it('should process first email and return duplicate for second identical email', async () => {
    // ---- Prepare ----
    const payload = webhookPayloads.resend_email_received;

    // ---- Act ----
    const response1 = await POST(createWebhookRequest(payload));
    const body1 = await response1.json();

    const response2 = await POST(createWebhookRequest(payload));
    const body2 = await response2.json();

    // ---- Assert ----
    expect(response1.status).toBe(200);
    expect(body1.status).toBe('cached');
    expect(body1.transactionId).toBeDefined();

    expect(response2.status).toBe(200);
    expect(body2.status).toBe('duplicate');
    expect(body2.transactionId).toBeUndefined();
  });

  // =========================================================================
  // Test #9: DBS GRAB *GRABFOOD via vendor cache
  // =========================================================================
  it('should process DBS GRAB *GRABFOOD email via vendor cache (cat-food)', async () => {
    // ---- Prepare ----
    const dbsEmailId = webhookPayloads.resend_full_email_dbs.id;
    const payload = {
      type: 'email.received',
      data: {
        email_id: dbsEmailId,
        from: 'alerts@dbs.com.sg',
        to: ['user-test-user-001@inbound.yourdomain.com'],
        subject: 'DBS Card Transaction',
        created_at: '2026-02-09T12:00:00.000000+00:00',
      },
    };

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('cached');
    expect(body.transactionId).toBeDefined();

    const tx = await transactionRepo.findById(body.transactionId);
    expect(tx).not.toBeNull();
    expect(tx!.vendor).toBe('GRAB *GRABFOOD');
    expect(tx!.amount).toBe(25.50);
    expect(tx!.categoryId).toBe('cat-food');
    expect(tx!.source).toBe(TransactionSource.EMAIL);
  });

  // =========================================================================
  // Test #10: Email not found from Resend
  // =========================================================================
  it('should return 200 with error when Resend email not found', async () => {
    // ---- Prepare ----
    const payload = {
      type: 'email.received',
      data: {
        email_id: 'nonexistent-email-id',
        from: 'alerts@bank.com',
        to: ['user-test-user-001@inbound.yourdomain.com'],
        subject: 'Alert',
        created_at: '2026-02-12T10:00:00.000000+00:00',
      },
    };

    // ---- Act ----
    const response = await POST(createWebhookRequest(payload));

    // ---- Assert ----
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.error).toBe('Email not found');
    expect(mockAgent.processEmail).not.toHaveBeenCalled();
  });
});
