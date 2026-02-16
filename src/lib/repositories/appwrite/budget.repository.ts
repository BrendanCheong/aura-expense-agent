import { ID, Query, type TablesDB } from 'node-appwrite';

import type { IBudgetRepository } from '../interfaces';
import type { BudgetRow } from '@/types/appwrite/rows';
import type { Budget, BudgetCreate, BudgetUpdate } from '@/types/budget';

import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
import { mapRowToBudget, mapBudgetToRow, mapBudgetUpdateToRow } from '@/lib/appwrite/mappers';

const DB_ID = APPWRITE_CONFIG.databaseId;
const TABLE_ID = APPWRITE_CONFIG.tables.budgets;

export class AppwriteBudgetRepository implements IBudgetRepository {
  constructor(private readonly tablesDb: TablesDB) {}

  async findById(id: string): Promise<Budget | null> {
    try {
      const row = await this.tablesDb.getRow<BudgetRow>({
        databaseId: DB_ID,
        tableId: TABLE_ID,
        rowId: id,
      });
      return mapRowToBudget(row);
    } catch (err: unknown) {
      if (this.isNotFound(err)) {return null;}
      throw err;
    }
  }

  async findByUserAndPeriod(userId: string, year: number, month: number): Promise<Budget[]> {
    const result = await this.tablesDb.listRows<BudgetRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [
        Query.equal('user_id', userId),
        Query.equal('year', year),
        Query.equal('month', month),
        Query.limit(100),
      ],
    });
    return result.rows.map(mapRowToBudget);
  }

  async findByUserCategoryPeriod(
    userId: string,
    categoryId: string,
    year: number,
    month: number
  ): Promise<Budget | null> {
    const result = await this.tablesDb.listRows<BudgetRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [
        Query.equal('user_id', userId),
        Query.equal('category_id', categoryId),
        Query.equal('year', year),
        Query.equal('month', month),
        Query.limit(1),
      ],
    });
    if (result.rows.length === 0) {return null;}
    return mapRowToBudget(result.rows[0]);
  }

  async create(data: BudgetCreate): Promise<Budget> {
    const rowData = mapBudgetToRow(data);
    const row = await this.tablesDb.createRow<BudgetRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      rowId: ID.unique(),
      data: rowData,
    });
    return mapRowToBudget(row);
  }

  async update(id: string, data: BudgetUpdate): Promise<Budget> {
    const rowData = mapBudgetUpdateToRow(data);
    const row = await this.tablesDb.updateRow<BudgetRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      rowId: id,
      data: rowData,
    });
    return mapRowToBudget(row);
  }

  async delete(id: string): Promise<void> {
    await this.tablesDb.deleteRow({ databaseId: DB_ID, tableId: TABLE_ID, rowId: id });
  }

  async deleteByCategoryId(categoryId: string): Promise<void> {
    const result = await this.tablesDb.listRows<BudgetRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('category_id', categoryId), Query.limit(5000)],
    });

    for (const row of result.rows) {
      await this.tablesDb.deleteRow({ databaseId: DB_ID, tableId: TABLE_ID, rowId: row.$id });
    }
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
