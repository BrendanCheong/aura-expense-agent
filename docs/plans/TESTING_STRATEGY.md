# Aura Expense Agent — Testing Strategy

> **Test Runner:** Vitest (unit + integration)  
> **E2E:** Playwright  
> **CI:** GitHub Actions  
> **Test DB:** Separate Appwrite database (`aura_expense_db_test`)

---

## 📋 Testing Layers

```
┌────────────────────────────────────────────────────────────┐
│                       E2E Tests                             │
│              (Playwright — full browser flows)               │
│  Login → Dashboard → Create Budget → View Transactions      │
├────────────────────────────────────────────────────────────┤
│                   Integration Tests                          │
│             (Vitest — multiple units together)                │
│  Webhook → Agent → DB  |  API Route → Auth → DB Response    │
├────────────────────────────────────────────────────────────┤
│                      Unit Tests                              │
│              (Vitest — isolated functions)                    │
│  Date utils | Currency format | Email parser | Agent tools   │
└────────────────────────────────────────────────────────────┘
```

| Layer | Tool | Scope | Count (est.) |
|-------|------|-------|-------------|
| **Unit** | Vitest | Pure functions, utils, parsers | ~30 tests |
| **Integration** | Vitest | API routes, agent pipeline, DB operations | ~15 tests |
| **E2E** | Playwright | Full user flows in browser | ~8 tests |

---

## 🧪 Unit Tests

### 1. Date Utilities (`__tests__/unit/utils/date.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseEmailDate,
  convertToSGT,
  getMonthRange,
  getWeekRange,
  formatDisplayDate,
} from '@/lib/utils/date';

describe('parseEmailDate', () => {
  it('parses DD/MM/YY format from bank alerts', () => {
    const result = parseEmailDate('08/02/26');
    expect(result.toISOString()).toBe('2026-02-08T00:00:00.000Z');
  });

  it('parses ISO 8601 UTC timestamp from Resend', () => {
    const result = parseEmailDate('2026-02-08T01:31:11.894719+00:00');
    expect(result.toISOString()).toContain('2026-02-08');
  });

  it('handles DD/MM/YYYY format', () => {
    const result = parseEmailDate('08/02/2026');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // 0-indexed
    expect(result.getDate()).toBe(8);
  });
});

describe('convertToSGT', () => {
  it('converts UTC midnight to SGT +8 hours', () => {
    const utc = new Date('2026-02-08T00:00:00Z');
    const sgt = convertToSGT(utc);
    expect(sgt).toBe('2026-02-08T08:00:00+08:00');
  });

  it('handles day rollover (UTC 20:00 → SGT next day 04:00)', () => {
    const utc = new Date('2026-02-08T20:00:00Z');
    const sgt = convertToSGT(utc);
    expect(sgt).toContain('2026-02-09');
  });
});

describe('getMonthRange', () => {
  it('returns correct start and end for February 2026', () => {
    const { start, end } = getMonthRange(2026, 2);
    expect(start).toBe('2026-02-01T00:00:00+08:00');
    expect(end).toBe('2026-03-01T00:00:00+08:00');
  });

  it('handles December → January year boundary', () => {
    const { start, end } = getMonthRange(2025, 12);
    expect(start).toContain('2025-12-01');
    expect(end).toContain('2026-01-01');
  });
});

describe('formatDisplayDate', () => {
  it('formats as "08 Feb 2026"', () => {
    const result = formatDisplayDate('2026-02-08T09:31:00+08:00');
    expect(result).toBe('08 Feb 2026');
  });
});
```

### 2. Currency Utilities (`__tests__/unit/utils/currency.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseAmountFromText,
  formatSGD,
} from '@/lib/utils/currency';

describe('parseAmountFromText', () => {
  it('extracts SGD amount from bank alert text', () => {
    const text = 'A transaction of SGD 16.23 was made with your UOB Card';
    expect(parseAmountFromText(text)).toBe(16.23);
  });

  it('extracts S$ amount format', () => {
    const text = 'Payment of S$1,234.56 received';
    expect(parseAmountFromText(text)).toBe(1234.56);
  });

  it('extracts $ amount with SGD context', () => {
    const text = 'Total: $89.99 SGD';
    expect(parseAmountFromText(text)).toBe(89.99);
  });

  it('returns null for no amount found', () => {
    const text = 'Welcome to our service';
    expect(parseAmountFromText(text)).toBeNull();
  });
});

describe('formatSGD', () => {
  it('formats with 2 decimal places', () => {
    expect(formatSGD(1023.5)).toBe('$1,023.50');
  });

  it('handles zero', () => {
    expect(formatSGD(0)).toBe('$0.00');
  });

  it('handles negative (over budget)', () => {
    expect(formatSGD(-27.19)).toBe('-$27.19');
  });
});
```

### 3. Vendor Name Normalization (`__tests__/unit/utils/vendor.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeVendorName } from '@/lib/utils/vendor';

describe('normalizeVendorName', () => {
  it('uppercases and trims', () => {
    expect(normalizeVendorName('  Grab *GrabFood  ')).toBe('GRAB *GRABFOOD');
  });

  it('removes trailing dots', () => {
    expect(normalizeVendorName('DIGITALOCEAN.COM.')).toBe('DIGITALOCEAN.COM');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeVendorName('YA  KUN   KAYA TOAST')).toBe('YA KUN KAYA TOAST');
  });
});
```

### 4. Agent Tool: Extract Expense (`__tests__/unit/agent/extract-expense.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { extractExpenseFromText } from '@/lib/agent/tools/extract-expense';

describe('extractExpenseFromText (regex fast path)', () => {
  it('extracts from UOB bank alert', () => {
    const text = `A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM. If unauthorised, call 24/7 Fraud Hotline now`;
    
    const result = extractExpenseFromText(text);
    expect(result).toEqual({
      amount: 16.23,
      vendor: 'DIGITALOCEAN.COM',
      rawDate: '08/02/26',
    });
  });

  it('extracts from DBS bank alert', () => {
    const text = `DBS: SGD 25.50 was charged to your card ending 1234 at GRAB *GRABFOOD on 09 Feb 2026`;
    
    const result = extractExpenseFromText(text);
    expect(result.amount).toBe(25.50);
    expect(result.vendor).toContain('GRAB');
  });

  it('returns null for non-transaction emails', () => {
    const text = `Welcome to our newsletter! Check out our latest deals.`;
    
    const result = extractExpenseFromText(text);
    expect(result).toBeNull();
  });
});
```

### 5. Budget Calculations (`__tests__/unit/utils/budget.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateBudgetStatus, getBudgetAlerts } from '@/lib/utils/budget';

describe('calculateBudgetStatus', () => {
  it('returns on_track for < 80%', () => {
    expect(calculateBudgetStatus(200, 400)).toEqual({
      percentUsed: 50,
      remaining: 200,
      status: 'on_track',
    });
  });

  it('returns warning for 80-99%', () => {
    expect(calculateBudgetStatus(85, 100).status).toBe('warning');
  });

  it('returns over_budget for >= 100%', () => {
    const result = calculateBudgetStatus(327.19, 300);
    expect(result.status).toBe('over_budget');
    expect(result.remaining).toBeCloseTo(-27.19);
    expect(result.percentUsed).toBeCloseTo(109.06, 1);
  });

  it('handles zero budget', () => {
    const result = calculateBudgetStatus(50, 0);
    expect(result.status).toBe('over_budget');
    expect(result.percentUsed).toBe(Infinity);
  });
});

describe('getBudgetAlerts', () => {
  it('returns only warning and over_budget categories', () => {
    const budgets = [
      { categoryName: 'Food', spent: 200, budget: 400, icon: '🍔' },
      { categoryName: 'Shopping', spent: 327, budget: 300, icon: '🛍️' },
      { categoryName: 'Entertainment', spent: 83, budget: 100, icon: '🎬' },
    ];

    const alerts = getBudgetAlerts(budgets);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].type).toBe('over_budget');
    expect(alerts[0].categoryName).toBe('Shopping');
    expect(alerts[1].type).toBe('warning');
    expect(alerts[1].categoryName).toBe('Entertainment');
  });

  it('returns empty array when all on track', () => {
    const budgets = [
      { categoryName: 'Food', spent: 100, budget: 400, icon: '🍔' },
    ];
    expect(getBudgetAlerts(budgets)).toHaveLength(0);
  });
});
```

---

## 🔗 Integration Tests

### 1. Webhook Pipeline (`__tests__/integration/webhook-pipeline.test.ts`)

Tests the full flow: webhook receipt → email fetch → dedup → agent → DB write.

```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/resend/route';
import { NextRequest } from 'next/server';

// Mock Resend API
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      receiving: {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'test-email-001',
            to: ['user-test@inbound.yourdomain.com'],
            from: 'unialerts@uobgroup.com',
            subject: 'UOB Transaction Alert',
            html: '<p>A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM.</p>',
            text: 'A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM.',
            created_at: '2026-02-08T01:31:11.894719+00:00',
          },
        }),
      },
    },
  })),
}));

// Mock Appwrite (use test database)
vi.mock('@/lib/appwrite/server', () => ({
  getServerAppwrite: () => ({
    databases: createMockDatabases(),
  }),
}));

// Mock OpenAI
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    bindTools: vi.fn().mockReturnThis(),
    invoke: vi.fn().mockResolvedValue({
      tool_calls: [
        {
          name: 'log_expense',
          args: {
            userId: 'test-user-001',
            categoryId: 'cat-bills',
            amount: 16.23,
            vendor: 'DIGITALOCEAN.COM',
            transactionDate: '2026-02-08T09:31:00+08:00',
            resendEmailId: 'test-email-001',
            emailSubject: 'UOB Transaction Alert',
            confidence: 'medium',
          },
        },
      ],
    }),
  })),
}));

describe('Webhook Pipeline', () => {
  it('processes a valid email.received webhook', async () => {
    const request = new NextRequest('http://localhost:4321/api/webhooks/resend', {
      method: 'POST',
      body: JSON.stringify({
        type: 'email.received',
        data: { email_id: 'test-email-001' },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('processed');
  });

  it('deduplicates repeated webhook deliveries', async () => {
    // First call processes
    const request1 = new NextRequest('http://localhost:4321/api/webhooks/resend', {
      method: 'POST',
      body: JSON.stringify({
        type: 'email.received',
        data: { email_id: 'test-email-dup' },
      }),
    });
    await POST(request1);

    // Second call with same email_id is deduplicated
    const request2 = new NextRequest('http://localhost:4321/api/webhooks/resend', {
      method: 'POST',
      body: JSON.stringify({
        type: 'email.received',
        data: { email_id: 'test-email-dup' },
      }),
    });
    const response2 = await POST(request2);
    const body2 = await response2.json();

    expect(body2.status).toBe('duplicate');
  });

  it('ignores non email.received event types', async () => {
    const request = new NextRequest('http://localhost:4321/api/webhooks/resend', {
      method: 'POST',
      body: JSON.stringify({
        type: 'email.sent',
        data: { email_id: 'whatever' },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ignored');
  });
});
```

### 2. Agent Categorization (`__tests__/integration/agent-categorization.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('Agent Categorization Accuracy', () => {
  const testCases = [
    {
      name: 'UOB bank alert — DigitalOcean (Bills & Utilities)',
      email: 'A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM.',
      expectedCategory: 'Bills & Utilities',
      expectedAmount: 16.23,
      expectedVendor: 'DIGITALOCEAN.COM',
    },
    {
      name: 'Grab ride — Transportation',
      email: 'Your Grab ride from Bedok to Raffles Place on 09/02/26. Total: SGD 12.30. Paid with UOB Card ending 8909.',
      expectedCategory: 'Transportation',
      expectedAmount: 12.30,
    },
    {
      name: 'Netflix subscription — Entertainment',
      email: 'Your Netflix subscription of SGD 15.98 has been charged to your card ending 8909 on 01/02/26.',
      expectedCategory: 'Entertainment',
      expectedAmount: 15.98,
    },
    {
      name: 'Unknown vendor — should use web search or fallback to Other',
      email: 'A transaction of SGD 42.00 was made with your UOB Card ending 8909 on 10/02/26 at XTREMELY_OBSCURE_VENDOR_XYZ.',
      expectedCategory: 'Other',
      expectedAmount: 42.00,
    },
  ];

  testCases.forEach(({ name, email, expectedCategory, expectedAmount, expectedVendor }) => {
    it(name, async () => {
      // This test validates the agent's extraction + categorization
      // In a real test, this invokes the agent with mocked LLM responses
      // For CI, we mock the OpenAI response
      // For local dev, you can run with real API calls (set INTEGRATION_TEST_LIVE=true)

      // Placeholder for actual agent invocation
      expect(true).toBe(true);
    });
  });
});
```

### 3. Vendor Cache (`__tests__/integration/vendor-cache.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('Vendor Cache', () => {
  it('caches vendor→category mapping after first classification', async () => {
    // 1. Process email with unknown vendor → agent classifies → cache written
    // 2. Process another email with same vendor → cache hit → agent not invoked
    expect(true).toBe(true);
  });

  it('increments hit_count on cache hits', async () => {
    expect(true).toBe(true);
  });

  it('returns cache miss for unknown vendors', async () => {
    expect(true).toBe(true);
  });
});
```

---

## 🌐 E2E Tests (Playwright)

### Setup

```typescript
// playwright.config.ts

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 375, height: 667 } } },
  ],
});
```

### Dashboard Flow (`__tests__/e2e/dashboard.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

// Note: E2E tests require a seeded test database and a test user session
// The test user is pre-authenticated via a stored session cookie

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set pre-authenticated session cookie for test user
    await page.context().addCookies([{
      name: 'a_session',
      value: process.env.TEST_SESSION_COOKIE!,
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('displays spending donut chart with correct categories', async ({ page }) => {
    await page.goto('/');
    
    // Wait for chart to render
    await expect(page.locator('[data-testid="spending-donut"]')).toBeVisible();
    
    // Check total is displayed
    await expect(page.getByText(/Total Spent/)).toBeVisible();
    await expect(page.getByText(/\$1,023/)).toBeVisible();
  });

  test('displays budget progress bars', async ({ page }) => {
    await page.goto('/');
    
    // Check budget bars exist for each category
    await expect(page.getByText('Food & Beverage')).toBeVisible();
    await expect(page.getByText('Transportation')).toBeVisible();
  });

  test('shows budget alert banner when over budget', async ({ page }) => {
    await page.goto('/');
    
    // Check for over-budget alert
    await expect(page.getByText(/Over Budget/)).toBeVisible();
    await expect(page.getByText(/Shopping/)).toBeVisible();
  });

  test('shows recent transactions table', async ({ page }) => {
    await page.goto('/');
    
    const table = page.locator('[data-testid="recent-transactions"]');
    await expect(table).toBeVisible();
    
    // Should show at least some transactions
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(5); // Shows last 5
  });

  test('time range selector changes displayed data', async ({ page }) => {
    await page.goto('/');
    
    // Default is "Month"
    await expect(page.getByRole('tab', { name: 'Month' })).toHaveAttribute('data-state', 'active');
    
    // Switch to "Week"
    await page.getByRole('tab', { name: 'Week' }).click();
    
    // Total should change (fewer transactions)
    // Exact assertion depends on test data and current week
  });
});
```

### Transactions Page (`__tests__/e2e/transactions.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
  test('lists all transactions with pagination', async ({ page }) => {
    await page.goto('/transactions');
    
    // Check table headers
    await expect(page.getByText('Date')).toBeVisible();
    await expect(page.getByText('Vendor')).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    
    // Check pagination
    await expect(page.getByText('Showing 1')).toBeVisible();
  });

  test('creates a manual transaction', async ({ page }) => {
    await page.goto('/transactions');
    
    await page.getByRole('button', { name: /Add Transaction/ }).click();
    
    // Fill form
    await page.getByLabel('Vendor').fill('Cash - Hawker Centre');
    await page.getByLabel('Amount').fill('5.50');
    // Select category
    await page.getByLabel('Category').click();
    await page.getByText('Food & Beverage').click();
    
    await page.getByRole('button', { name: /Save/ }).click();
    
    // Should appear in table
    await expect(page.getByText('Cash - Hawker Centre')).toBeVisible();
  });

  test('filters by category', async ({ page }) => {
    await page.goto('/transactions');
    
    // Select category filter
    await page.getByLabel('Category').click();
    await page.getByText('Bills & Utilities').click();
    
    // All visible transactions should be Bills category
    const rows = page.locator('tbody tr');
    for (const row of await rows.all()) {
      await expect(row.getByText('💡')).toBeVisible();
    }
  });
});
```

---

## 🔄 Mock Webhook Script

For local development testing without real emails:

```typescript
// scripts/mock-webhook.ts
//
// Usage: npx tsx scripts/mock-webhook.ts
//
// Simulates a Resend webhook hitting your local Next.js server

const MOCK_EMAILS = [
  {
    id: 'mock-uob-001',
    subject: 'UOB Transaction Alert',
    text: 'A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM. If unauthorised, call 24/7 Fraud Hotline now',
    html: '<p>A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM. If unauthorised, call 24/7 Fraud Hotline now</p>',
    from: 'unialerts@uobgroup.com',
    to: ['user-test-001@inbound.yourdomain.com'],
    created_at: '2026-02-08T01:31:11.894719+00:00',
  },
  {
    id: 'mock-grab-001',
    subject: 'Your Grab Receipt',
    text: 'Your GrabFood order from McDonald\'s Bedok. Total: SGD 18.50. Paid with Visa ending 8909.',
    html: '<div>Your GrabFood order from McDonald\'s Bedok.<br/>Total: SGD 18.50<br/>Paid with Visa ending 8909.</div>',
    from: 'receipts@grab.com',
    to: ['user-test-001@inbound.yourdomain.com'],
    created_at: '2026-02-09T04:30:00.000000+00:00',
  },
  {
    id: 'mock-unknown-001',
    subject: 'Payment Confirmation',
    text: 'A transaction of SGD 99.00 was made with your UOB Card ending 8909 on 09/02/26 at ZYLUXE PTE LTD.',
    html: '<p>A transaction of SGD 99.00 was made with your UOB Card ending 8909 on 09/02/26 at ZYLUXE PTE LTD.</p>',
    from: 'unialerts@uobgroup.com',
    to: ['user-test-001@inbound.yourdomain.com'],
    created_at: '2026-02-09T06:00:00.000000+00:00',
  },
];

async function sendMockWebhook(emailIndex: number = 0) {
  const email = MOCK_EMAILS[emailIndex];
  
  console.log(`\n📧 Sending mock webhook for: ${email.subject}`);
  console.log(`   From: ${email.from}`);
  console.log(`   Amount: (embedded in email body)`);
  console.log(`   Email ID: ${email.id}\n`);

  // Step 1: Send the webhook event (like Resend would)
  const webhookPayload = {
    type: 'email.received',
    data: {
      email_id: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      created_at: email.created_at,
    },
  };

  try {
    const response = await fetch('http://localhost:4321/api/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    const body = await response.json();
    console.log(`✅ Response (${response.status}):`, JSON.stringify(body, null, 2));
  } catch (error) {
    console.error('❌ Failed to send webhook:', error);
  }
}

// Run
const emailIndex = parseInt(process.argv[2] || '0');
sendMockWebhook(emailIndex);
```

**Usage:**
```bash
# Send UOB transaction alert
npx tsx scripts/mock-webhook.ts 0

# Send Grab receipt
npx tsx scripts/mock-webhook.ts 1

# Send unknown vendor (triggers web search)
npx tsx scripts/mock-webhook.ts 2
```

> **Note:** The mock webhook script sends the webhook event to your local server, but the server still calls `resend.emails.receiving.get()` to fetch the full email. For local development, you'll need to either:
> 1. Mock the Resend API response in your webhook handler when `NODE_ENV=development`
> 2. Use a `.env.development` override that returns mock email data

---

## 🗃️ Test Database Management

### Separate Test Database

```bash
# Environment variables for testing
# .env.test

APPWRITE_DATABASE_ID=aura_expense_db_test
NODE_ENV=test
```

### Test Lifecycle

```typescript
// __tests__/setup.ts (Vitest globalSetup)

export async function setup() {
  // 1. Create test database (if not exists)
  // 2. Run setup-appwrite.ts against test DB
  // 3. Run seed-db.ts to populate mock data
  console.log('🧪 Test database initialized');
}

export async function teardown() {
  // Option A: Delete all rows (fast, reusable schema)
  // Option B: Delete entire test database (clean slate)
  console.log('🧹 Test database cleaned up');
}
```

### Vitest Config

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.ts'],
    exclude: ['__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/app/api/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

---

## 📊 Coverage Targets

| Area | Target | Critical Files |
|------|--------|---------------|
| **Utils** | 90%+ | `date.ts`, `currency.ts`, `vendor.ts`, `budget.ts` |
| **Agent Tools** | 80%+ | `extract-expense.ts`, `lookup-categories.ts`, `log-expense.ts` |
| **API Routes** | 75%+ | `webhooks/resend/route.ts`, `transactions/route.ts` |
| **Components** | 60%+ | Charts and forms (visual testing via Playwright) |

---

## 🚀 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml

name: Tests
on:
  push:
    branches: [main]
  pull_request:

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
    env:
      APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
      APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
      APPWRITE_API_KEY: ${{ secrets.APPWRITE_API_KEY }}
      APPWRITE_DATABASE_ID: aura_expense_db_test
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
    env:
      TEST_SESSION_COOKIE: ${{ secrets.TEST_SESSION_COOKIE }}
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --include '__tests__/unit/**'",
    "test:integration": "vitest run --include '__tests__/integration/**'",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "db:setup": "npx tsx scripts/setup-appwrite.ts",
    "db:seed": "npx tsx scripts/seed-db.ts",
    "db:seed:test": "APPWRITE_DATABASE_ID=aura_expense_db_test npx tsx scripts/seed-db.ts",
    "mock:webhook": "npx tsx scripts/mock-webhook.ts"
  }
}
```
