import type { BudgetStatus } from '@/types/budget';

// ---------------------------------------------------------------------------
// Summary Response
// ---------------------------------------------------------------------------

export interface DashboardSummaryResponse {
  period: 'week' | 'month' | 'year';
  year: number;
  month?: number;
  week?: number;
  summary: {
    totalSpent: number;
    totalBudget: number;
    transactionCount: number;
    averageTransaction: number;
  };
  byCategory: CategoryBreakdown[];
  recentTransactions: RecentTransaction[];
  dailySpending: DailySpending[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  spent: number;
  budget: number;
  percentage: number;
  transactionCount: number;
}

export interface RecentTransaction {
  id: string;
  vendor: string;
  amount: number;
  categoryName: string;
  categoryIcon: string;
  transactionDate: string;
  confidence: string;
}

export interface DailySpending {
  date: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// Alerts Response
// ---------------------------------------------------------------------------

export interface DashboardAlertsResponse {
  alerts: DashboardAlert[];
  hasWarnings: boolean;
  hasOverBudget: boolean;
}

export interface DashboardAlert {
  type: 'warning' | 'over_budget';
  categoryId: string;
  categoryName: string;
  icon: string;
  budgetAmount: number;
  spentAmount: number;
  percentUsed: number;
  overAmount?: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Service method params
// ---------------------------------------------------------------------------

export type DashboardPeriod = 'week' | 'month' | 'year';

export interface DashboardSummaryParams {
  userId: string;
  period: DashboardPeriod;
  year: number;
  month?: number;
  week?: number;
}

export interface DashboardAlertsParams {
  userId: string;
  year: number;
  month: number;
}

// ---------------------------------------------------------------------------
// Legacy type (kept for backward compat — prefer DashboardSummaryResponse)
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  totalSpent: number;
  totalBudget: number;
  percentUsed: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    spent: number;
    budgeted: number;
  }>;
}
