# Aura Expense Agent — API Specification

> **Framework:** Next.js 19 (App Router)  
> **Auth:** Appwrite OAuth2 (Google + GitHub)  
> **Base Path:** All routes under `/api/`

> **Validation:** API request/query/params schemas are scaffolded under `src/lib/validation/` and should be applied at every route boundary via `safeParse` before calling services.

---

## 📋 Route Overview

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/webhooks/resend` | Webhook Secret | Resend inbound email webhook handler |
| GET | `/api/transactions` | ✅ | List transactions (paginated, filterable) |
| POST | `/api/transactions` | ✅ | Create manual transaction |
| PATCH | `/api/transactions/[id]` | ✅ | Update transaction (re-categorize, edit) |
| DELETE | `/api/transactions/[id]` | ✅ | Delete transaction |
| GET | `/api/categories` | ✅ | List user's categories |
| POST | `/api/categories` | ✅ | Create new category |
| PATCH | `/api/categories/[id]` | ✅ | Update category |
| DELETE | `/api/categories/[id]` | ✅ | Delete category |
| GET | `/api/budgets` | ✅ | List budgets for a given month/year |
| POST | `/api/budgets` | ✅ | Create/update budget for a category |
| DELETE | `/api/budgets/[id]` | ✅ | Delete budget |
| GET | `/api/dashboard/summary` | ✅ | Aggregated spending data for charts |
| GET | `/api/dashboard/alerts` | ✅ | Budget alert status (approaching/over) |
| GET | `/api/user/profile` | ✅ | Get current user profile + inbound email |\n| PATCH | `/api/user/profile` | ✅ | Update user profile (monthly_salary, budget_mode) |\n| POST | `/api/feedback` | ✅ | Process AI feedback on a transaction |\n| POST | `/api/feedback/approve` | ✅ | Approve AI feedback proposal (updates tx + cache + Mem0) |

---

## 1. Webhook Handler

### `POST /api/webhooks/resend`

The most critical route. Receives Resend's `email.received` webhook, fetches the full email, and invokes the AI agent pipeline.

**Authentication:** Resend webhook signature verification (not user auth).

**Verification requirements:**
- Read raw request body with `await request.text()` before parsing JSON
- Verify with `svix` using `svix-id`, `svix-timestamp`, and `svix-signature`
- Use `process.env.RESEND_WEBHOOK_SECRET`

```typescript
// src/app/api/webhooks/resend/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { Resend } from 'resend';
import { Query } from 'node-appwrite';
import { getServerAppwrite } from '@/lib/appwrite/server';
import { processExpenseEmail } from '@/lib/agent/graph';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET!;
    const payload = await request.text(); // must be raw body
    const wh = new Webhook(webhookSecret);

    const event = wh.verify(payload, {
      'svix-id': request.headers.get('svix-id') ?? '',
      'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
      'svix-signature': request.headers.get('svix-signature') ?? '',
    }) as {
      type: string;
      data: { email_id: string };
    };

    if (event.type !== 'email.received') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const resendEmailId = event.data.email_id;

    // 3. Fetch full email content from Resend API
    const { data: email } = await resend.emails.receiving.get(resendEmailId);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // 4. Resolve user from inbound email address
    const { databases } = getServerAppwrite();
    const toAddress = email.to?.[0]; // e.g., "user-abc@inbound.domain.com"

    const users = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.tables.users,
      [Query.equal('inbound_email', toAddress)]
    );

    if (users.total === 0) {
      console.warn(`No user found for inbound address: ${toAddress}`);
      return NextResponse.json({ error: 'Unknown recipient' }, { status: 200 });
    }

    const userId = users.documents[0].$id;

    // 5. Dedup check
    const existing = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.tables.transactions,
      [Query.equal('resend_email_id', resendEmailId)]
    );

    if (existing.total > 0) {
      return NextResponse.json({ status: 'duplicate' }, { status: 200 });
    }

    // 6. Vendor cache fast path (simple regex extraction)
    // ... (see AI_AGENT_ARCHITECTURE.md for details)

    // 7. Invoke LangGraph agent
    const result = await processExpenseEmail({
      emailHtml: email.html || '',
      emailText: email.text || '',
      emailSubject: email.subject || '',
      emailDate: email.created_at,
      resendEmailId,
      userId,
    });

    return NextResponse.json({ 
      status: 'processed',
      transactionId: result.transactionId 
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 500 so Resend retries the webhook
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

**Resend Webhook Payload (`email.received`):**
```json
{
  "type": "email.received",
  "data": {
    "email_id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
    "from": "unialerts@uobgroup.com",
    "to": ["user-abc@inbound.yourdomain.com"],
    "subject": "UOB Transaction Alert",
    "created_at": "2026-02-08T01:31:11.894719+00:00"
  }
}
```

**Resend Retrieved Email (full content):**
```json
{
  "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
  "to": ["user-abc@inbound.yourdomain.com"],
  "from": "unialerts@uobgroup.com",
  "subject": "UOB Transaction Alert",
  "html": "<p>A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM...</p>",
  "text": "A transaction of SGD 16.23 was made with your UOB Card ending 8909 on 08/02/26 at DIGITALOCEAN.COM...",
  "headers": { "return-path": "...", "mime-version": "1.0" },
  "created_at": "2026-02-08T01:31:11.894719+00:00"
}
```

---

## 2. Transactions API

### `GET /api/transactions`

List transactions with pagination, date range filtering, and category filtering.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 25 | Items per page (max 100) |
| `startDate` | string | — | ISO 8601 date (inclusive) |
| `endDate` | string | — | ISO 8601 date (exclusive) |
| `categoryId` | string | — | Filter by category |
| `source` | string | — | `"email"` or `"manual"` |
| `sortBy` | string | `"transaction_date"` | Sort field |
| `sortOrder` | string | `"desc"` | `"asc"` or `"desc"` |

**Response:**
```json
{
  "transactions": [
    {
      "id": "abc123",
      "amount": 16.23,
      "vendor": "DIGITALOCEAN.COM",
      "category": {
        "id": "cat-bills",
        "name": "Bills & Utilities",
        "icon": "💡",
        "color": "#3b82f6"
      },
      "transactionDate": "2026-02-08T09:31:00+08:00",
      "confidence": "medium",
      "source": "email",
      "createdAt": "2026-02-08T09:31:15+08:00"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 25,
  "hasMore": true
}
```

### `POST /api/transactions`

Create a manual transaction (user-entered, not from email).

**Request Body:**
```json
{
  "amount": 25.50,
  "vendor": "Cash Payment - Hawker",
  "categoryId": "cat-food",
  "transactionDate": "2026-02-09T12:00:00+08:00",
  "description": "Chicken rice at Maxwell"
}
```

**Response:** `201 Created` with the created transaction object.

### `PATCH /api/transactions/[id]`

Update a transaction (e.g., re-categorize, edit amount/vendor).

**Request Body (partial):**
```json
{
  "categoryId": "cat-food",
  "amount": 18.50,
  "vendor": "Updated Vendor Name"
}
```

### `DELETE /api/transactions/[id]`

Delete a transaction. Returns `204 No Content`.

---

## 3. Categories API

### `GET /api/categories`

List all categories for the authenticated user, ordered by `sort_order`.

**Response:**
```json
{
  "categories": [
    {
      "id": "cat-food",
      "name": "Food & Beverage",
      "description": "Restaurants, cafes, coffee shops, bubble tea, hawker centres, food delivery",
      "icon": "🍔",
      "color": "#ef4444",
      "isDefault": true,
      "sortOrder": 1
    }
  ]
}
```

### `POST /api/categories`

Create a new custom category.

**Request Body:**
```json
{
  "name": "Subscriptions",
  "description": "Monthly software subscriptions like GitHub, Notion, ChatGPT Plus",
  "icon": "🔄",
  "color": "#06b6d4"
}
```

**Validation:**
- `name` must be unique per user (enforced by DB index)
- `description` is required (this powers the AI categorization)
- `icon` defaults to `"📦"` if not provided
- `color` defaults to `"#6366f1"` if not provided

### `PATCH /api/categories/[id]`

Update a category. Can modify name, description, icon, color, sort_order.

**Important:** When a category's description is updated, the vendor cache entries for this category remain valid. The description change improves **future** categorization accuracy.

### `DELETE /api/categories/[id]`

Delete a category.

**Pre-conditions:**
- Cannot delete if transactions exist with this category → return `409 Conflict` with message to re-categorize first
- Alternatively: move all transactions to "Other" category, then delete

**Cascade behavior:**
1. Delete all `vendor_cache` entries pointing to this category
2. Delete all `budgets` for this category
3. Re-assign transactions to "Other" (or require user to re-categorize)

---

## 4. Budgets API

### `GET /api/budgets`

Get budgets for a specific month/year with actual spending totals.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `year` | int | current year | Budget year |
| `month` | int | current month | Budget month (1–12) |

**Response:**
```json
{
  "year": 2026,
  "month": 2,
  "budgets": [
    {
      "id": "budget-001",
      "category": {
        "id": "cat-food",
        "name": "Food & Beverage",
        "icon": "🍔",
        "color": "#ef4444"
      },
      "budgetAmount": 400.00,
      "spentAmount": 188.30,
      "remainingAmount": 211.70,
      "percentUsed": 47.08,
      "status": "on_track"
    },
    {
      "id": "budget-002",
      "category": {
        "id": "cat-transport",
        "name": "Transportation",
        "icon": "🚗",
        "color": "#f97316"
      },
      "budgetAmount": 150.00,
      "spentAmount": 78.30,
      "remainingAmount": 71.70,
      "percentUsed": 52.20,
      "status": "on_track"
    }
  ],
  "totalBudget": 1900.00,
  "totalSpent": 1023.49,
  "totalRemaining": 876.51
}
```

**Status values:**
- `"on_track"`: < 80% spent
- `"warning"`: 80–99% spent
- `"over_budget"`: ≥ 100% spent

### `POST /api/budgets`

Create or update a budget for a category in a given month.

**Request Body:**
```json
{
  "categoryId": "cat-food",
  "amount": 400.00,
  "year": 2026,
  "month": 2
}
```

**Behavior:** If a budget already exists for this category+month+year (unique index), update the amount. Otherwise, create a new one. (Upsert pattern.)

### `DELETE /api/budgets/[id]`

Remove a budget. Returns `204 No Content`.

---

## 5. Dashboard API

### `GET /api/dashboard/summary`

Aggregated data for the dashboard charts. Server-side computation to avoid sending raw transactions to the client.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `"month"` | `"week"`, `"month"`, `"year"` |
| `year` | int | current year | Year to query |
| `month` | int | current month | Month to query (for week/month periods) |
| `week` | int | current week | ISO week number (for week period) |

**Response:**
```json
{
  "period": "month",
  "year": 2026,
  "month": 2,
  "summary": {
    "totalSpent": 1023.49,
    "totalBudget": 1900.00,
    "transactionCount": 30,
    "averageTransaction": 34.12
  },
  "byCategory": [
    {
      "categoryId": "cat-food",
      "categoryName": "Food & Beverage",
      "icon": "🍔",
      "color": "#ef4444",
      "spent": 188.30,
      "budget": 400.00,
      "percentage": 18.4,
      "transactionCount": 7
    }
  ],
  "recentTransactions": [
    {
      "id": "tx-latest",
      "vendor": "DIGITALOCEAN.COM",
      "amount": 16.23,
      "categoryName": "Bills & Utilities",
      "categoryIcon": "💡",
      "transactionDate": "2026-02-08T09:31:00+08:00",
      "confidence": "medium"
    }
  ],
  "dailySpending": [
    { "date": "2026-02-01", "amount": 54.48 },
    { "date": "2026-02-02", "amount": 5.80 }
  ]
}
```

### `GET /api/dashboard/alerts`

Returns budget alert status for the current period.

**Response:**
```json
{
  "alerts": [
    {
      "type": "warning",
      "categoryId": "cat-entertain",
      "categoryName": "Entertainment",
      "icon": "🎬",
      "budgetAmount": 100.00,
      "spentAmount": 83.47,
      "percentUsed": 83.47,
      "message": "Entertainment spending is at 83% of your $100.00 budget"
    },
    {
      "type": "over_budget",
      "categoryId": "cat-shopping",
      "categoryName": "Shopping",
      "icon": "🛍️",
      "budgetAmount": 300.00,
      "spentAmount": 327.19,
      "percentUsed": 109.06,
      "overAmount": 27.19,
      "message": "Shopping is $27.19 over your $300.00 budget"
    }
  ],
  "hasWarnings": true,
  "hasOverBudget": true
}
```

---

## 6. User Profile API

### `GET /api/user/profile`

Get the authenticated user's profile, including their unique inbound email address.

**Response:**
```json
{
  "id": "user-abc-123",
  "name": "Brendan",
  "email": "brendan@gmail.com",
  "inboundEmail": "user-abc-123@inbound.yourdomain.com",
  "oauthProvider": "google",
  "createdAt": "2026-01-15T10:00:00+08:00"
}
```

---

## 🔐 Authentication Middleware

All `/api/*` routes (except `/api/webhooks/resend`) require Appwrite session authentication.

```typescript
// src/lib/appwrite/auth-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';

export async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('a_session')?.value;

  if (!sessionCookie) {
    return null;
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setSession(sessionCookie);

  const account = new Account(client);

  try {
    const user = await account.get();
    return user;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

**Usage in API routes:**
```typescript
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  // user.$id is the Appwrite user ID
  // Use it to filter all database queries
}
```

---

## 📊 Rate Limits & Error Codes

| Status Code | Meaning | When |
|-------------|---------|------|
| `200` | Success | Standard response |
| `201` | Created | New resource created |
| `204` | No Content | Successful deletion |
| `400` | Bad Request | Invalid request body or query params |
| `401` | Unauthorized | Missing or invalid session |
| `404` | Not Found | Resource doesn't exist or belongs to another user |
| `409` | Conflict | Duplicate entry (e.g., category name already exists) |
| `429` | Rate Limited | Appwrite Cloud rate limits (unlikely at low volume) |
| `500` | Server Error | Unexpected failure (agent timeout, DB error) |

---

## 🤖 AI Feedback Routes

### `POST /api/feedback`

Process user feedback on a miscategorized transaction. The AI proposes a new category based on the user's correction text.

**Request Body:**
```json
{
  "transactionId": "tx-001",
  "feedbackText": "This should be in Bills, DigitalOcean is a cloud hosting provider",
  "conversationHistory": []
}
```

**Response (200):**
```json
{
  "proposedCategoryId": "cat-bills",
  "proposedCategoryName": "Bills & Utilities",
  "reasoning": "DigitalOcean is a cloud infrastructure provider. Cloud hosting costs are recurring operational expenses that fit under Bills & Utilities.",
  "round": 1
}
```

### `POST /api/feedback/approve`

Approve the AI's proposed re-categorization. Updates the transaction, vendor cache, and stores the correction in Mem0 for future recall.

**Request Body:**
```json
{
  "transactionId": "tx-001",
  "newCategoryId": "cat-bills",
  "vendor": "DIGITALOCEAN.COM",
  "reasoning": "DigitalOcean is a cloud hosting provider → Bills & Utilities"
}
```

**Response (200):**
```json
{
  "status": "approved",
  "transactionId": "tx-001",
  "newCategoryId": "cat-bills",
  "vendorCacheUpdated": true,
  "memoryStored": true
}
```

### `PATCH /api/user/profile`

Update user profile fields (salary, budget mode).

**Request Body:**
```json
{
  "monthly_salary": 6000.00,
  "budget_mode": "percentage"
}
```

**Response (200):**
```json
{
  "monthly_salary": 6000.00,
  "budget_mode": "percentage",
  "updated_at": "2026-02-13T10:00:00+08:00"
}
```
