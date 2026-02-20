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
import type { DashboardSummary } from '@/types/dashboard';

export class DashboardService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly categoryRepo: ICategoryRepository
  ) {}

  getSummary(_userId: string, _year: number, _month: number): Promise<DashboardSummary> {
    // TODO: Implement in FEAT-007
    throw new Error('Dashboard service not yet implemented. See FEAT-007.');
  }
}
