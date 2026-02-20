/**
 * Budget service — business logic for budget management.
 *
 * Handles budget CRUD, upsert, and enriched budget listing
 * with spending calculations.
 */

import type { IBudgetRepository, ITransactionRepository } from '@/lib/repositories/interfaces';
import type {
  Budget,
  BudgetCreate,
  BudgetUpdate,
  BudgetStatus,
  EnrichedBudget,
  BudgetsWithSpending,
} from '@/types/budget';

import { SGT_OFFSET } from '@/lib/constants';
import { BudgetNotFoundError, BudgetAlreadyExistsError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class BudgetService {
  constructor(
    private readonly budgetRepo: IBudgetRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  /**
   * List budgets for a month with enriched spending data.
   * Computes spentAmount, remainingAmount, percentUsed, and status per budget.
   */
  async getBudgetsWithSpending(
    userId: string,
    year: number,
    month: number
  ): Promise<BudgetsWithSpending> {
    const budgets = await this.budgetRepo.findByUserAndPeriod(userId, year, month);

    if (budgets.length === 0) {
      return { year, month, budgets: [], totalBudget: 0, totalSpent: 0, totalRemaining: 0 };
    }

    // Compute date range for the month (SGT)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00${SGT_OFFSET}`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00${SGT_OFFSET}`;

    // Get spending summary per category
    const spendingSummary = await this.transactionRepo.sumByUserCategoryDateRange(
      userId,
      startDate,
      endDate
    );

    const spendingMap = new Map(spendingSummary.map((s) => [s.categoryId, s.totalSpent]));

    const enrichedBudgets: EnrichedBudget[] = budgets.map((budget) => {
      const spentAmount = spendingMap.get(budget.categoryId) ?? 0;
      const remainingAmount = budget.amount - spentAmount;
      const percentUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : spentAmount > 0 ? Infinity : 0;
      const status = this._calculateStatus(percentUsed);

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        budgetAmount: budget.amount,
        spentAmount,
        remainingAmount,
        percentUsed,
        status,
        year: budget.year,
        month: budget.month,
      };
    });

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = enrichedBudgets.reduce((sum, b) => sum + b.spentAmount, 0);

    return {
      year,
      month,
      budgets: enrichedBudgets,
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
    };
  }

  /**
   * Simple list — raw budgets without spending calculations.
   */
  listBudgets(userId: string, year: number, month: number): Promise<Budget[]> {
    return this.budgetRepo.findByUserAndPeriod(userId, year, month);
  }

  /**
   * Strict create — throws if budget already exists for category+period.
   */
  async createBudget(userId: string, data: Omit<BudgetCreate, 'userId'>): Promise<Budget> {
    const existing = await this.budgetRepo.findByUserCategoryPeriod(
      userId,
      data.categoryId,
      data.year,
      data.month
    );
    if (existing) {
      throw new BudgetAlreadyExistsError(data.categoryId, data.year, data.month);
    }
    return this.budgetRepo.create({ ...data, userId });
  }

  /**
   * Upsert — create or update. If a budget exists for the same
   * (userId, categoryId, year, month), update the amount. Otherwise create.
   */
  async upsertBudget(userId: string, data: Omit<BudgetCreate, 'userId'>): Promise<Budget> {
    const existing = await this.budgetRepo.findByUserCategoryPeriod(
      userId,
      data.categoryId,
      data.year,
      data.month
    );
    if (existing) {
      return this.budgetRepo.update(existing.id, { amount: data.amount });
    }
    return this.budgetRepo.create({ ...data, userId });
  }

  /**
   * Update an existing budget's amount.
   */
  async updateBudget(userId: string, budgetId: string, data: BudgetUpdate): Promise<Budget> {
    const budget = await this.budgetRepo.findById(budgetId);
    if (!budget || budget.userId !== userId) {
      throw new BudgetNotFoundError(budgetId);
    }
    return this.budgetRepo.update(budgetId, data);
  }

  /**
   * Delete a budget. Ownership check ensures user can only delete their own.
   */
  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const budget = await this.budgetRepo.findById(budgetId);
    if (!budget || budget.userId !== userId) {
      throw new BudgetNotFoundError(budgetId);
    }
    await this.budgetRepo.delete(budgetId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private static readonly _OVER_BUDGET_THRESHOLD = 100;
  private static readonly _WARNING_THRESHOLD = 80;

  private _calculateStatus(percentUsed: number): BudgetStatus {
    if (percentUsed >= BudgetService._OVER_BUDGET_THRESHOLD) {
      return 'over_budget';
    }
    if (percentUsed >= BudgetService._WARNING_THRESHOLD) {
      return 'warning';
    }
    return 'on_track';
  }
}
