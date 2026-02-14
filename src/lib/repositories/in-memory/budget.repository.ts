import type { IBudgetRepository } from '../interfaces';
import type { Budget, BudgetCreate, BudgetUpdate } from '@/types/budget';

export class InMemoryBudgetRepository implements IBudgetRepository {
  private store: Map<string, Budget> = new Map();

  async findById(id: string): Promise<Budget | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserAndPeriod(userId: string, year: number, month: number): Promise<Budget[]> {
    return Array.from(this.store.values()).filter(
      b => b.userId === userId && b.year === year && b.month === month,
    );
  }

  async findByUserCategoryPeriod(
    userId: string,
    categoryId: string,
    year: number,
    month: number,
  ): Promise<Budget | null> {
    for (const b of this.store.values()) {
      if (
        b.userId === userId &&
        b.categoryId === categoryId &&
        b.year === year &&
        b.month === month
      ) {
        return b;
      }
    }
    return null;
  }

  async create(data: BudgetCreate): Promise<Budget> {
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
    return budget;
  }

  async update(id: string, data: BudgetUpdate): Promise<Budget> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Budget ${id} not found`);

    const updated: Budget = {
      ...existing,
      ...(data.amount !== undefined && { amount: data.amount }),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async deleteByCategoryId(categoryId: string): Promise<void> {
    const idsToDelete: string[] = [];
    for (const [id, budget] of this.store.entries()) {
      if (budget.categoryId === categoryId) {
        idsToDelete.push(id);
      }
    }
    for (const id of idsToDelete) {
      this.store.delete(id);
    }
  }

  /** Test helper: reset the store */
  reset(): void {
    this.store.clear();
  }
}
