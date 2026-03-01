/**
 * Budget utility functions — shared between BudgetService and DashboardService.
 *
 * Extracted per SOLID (2+ consumers) to avoid duplication.
 */

import type { BudgetStatus } from '@/types/budget';

// ---------------------------------------------------------------------------
// Thresholds (module-level constants — single source of truth)
// ---------------------------------------------------------------------------

export const BUDGET_WARNING_THRESHOLD = 80;
export const BUDGET_OVER_THRESHOLD = 100;

// ---------------------------------------------------------------------------
// calculateBudgetStatus
// ---------------------------------------------------------------------------

export interface BudgetStatusResult {
  percentUsed: number;
  status: BudgetStatus;
}

/**
 * Calculate the budget status from spent and budgeted amounts.
 *
 * - `on_track`: percentUsed < 80%
 * - `warning`: 80% <= percentUsed < 100%
 * - `over_budget`: percentUsed >= 100%
 *
 * Edge case: if budget is 0 and spent > 0 → over_budget (Infinity %).
 * Edge case: if budget is 0 and spent is 0 → on_track (0%).
 */
export function calculateBudgetStatus(spent: number, budget: number): BudgetStatusResult {
  let percentUsed: number;

  if (budget <= 0) {
    percentUsed = spent > 0 ? Infinity : 0;
  } else {
    percentUsed = (spent / budget) * 100;
  }

  let status: BudgetStatus;
  if (percentUsed >= BUDGET_OVER_THRESHOLD) {
    status = 'over_budget';
  } else if (percentUsed >= BUDGET_WARNING_THRESHOLD) {
    status = 'warning';
  } else {
    status = 'on_track';
  }

  return { percentUsed, status };
}

// ---------------------------------------------------------------------------
// calculateOverAmount
// ---------------------------------------------------------------------------

/**
 * How much over budget? Returns 0 if on-track or under budget.
 */
export function calculateOverAmount(spent: number, budget: number): number {
  return Math.max(0, spent - budget);
}

// ---------------------------------------------------------------------------
// formatBudgetAlertMessage
// ---------------------------------------------------------------------------

/**
 * Human-readable alert message for a budget alert.
 */
export function formatBudgetAlertMessage(
  categoryName: string,
  spent: number,
  budget: number,
  status: BudgetStatus
): string {
  const budgetStr = `$${budget.toFixed(2)}`;

  if (status === 'over_budget') {
    const overAmount = calculateOverAmount(spent, budget);
    return `${categoryName} is $${overAmount.toFixed(2)} over your ${budgetStr} budget`;
  }

  const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  return `${categoryName} spending is at ${percent}% of your ${budgetStr} budget`;
}
