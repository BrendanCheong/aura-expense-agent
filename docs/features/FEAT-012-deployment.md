# FEAT-012 — Vercel Deployment & CI/CD

> **Status:** 🔴 Not Started  
> **Execution Order:** 13 of 13  
> **Sprint:** 6 — Quality & Ship  
> **Blocked By:** FEAT-011  
> **Priority:** P1 (High)  
> **Estimate:** 0.5 days  
> **Assignee:** —

---

## Summary

Deploy the application to Vercel with environment variables, preview deployments per PR, and a CI/CD pipeline that runs tests before deployment.

## Acceptance Criteria

- [ ] App deployed to Vercel (`aura-expense.vercel.app` or custom domain)
- [ ] All environment variables configured in Vercel dashboard
- [ ] Preview deployments auto-created for each PR
- [ ] CI pipeline runs: lint → typecheck → unit tests → integration tests → e2e tests → deploy
- [ ] Production deployment only on `main` branch merge
- [ ] Health check endpoint: `GET /api/health` returns `{ status: "ok" }`
- [ ] Resend webhook URL configured to production URL
- [ ] Appwrite OAuth2 redirect URL configured for production domain

## Technical Details

### Environment Variables for Vercel

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<project-id>
APPWRITE_API_KEY=<server-api-key>
APPWRITE_DATABASE_ID=<database-id>
OPENAI_API_KEY=<openai-key>
RESEND_API_KEY=<resend-key>
RESEND_WEBHOOK_SECRET=<webhook-secret>
SMITHERY_BRAVE_URL=https://server.smithery.ai/brave
BRAVE_API_KEY=<brave-key>
```

### CI Pipeline (GitHub Actions)

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm test -- --coverage

  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e

  deploy:
    needs: e2e
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Definition of Done

- [ ] Production URL accessible and functional
- [ ] Preview deployment works for a test PR
- [ ] CI pipeline passes for all jobs
- [ ] Resend webhook delivers to production URL
- [ ] OAuth login works on production domain

## References

- [PLAN.md](../plans/PLAN.md) — Deployment section
- [Testing Plan README](../testing-plan/README.md) — CI pipeline definition
- [FEAT-011](FEAT-011-testing-suite.md) — Tests must pass first
