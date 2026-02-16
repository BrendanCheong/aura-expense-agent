/**
 * Budget service — business logic for budget management.
 *
 * Will be fully implemented during feature development.
 */

import type { IBudgetRepository, ITransactionRepository } from '@/lib/repositories/interfaces';
import type { Budget, BudgetCreate, BudgetUpdate } from '@/types/budget';

export class BudgetService {
  constructor(
    private readonly budgetRepo: IBudgetRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  listBudgets(userId: string, year: number, month: number): Promise<Budget[]> {
    return this.budgetRepo.findByUserAndPeriod(userId, year, month);
  }

  async createBudget(userId: string, data: Omit<BudgetCreate, 'userId'>): Promise<Budget> {
    const existing = await this.budgetRepo.findByUserCategoryPeriod(
      userId,
      data.categoryId,
      data.year,
      data.month
    );
    if (existing) {
      throw new Error('Budget already exists for this category and period');
    }
    return this.budgetRepo.create({ ...data, userId: userId });
  }

  async updateBudget(userId: string, budgetId: string, data: BudgetUpdate): Promise<Budget> {
    const budget = await this.budgetRepo.findById(budgetId);
    if (!budget || budget.userId !== userId) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    return this.budgetRepo.update(budgetId, data);
  }

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const budget = await this.budgetRepo.findById(budgetId);
    if (!budget || budget.userId !== userId) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    await this.budgetRepo.delete(budgetId);
  }
}
