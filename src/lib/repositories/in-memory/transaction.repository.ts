import type {
  ITransactionRepository,
  TransactionQueryOptions,
  PaginatedResult,
  CategorySpendingSummary,
} from '../interfaces';
import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';

export class InMemoryTransactionRepository implements ITransactionRepository {
  private store: Map<string, Transaction> = new Map();

  findById(id: string): Promise<Transaction | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByResendEmailId(resendEmailId: string): Promise<Transaction | null> {
    for (const tx of this.store.values()) {
      if (tx.resendEmailId === resendEmailId) {return Promise.resolve(tx);}
    }
    return Promise.resolve(null);
  }

  findByUserId(
    userId: string,
    options: TransactionQueryOptions
  ): Promise<PaginatedResult<Transaction>> {
    let data = Array.from(this.store.values()).filter((tx) => tx.userId === userId);

    if (options.startDate) {
      const startDate = options.startDate;
      data = data.filter((tx) => tx.transactionDate >= startDate);
    }
    if (options.endDate) {
      const endDate = options.endDate;
      data = data.filter((tx) => tx.transactionDate < endDate);
    }
    if (options.categoryId) {data = data.filter((tx) => tx.categoryId === options.categoryId);}
    if (options.source) {data = data.filter((tx) => tx.source === options.source);}

    // Sort — validate sortBy against allowed Transaction keys
    const SORTABLE_FIELDS = new Set<string>([
      'transactionDate',
      'amount',
      'vendor',
      'confidence',
      'createdAt',
      'updatedAt',
    ]);
    const sortBy =
      options.sortBy && SORTABLE_FIELDS.has(options.sortBy) ? options.sortBy : 'transactionDate';
    const sortOrder = options.sortOrder || 'desc';
    data.sort((a, b) => {
      const aVal = String(a[sortBy as keyof Transaction] ?? '');
      const bVal = String(b[sortBy as keyof Transaction] ?? '');
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const total = data.length;
    const start = (options.page - 1) * options.limit;
    const paged = data.slice(start, start + options.limit);

    return Promise.resolve({
      data: paged,
      total,
      page: options.page,
      limit: options.limit,
      hasMore: total > start + options.limit,
    });
  }

  findByUserAndDateRange(userId: string, start: string, end: string): Promise<Transaction[]> {
    return Promise.resolve(
      Array.from(this.store.values()).filter(
        (tx) => tx.userId === userId && tx.transactionDate >= start && tx.transactionDate < end
      )
    );
  }

  findByUserCategoryDateRange(
    userId: string,
    categoryId: string,
    start: string,
    end: string
  ): Promise<Transaction[]> {
    return Promise.resolve(
      Array.from(this.store.values()).filter(
        (tx) =>
          tx.userId === userId &&
          tx.categoryId === categoryId &&
          tx.transactionDate >= start &&
          tx.transactionDate < end
      )
    );
  }

  create(data: TransactionCreate): Promise<Transaction> {
    const now = new Date().toISOString();
    const tx: Transaction = {
      id: crypto.randomUUID(),
      userId: data.userId,
      categoryId: data.categoryId,
      amount: data.amount,
      vendor: data.vendor,
      description: data.description,
      transactionDate: data.transactionDate,
      resendEmailId: data.resendEmailId,
      rawEmailSubject: data.rawEmailSubject,
      confidence: data.confidence,
      source: data.source,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(tx.id, tx);
    return Promise.resolve(tx);
  }

  update(id: string, data: TransactionUpdate): Promise<Transaction> {
    const existing = this.store.get(id);
    if (!existing) {return Promise.reject(new Error(`Transaction ${id} not found`));}

    const updated: Transaction = {
      ...existing,
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.vendor !== undefined && { vendor: data.vendor }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.transactionDate !== undefined && { transactionDate: data.transactionDate }),
      ...(data.confidence !== undefined && { confidence: data.confidence }),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }

  /**
   * Aggregate spending by category for a date range.
   * Note: `categoryName` is left empty — the service layer enriches it
   * by joining with the category repository.
   */
  async sumByUserCategoryDateRange(
    userId: string,
    start: string,
    end: string
  ): Promise<CategorySpendingSummary[]> {
    const transactions = await this.findByUserAndDateRange(userId, start, end);
    const map = new Map<string, CategorySpendingSummary>();
    for (const tx of transactions) {
      const existing = map.get(tx.categoryId) || {
        categoryId: tx.categoryId,
        categoryName: '',
        totalSpent: 0,
      };
      existing.totalSpent += tx.amount;
      map.set(tx.categoryId, existing);
    }
    return Array.from(map.values());
  }

  /** Test helper: reset the store */
  reset(): void {
    this.store.clear();
  }

  /** Test helper: seed a transaction with a specific ID */
  seed(transaction: Transaction): void {
    this.store.set(transaction.id, transaction);
  }
}
