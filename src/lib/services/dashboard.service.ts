/**
 * Dashboard service — aggregates data for the dashboard view.
 *
 * Computes summary statistics, category breakdowns, recent transactions,
 * daily spending, and budget alerts.
 *
 * Implements FEAT-007 (Dashboard Backend).
 */

import type {
  ITransactionRepository,
  IBudgetRepository,
  ICategoryRepository,
} from '@/lib/repositories/interfaces';
import {
  extractDateOnly,
  getMonthDateRange,
  getWeekDateRange,
  getYearDateRange,
} from '@/lib/utils/date';
import {
  calculateBudgetStatus,
  calculateOverAmount,
  formatBudgetAlertMessage,
} from '@/lib/utils/budget';
import type {
  DashboardSummaryResponse,
  DashboardAlertsResponse,
  DashboardAlert,
  CategoryBreakdown,
  RecentTransaction,
  DailySpending,
  DashboardSummaryParams,
  DashboardAlertsParams,
} from '@/types/dashboard';
import type { Category } from '@/types/category';

export class DashboardService {
  private static readonly _RECENT_TRANSACTIONS_LIMIT = 10;

  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly categoryRepo: ICategoryRepository
  ) {}

  // =========================================================================
  // getSummary
  // =========================================================================

  async getSummary(params: DashboardSummaryParams): Promise<DashboardSummaryResponse> {
    const { userId, period, year, month, week } = params;

    // 1. Compute date range for the requested period
    const { start, end } = this._getDateRange(period, year, month, week);

    // 2. Fetch transactions in the date range
    const transactions = await this.transactionRepo.findByUserAndDateRange(userId, start, end);

    // 3. Fetch categories for name/icon/color lookup
    const categories = await this.categoryRepo.findByUserId(userId);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // 4. Fetch budgets (only meaningful for month period, but include for all)
    const budgetMonth = month ?? (period === 'month' ? new Date().getMonth() + 1 : undefined);
    const budgetYear = year;
    let budgets: Array<{ categoryId: string; amount: number }> = [];
    if (budgetMonth) {
      budgets = await this.budgetRepo.findByUserAndPeriod(userId, budgetYear, budgetMonth);
    }
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.amount]));

    // 5. Compute totals
    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    // 6. Category breakdown
    const byCategory = this._buildCategoryBreakdown(
      transactions,
      categoryMap,
      budgetMap,
      totalSpent
    );

    // 7. Recent transactions (latest 10)
    const recentTransactions = this._buildRecentTransactions(transactions, categoryMap);

    // 8. Daily spending aggregation
    const dailySpending = this._buildDailySpending(transactions);

    return {
      period,
      year,
      ...(month !== undefined && { month }),
      ...(week !== undefined && { week }),
      summary: {
        totalSpent,
        totalBudget,
        transactionCount,
        averageTransaction,
      },
      byCategory,
      recentTransactions,
      dailySpending,
    };
  }

  // =========================================================================
  // getAlerts
  // =========================================================================

  async getAlerts(params: DashboardAlertsParams): Promise<DashboardAlertsResponse> {
    const { userId, year, month } = params;

    // 1. Get budgets for the month
    const budgets = await this.budgetRepo.findByUserAndPeriod(userId, year, month);
    if (budgets.length === 0) {
      return { alerts: [], hasWarnings: false, hasOverBudget: false };
    }

    // 2. Get spending summary per category
    const { start, end } = getMonthDateRange(year, month);
    const spendingSummary = await this.transactionRepo.sumByUserCategoryDateRange(
      userId,
      start,
      end
    );
    const spendingMap = new Map(spendingSummary.map((s) => [s.categoryId, s.totalSpent]));

    // 3. Get category details for names/icons
    const categories = await this.categoryRepo.findByUserId(userId);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // 4. Build alerts
    const alerts: DashboardAlert[] = [];

    for (const budget of budgets) {
      const spent = spendingMap.get(budget.categoryId) ?? 0;
      const { percentUsed, status } = calculateBudgetStatus(spent, budget.amount);

      if (status === 'on_track') {
        continue;
      }

      const category = categoryMap.get(budget.categoryId);
      const categoryName = category?.name ?? 'Unknown';
      const icon = category?.icon ?? '📦';
      const message = formatBudgetAlertMessage(categoryName, spent, budget.amount, status);

      const alert: DashboardAlert = {
        type: status,
        categoryId: budget.categoryId,
        categoryName,
        icon,
        budgetAmount: budget.amount,
        spentAmount: spent,
        percentUsed,
        message,
      };

      if (status === 'over_budget') {
        alert.overAmount = calculateOverAmount(spent, budget.amount);
      }

      alerts.push(alert);
    }

    // 5. Sort: over_budget first, then warning
    alerts.sort((a, b) => {
      const priority = { over_budget: 0, warning: 1 } as const;
      return priority[a.type] - priority[b.type];
    });

    return {
      alerts,
      hasWarnings: alerts.some((a) => a.type === 'warning'),
      hasOverBudget: alerts.some((a) => a.type === 'over_budget'),
    };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private _getDateRange(
    period: string,
    year: number,
    month?: number,
    week?: number
  ): { start: string; end: string } {
    switch (period) {
      case 'week': {
        if (!week) {
          throw new Error('Week number is required for week period');
        }
        return getWeekDateRange(year, week);
      }
      case 'year':
        return getYearDateRange(year);
      case 'month':
      default: {
        const m = month ?? new Date().getMonth() + 1;
        return getMonthDateRange(year, m);
      }
    }
  }

  private _buildCategoryBreakdown(
    transactions: Array<{ categoryId: string; amount: number }>,
    categoryMap: Map<string, Category>,
    budgetMap: Map<string, number>,
    totalSpent: number
  ): CategoryBreakdown[] {
    // Group by category
    const categoryTotals = new Map<string, { spent: number; count: number }>();
    for (const tx of transactions) {
      const current = categoryTotals.get(tx.categoryId) || { spent: 0, count: 0 };
      current.spent += tx.amount;
      current.count += 1;
      categoryTotals.set(tx.categoryId, current);
    }

    const breakdown: CategoryBreakdown[] = [];
    for (const [categoryId, { spent, count }] of categoryTotals) {
      const category = categoryMap.get(categoryId);
      breakdown.push({
        categoryId,
        categoryName: category?.name ?? 'Unknown',
        icon: category?.icon ?? '📦',
        color: category?.color ?? '#6b7280',
        spent,
        budget: budgetMap.get(categoryId) ?? 0,
        percentage: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
        transactionCount: count,
      });
    }

    // Sort by spent descending
    breakdown.sort((a, b) => b.spent - a.spent);
    return breakdown;
  }

  private _buildRecentTransactions(
    transactions: Array<{
      id: string;
      vendor: string;
      amount: number;
      categoryId: string;
      transactionDate: string;
      confidence: string;
    }>,
    categoryMap: Map<string, Category>
  ): RecentTransaction[] {
    // Sort by date descending, take top N
    const sorted = [...transactions].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate)
    );

    return sorted.slice(0, DashboardService._RECENT_TRANSACTIONS_LIMIT).map((tx) => {
      const category = categoryMap.get(tx.categoryId);
      return {
        id: tx.id,
        vendor: tx.vendor,
        amount: tx.amount,
        categoryName: category?.name ?? 'Unknown',
        categoryIcon: category?.icon ?? '📦',
        transactionDate: tx.transactionDate,
        confidence: tx.confidence,
      };
    });
  }

  private _buildDailySpending(
    transactions: Array<{ transactionDate: string; amount: number }>
  ): DailySpending[] {
    const dailyMap = new Map<string, number>();
    for (const tx of transactions) {
      const date = extractDateOnly(tx.transactionDate);
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + tx.amount);
    }

    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
