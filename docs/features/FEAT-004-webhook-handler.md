# FEAT-004 — Resend Inbound Email Webhook Handler

> **Status:** 🔴 Not Started  
> **Execution Order:** 7 of 13  
> **Sprint:** 3 — AI Pipeline  
> **Blocked By:** FEAT-005, FEAT-006  
> **Priority:** P0 (Blocker)  
> **Estimate:** 1.5 days  
> **Assignee:** —

---

## Summary

Build the webhook endpoint that receives Resend's `email.received` events, verifies the signature, fetches the full email content, performs dedup checking, and either fast-paths via vendor cache or invokes the AI agent.

## User Stories

- **US-1:** "As a user, I want my bank transaction emails auto-forwarded to a unique Resend address so I never manually upload a receipt."

## Acceptance Criteria

- [ ] `POST /api/webhooks/resend` receives and parses Resend webhook payloads
- [ ] Webhook signature is verified using Svix (Resend's webhook library)
- [ ] Non `email.received` events return `200 { status: "ignored" }`
- [ ] Full email content is fetched via `resend.emails.receiving.get()`
- [ ] User is resolved from the `to` address (`inbound_email` field)
- [ ] Unknown recipient returns `200 { error: "Unknown recipient" }` (not 4xx — don't trigger Resend retries)
- [ ] Duplicate emails detected by `resend_email_id` return `200 { status: "duplicate" }`
- [ ] Known vendor (vendor cache hit) creates transaction immediately without agent
- [ ] Unknown vendor invokes the AI agent pipeline
- [ ] Transaction is created with all fields populated
- [ ] Vendor cache is updated after successful processing
- [ ] Response time < 30 seconds (webhook timeout)

## Technical Details

### Webhook Signature Verification (Resend + Svix)

Use `svix` directly for request verification:

- Install dependency: `pnpm add svix`
- Read **raw body** with `await request.text()` (do not use `request.json()` before verification)
- Verify using headers:
  - `svix-id`
  - `svix-timestamp`
  - `svix-signature`
- Use signing secret: `process.env.RESEND_WEBHOOK_SECRET`

If verification fails, return `400 Invalid webhook`.

```typescript
import { Webhook } from 'svix';

const payload = await request.text();
const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);

const event = wh.verify(payload, {
  'svix-id': request.headers.get('svix-id') ?? '',
  'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
  'svix-signature': request.headers.get('svix-signature') ?? '',
});
```

### Local Development Webhook URL (ngrok)

Use ngrok to expose local port `4321` to Resend:

```bash
pnpm dev
pnpm tunnel:webhook
```

Then configure this URL in Resend Webhooks:

```text
https://<your-ngrok-domain>.ngrok-free.app/api/webhooks/resend
```

If ngrok shows `ERR_NGROK_108` (one agent session limit), reuse the existing local agent by creating an additional tunnel via the local API:

```bash
curl -X POST http://127.0.0.1:4040/api/tunnels \
    -H 'Content-Type: application/json' \
    -d '{"name":"aura-webhook","addr":"localhost:4321","proto":"http"}'
```

### Files to Create/Modify

| File                                   | Purpose                              |
| -------------------------------------- | ------------------------------------ |
| `src/app/api/webhooks/resend/route.ts` | Webhook handler                      |
| `src/lib/services/webhook.service.ts`  | Business logic (dedup, cache, agent) |
| `src/lib/resend/client.ts`             | Resend SDK singleton                 |
| `src/lib/utils/vendor.ts`              | Vendor name normalization            |

### Flow

```
Resend POST → Verify Signature → Fetch Full Email → Resolve User
    → Dedup Check → Extract Rough Vendor → Vendor Cache Lookup
    → [HIT] Create Transaction (fast path)
    → [MISS] Invoke Agent → Create Transaction
    → Update Vendor Cache → Return 200
```

### Design Patterns

- **Service Layer:** `WebhookService.processInboundEmail()` — [ADR-008](../ADR/ADR-008-service-layer-pattern.md)
- **Repository Pattern:** `TransactionRepository`, `VendorCacheRepository` — [ADR-009](../ADR/ADR-009-repository-pattern.md)
- **Strategy Pattern:** Vendor cache check is the first tier of categorization — [ADR-013](../ADR/ADR-013-strategy-pattern.md)

## Definition of Done

- [ ] All acceptance criteria pass manually with `scripts/mock-webhook.ts`
- [ ] Unit tests: `WebhookService.processInboundEmail()` — duplicate, cached, agent (3 tests)
- [ ] Unit tests: vendor name normalization (5 tests)
- [ ] Integration test: Full webhook → transaction pipeline (fixture-based)
- [ ] No TypeScript errors
- [ ] Error handling for Resend API failures (retryable response)

## References

- [API_SPECIFICATION.md](../plans/API_SPECIFICATION.md) — Webhook handler spec
- [AI_AGENT_ARCHITECTURE.md](../plans/AI_AGENT_ARCHITECTURE.md) — Agent invocation
- [BACKEND_DESIGN_PATTERNS.md](../plans/BACKEND_DESIGN_PATTERNS.md) — WebhookService implementation
- [ADR-012](../ADR/ADR-012-resend-email.md) — Resend decision
- [Testing Plan 05](../testing-plan/05-integration.test-plan.md) — Webhook pipeline tests
- Test fixtures: `webhook-payloads.json`, `email-samples.json`
