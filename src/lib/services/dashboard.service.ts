/**
 * Dashboard service — aggregates data for the dashboard view.
 *
 * Will be fully implemented during FEAT-007 (Dashboard).
 */

import type {
  ITransactionRepository,
  IBudgetRepository,
  ICategoryRepository,
} from '@/lib/repositories/interfaces';

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

export class DashboardService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async getSummary(_userId: string, _year: number, _month: number): Promise<DashboardSummary> {
    // TODO: Implement in FEAT-007
    throw new Error('Dashboard service not yet implemented. See FEAT-007.');
  }
}
