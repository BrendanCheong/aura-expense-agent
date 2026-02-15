import type { IBudgetRepository } from '../interfaces';
import type { Budget, BudgetCreate, BudgetUpdate } from '@/types/budget';

export class InMemoryBudgetRepository implements IBudgetRepository {
  private store: Map<string, Budget> = new Map();

  findById(id: string): Promise<Budget | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByUserAndPeriod(userId: string, year: number, month: number): Promise<Budget[]> {
    return Promise.resolve(
      Array.from(this.store.values()).filter(
        (b) => b.userId === userId && b.year === year && b.month === month
      )
    );
  }

  findByUserCategoryPeriod(
    userId: string,
    categoryId: string,
    year: number,
    month: number
  ): Promise<Budget | null> {
    for (const b of this.store.values()) {
      if (
        b.userId === userId &&
        b.categoryId === categoryId &&
        b.year === year &&
        b.month === month
      ) {
        return Promise.resolve(b);
      }
    }
    return Promise.resolve(null);
  }

  create(data: BudgetCreate): Promise<Budget> {
    const now = new Date().toISOString();
    const budget: Budget = {
      id: crypto.randomUUID(),
      userId: data.userId,
      categoryId: data.categoryId,
      amount: data.amount,
      year: data.year,
      month: data.month,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(budget.id, budget);
    return Promise.resolve(budget);
  }

  update(id: string, data: BudgetUpdate): Promise<Budget> {
    const existing = this.store.get(id);
    if (!existing) {return Promise.reject(new Error(`Budget ${id} not found`));}

    const updated: Budget = {
      ...existing,
      ...(data.amount !== undefined && { amount: data.amount }),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }

  deleteByCategoryId(categoryId: string): Promise<void> {
    const idsToDelete: string[] = [];
    for (const [id, budget] of this.store.entries()) {
      if (budget.categoryId === categoryId) {
        idsToDelete.push(id);
      }
    }
    for (const id of idsToDelete) {
      this.store.delete(id);
    }
    return Promise.resolve();
  }

  /** Test helper: reset the store */
  reset(): void {
    this.store.clear();
  }

  /** Test helper: seed a budget with a specific ID */
  seed(budget: Budget): void {
    this.store.set(budget.id, budget);
  }
}
