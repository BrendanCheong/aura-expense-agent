import { ID, Query } from 'node-appwrite';

import type { ICategoryRepository } from '../interfaces';
import type { CategoryRow } from '@/types/appwrite/rows';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import type { TablesDB } from 'node-appwrite';

import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
import { mapRowToCategory, mapCategoryToRow, mapCategoryUpdateToRow } from '@/lib/appwrite/mappers';

const DB_ID = APPWRITE_CONFIG.databaseId;
const TABLE_ID = APPWRITE_CONFIG.tables.categories;

/**
 * Default categories per DATABASE_SCHEMA.md.
 * Seeded for each new user on first login.
 */
const DEFAULT_CATEGORIES = [
  {
    name: 'Food & Beverage',
    description:
      'Restaurants, cafes, coffee shops, bubble tea, hawker centres, food delivery (GrabFood, Foodpanda, Deliveroo)',
    icon: '🍔',
    color: '#ef4444',
  },
  {
    name: 'Transportation',
    description:
      'Public transit (MRT, bus), ride-hailing (Grab, Gojek), fuel, parking, ERP charges',
    icon: '🚗',
    color: '#f97316',
  },
  {
    name: 'Shopping',
    description:
      'Retail purchases, clothing, electronics, online shopping (Shopee, Lazada, Amazon)',
    icon: '🛍️',
    color: '#eab308',
  },
  {
    name: 'Entertainment',
    description: 'Movies, concerts, streaming subscriptions (Netflix, Spotify), games, nightlife',
    icon: '🎬',
    color: '#22c55e',
  },
  {
    name: 'Bills & Utilities',
    description:
      'Electricity, water, gas, internet, phone bill, insurance premiums, loan repayments',
    icon: '💡',
    color: '#3b82f6',
  },
  {
    name: 'Travel',
    description: 'Flights, hotels, travel insurance, overseas purchases, airport transfers',
    icon: '✈️',
    color: '#8b5cf6',
  },
  {
    name: 'Investment',
    description:
      'Stocks, crypto, ETFs, robo-advisors (StashAway, Syfe, Endowus), fixed deposits, bonds',
    icon: '📈',
    color: '#a78bfa',
  },
  {
    name: 'Other',
    description: "Anything that doesn't fit — miscellaneous or one-off expenses",
    icon: '📦',
    color: '#6b7280',
  },
];

export class AppwriteCategoryRepository implements ICategoryRepository {
  constructor(private readonly tablesDb: TablesDB) {}

  async findById(id: string): Promise<Category | null> {
    try {
      const row = await this.tablesDb.getRow<CategoryRow>({
        databaseId: DB_ID,
        tableId: TABLE_ID,
        rowId: id,
      });
      return mapRowToCategory(row);
    } catch (err: unknown) {
      if (this.isNotFound(err)) {return null;}
      throw err;
    }
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const result = await this.tablesDb.listRows<CategoryRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('user_id', userId), Query.orderAsc('sort_order'), Query.limit(100)],
    });
    return result.rows.map(mapRowToCategory);
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Category | null> {
    const result = await this.tablesDb.listRows<CategoryRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('user_id', userId), Query.equal('name', name), Query.limit(1)],
    });
    if (result.rows.length === 0) {return null;}
    return mapRowToCategory(result.rows[0]);
  }

  async create(data: CategoryCreate): Promise<Category> {
    const rowData = mapCategoryToRow(data);
    const row = await this.tablesDb.createRow<CategoryRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      rowId: ID.unique(),
      data: rowData,
    });
    return mapRowToCategory(row);
  }

  async update(id: string, data: CategoryUpdate): Promise<Category> {
    const rowData = mapCategoryUpdateToRow(data);
    const row = await this.tablesDb.updateRow<CategoryRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      rowId: id,
      data: rowData,
    });
    return mapRowToCategory(row);
  }

  async delete(id: string): Promise<void> {
    await this.tablesDb.deleteRow({ databaseId: DB_ID, tableId: TABLE_ID, rowId: id });
  }

  async seedDefaults(userId: string): Promise<Category[]> {
    const categories: Category[] = [];

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const def = DEFAULT_CATEGORIES[i];
      const category = await this.create({
        userId,
        name: def.name,
        description: def.description,
        icon: def.icon,
        color: def.color,
        isDefault: true,
        sortOrder: i + 1,
      });
      categories.push(category);
    }

    return categories;
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
