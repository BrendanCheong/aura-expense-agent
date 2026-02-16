#!/usr/bin/env npx tsx
/**
 * Mock Webhook Script — Simulates a Resend email.received webhook event.
 *
 * Sends a POST request to the local webhook endpoint with a test payload.
 * Requires PROJECT_ENV=dev to bypass Svix signature verification.
 *
 * Usage:
 *   npx tsx scripts/mock-webhook.ts                     # UOB DIGITALOCEAN.COM
 *   npx tsx scripts/mock-webhook.ts dbs                 # DBS GRAB *GRABFOOD
 *   npx tsx scripts/mock-webhook.ts ocbc                # OCBC AMAZON.SG
 *   npx tsx scripts/mock-webhook.ts newsletter          # Non-transaction email
*/

const WEBHOOK_URL = 'http://localhost:4321/api/webhooks/resend';

const payloads: Record<string, unknown> = {
  uob: {
    type: 'email.received',
    data: {
      email_id: `mock-uob-${Date.now()}`,
      from: 'unialerts@uobgroup.com',
      to: ['user-test-user-001@inbound.yourdomain.com'],
      subject: 'UOB Transaction Alert',
      created_at: new Date().toISOString(),
    },
  },
  dbs: {
    type: 'email.received',
    data: {
      email_id: `mock-dbs-${Date.now()}`,
      from: 'alerts@dbs.com.sg',
      to: ['user-test-user-001@inbound.yourdomain.com'],
      subject: 'DBS Card Transaction',
      created_at: new Date().toISOString(),
    },
  },
  ocbc: {
    type: 'email.received',
    data: {
      email_id: `mock-ocbc-${Date.now()}`,
      from: 'alerts@ocbc.com',
      to: ['user-test-user-001@inbound.yourdomain.com'],
      subject: 'OCBC Card Notification',
      created_at: new Date().toISOString(),
    },
  },
  newsletter: {
    type: 'email.received',
    data: {
      email_id: `mock-newsletter-${Date.now()}`,
      from: 'newsletter@company.com',
      to: ['user-test-user-001@inbound.yourdomain.com'],
      subject: 'Weekly Newsletter',
      created_at: new Date().toISOString(),
    },
  },
};

async function main() {
  const variant = process.argv[2] || 'uob';
  const payload = payloads[variant];

  if (!payload) {
    console.error(`Unknown variant: ${variant}`);
    console.error(`Available: ${Object.keys(payloads).join(', ')}`);
    process.exit(1);
  }

  console.log(`Sending ${variant} webhook to ${WEBHOOK_URL}...`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  console.log(`\nResponse (${response.status}):`, JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
