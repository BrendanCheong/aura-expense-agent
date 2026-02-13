# ADR-012: Resend for Inbound Email Processing

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [PLAN.md](../plans/PLAN.md), [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) |

---

## Context

Aura's core feature is processing bank transaction emails automatically. We need an email gateway that:
1. Receives emails at custom addresses (e.g., `user-abc@inbound.yourdomain.com`)
2. Sends a webhook notification to our API when an email arrives
3. Allows fetching the full email content (HTML, text, headers) via API
4. Is reliable (retries on delivery failure)

---

## Decision

**Use Resend's inbound email feature with webhook notifications.**

---

## Options Considered

### Option A: Resend Inbound — **CHOSEN**

**Pros:**
- **Simple setup** — MX records → Resend → webhook to Next.js API route
- **Webhook model** — push-based, no polling needed
- **Full email retrieval** — `emails.receiving.get(id)` returns HTML, text, headers, from, to, subject
- **Built-in retry** — up to 3 webhook delivery attempts on failure
- **TypeScript SDK** — `resend` npm package with typed responses
- **Webhook signature verification** — security built-in
- **Free tier** — includes inbound email capability
- **Per-user addresses** — each user gets `user-{userId}@inbound.yourdomain.com`

**Cons:**
- Requires custom domain with MX records pointed to Resend
- Inbound email is a newer Resend feature — less battle-tested than SendGrid
- 25MB email size limit (not an issue for bank alerts)
- No built-in email filtering — all emails to the domain trigger webhooks

### Option B: SendGrid Inbound Parse

**Pros:**
- Most widely used email gateway
- Proven reliability at scale
- Rich parsing options

**Cons:**
- More complex setup — parse webhook is harder to configure
- Heavier SDK
- Free tier is more limited for inbound
- Webhook payload includes full email (potentially large), not just a notification ID

### Option C: AWS SES Inbound

**Pros:**
- AWS ecosystem integration
- Very low cost
- S3 storage for received emails

**Cons:**
- Complex setup — SES → SNS → Lambda/S3 → webhook
- Requires AWS account and IAM configuration
- Not developer-friendly for small projects
- No TypeScript SDK ergonomics like Resend

### Option D: Mailgun

**Pros:**
- Reliable email infrastructure
- Good inbound routing
- Free tier available

**Cons:**
- Heavier enterprise focus
- More expensive paid plans
- SDK is less TypeScript-friendly

---

## Consequences

### Positive
- Two-step email processing: (1) webhook notification → (2) fetch full email via API. Decouples webhook handling from email parsing.
- `resend_email_id` provides a natural dedup key for the `transactions` table
- Webhook retry ensures no emails are lost on transient API failures
- TypeScript SDK makes integration straightforward

### Negative
- Single dependency on Resend for email ingestion — if Resend goes down, no new transactions are processed
  - **Mitigation:** Transactions are delayed, not lost. When Resend recovers, webhooks are retried. Expense tracking is not time-critical.
- MX record setup requires domain ownership and DNS access
