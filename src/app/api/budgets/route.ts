import type { NextRequest } from 'next/server';
import { notImplementedResponse } from '@/lib/validation/http';

/**
 * GET /api/budgets
 *
 * List budgets for a given month/year with actual spending totals.
 * Auth required.
 *
 * Query params: year (default: current), month (default: current)
 */
export async function GET(_request: NextRequest) {
  // TODO: Implement in FEAT-009
  // 1. Authenticate user
  // 2. Parse & validate query params with `listBudgetsQuerySchema`
  // 3. Call budgetService.listBudgets()
  // 4. Compute spending totals per category
  // 5. Return enriched budget response with status (on_track/warning/over_budget)
  return notImplementedResponse();
}

/**
 * POST /api/budgets
 *
 * Create or update a budget for a category in a given month (upsert).
 * Auth required.
 *
 * Body: { categoryId, amount, year, month }
 */
export async function POST(_request: NextRequest) {
  // TODO: Implement in FEAT-009
  // 1. Authenticate user
  // 2. Parse & validate request body with `createBudgetBodySchema`
  // 3. Call budgetService.createBudget() (upsert if exists)
  // 4. Return 201 with created/updated budget
  return notImplementedResponse();
}
