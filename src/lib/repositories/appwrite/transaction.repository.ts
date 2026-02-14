import type { TablesDB } from 'node-appwrite';
import { ID, Query } from 'node-appwrite';
import type {
  ITransactionRepository,
  TransactionQueryOptions,
  PaginatedResult,
  CategorySpendingSummary,
} from '../interfaces';
import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
import {
  mapRowToTransaction,
  mapTransactionToRow,
  mapTransactionUpdateToRow,
} from '@/lib/appwrite/mappers';

const DB_ID = APPWRITE_CONFIG.databaseId;
const TABLE_ID = APPWRITE_CONFIG.tables.transactions;

export class AppwriteTransactionRepository implements ITransactionRepository {
  constructor(private readonly tablesDb: TablesDB) {}

  async findById(id: string): Promise<Transaction | null> {
    try {
      const row = await this.tablesDb.getRow(DB_ID, TABLE_ID, id);
      return mapRowToTransaction(row);
    } catch (err: unknown) {
      if (this.isNotFound(err)) return null;
      throw err;
    }
  }

  async findByResendEmailId(resendEmailId: string): Promise<Transaction | null> {
    const result = await this.tablesDb.listRows(DB_ID, TABLE_ID, [
      Query.equal('resend_email_id', resendEmailId),
      Query.limit(1),
    ]);
    if (result.rows.length === 0) return null;
    return mapRowToTransaction(result.rows[0]);
  }

  async findByUserId(
    userId: string,
    options: TransactionQueryOptions,
  ): Promise<PaginatedResult<Transaction>> {
    const queries: string[] = [
      Query.equal('user_id', userId),
    ];

    if (options.startDate) {
      queries.push(Query.greaterThanEqual('transaction_date', options.startDate));
    }
    if (options.endDate) {
      queries.push(Query.lessThan('transaction_date', options.endDate));
    }
    if (options.categoryId) {
      queries.push(Query.equal('category_id', options.categoryId));
    }
    if (options.source) {
      queries.push(Query.equal('source', options.source));
    }

    const sortField = options.sortBy === 'amount' ? 'amount' : 'transaction_date';
    if (options.sortOrder === 'asc') {
      queries.push(Query.orderAsc(sortField));
    } else {
      queries.push(Query.orderDesc(sortField));
    }

    queries.push(Query.limit(options.limit));
    queries.push(Query.offset((options.page - 1) * options.limit));

    const result = await this.tablesDb.listRows(DB_ID, TABLE_ID, queries);

    return {
      data: result.rows.map(mapRowToTransaction),
      total: result.total,
      page: options.page,
      limit: options.limit,
      hasMore: result.total > options.page * options.limit,
    };
  }

  async findByUserAndDateRange(
    userId: string,
    start: string,
    end: string,
  ): Promise<Transaction[]> {
    const result = await this.tablesDb.listRows(DB_ID, TABLE_ID, [
      Query.equal('user_id', userId),
      Query.greaterThanEqual('transaction_date', start),
      Query.lessThan('transaction_date', end),
      Query.limit(5000),
    ]);
    return result.rows.map(mapRowToTransaction);
  }

  async findByUserCategoryDateRange(
    userId: string,
    categoryId: string,
    start: string,
    end: string,
  ): Promise<Transaction[]> {
    const result = await this.tablesDb.listRows(DB_ID, TABLE_ID, [
      Query.equal('user_id', userId),
      Query.equal('category_id', categoryId),
      Query.greaterThanEqual('transaction_date', start),
      Query.lessThan('transaction_date', end),
      Query.limit(5000),
    ]);
    return result.rows.map(mapRowToTransaction);
  }

  async create(data: TransactionCreate): Promise<Transaction> {
    const rowData = mapTransactionToRow(data);
    const row = await this.tablesDb.createRow(DB_ID, TABLE_ID, ID.unique(), rowData);
    return mapRowToTransaction(row);
  }

  async update(id: string, data: TransactionUpdate): Promise<Transaction> {
    const rowData = mapTransactionUpdateToRow(data);
    const row = await this.tablesDb.updateRow(DB_ID, TABLE_ID, id, rowData);
    return mapRowToTransaction(row);
  }

  async delete(id: string): Promise<void> {
    await this.tablesDb.deleteRow(DB_ID, TABLE_ID, id);
  }

  async sumByUserCategoryDateRange(
    userId: string,
    start: string,
    end: string,
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

  private isNotFound(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 404
    );
  }
}
