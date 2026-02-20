export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  year: number;
  month: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCreate {
  userId: string;
  categoryId: string;
  amount: number;
  year: number;
  month: number;
}

export interface BudgetUpdate {
  amount?: number;
}

// ---------------------------------------------------------------------------
// Enriched / computed budget types
// ---------------------------------------------------------------------------

export type BudgetStatus = 'on_track' | 'warning' | 'over_budget';

export interface EnrichedBudget {
  id: string;
  categoryId: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  status: BudgetStatus;
  year: number;
  month: number;
}

export interface BudgetsWithSpending {
  year: number;
  month: number;
  budgets: EnrichedBudget[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
}
