import { ID, Query } from 'node-appwrite';

import type { IVendorCacheRepository } from '../interfaces';
import type { VendorCacheRow } from '@/types/appwrite/rows';
import type { VendorCacheEntry } from '@/types/vendor-cache';
import type { TablesDB } from 'node-appwrite';

import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
import { mapRowToVendorCacheEntry } from '@/lib/appwrite/mappers';
import { normalizeVendorName } from '@/lib/utils/vendor';

const DB_ID = APPWRITE_CONFIG.databaseId;
const TABLE_ID = APPWRITE_CONFIG.tables.vendorCache;

export class AppwriteVendorCacheRepository implements IVendorCacheRepository {
  constructor(private readonly tablesDb: TablesDB) {}

  async findByUserAndVendor(userId: string, vendorName: string): Promise<VendorCacheEntry | null> {
    const normalized = normalizeVendorName(vendorName);
    const result = await this.tablesDb.listRows<VendorCacheRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [
        Query.equal('user_id', userId),
        Query.equal('vendor_name', normalized),
        Query.limit(1),
      ],
    });

    if (result.rows.length === 0) {return null;}
    return mapRowToVendorCacheEntry(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<VendorCacheEntry[]> {
    const result = await this.tablesDb.listRows<VendorCacheRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('user_id', userId), Query.limit(5000)],
    });
    return result.rows.map(mapRowToVendorCacheEntry);
  }

  async create(userId: string, vendorName: string, categoryId: string): Promise<VendorCacheEntry> {
    const normalized = normalizeVendorName(vendorName);
    const row = await this.tablesDb.createRow<VendorCacheRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      rowId: ID.unique(),
      data: {
        user_id: userId,
        vendor_name: normalized,
        category_id: categoryId,
        hit_count: 1,
      },
    });
    return mapRowToVendorCacheEntry(row);
  }

  async updateCategoryId(id: string, categoryId: string): Promise<void> {
    await this.tablesDb.updateRow({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      rowId: id,
      data: {
        category_id: categoryId,
      },
    });
  }

  async incrementHitCount(id: string, _currentCount: number): Promise<void> {
    await this.tablesDb.incrementRowColumn({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      rowId: id,
      column: 'hit_count',
      value: 1,
    });
  }

  async deleteByCategoryId(categoryId: string): Promise<void> {
    const result = await this.tablesDb.listRows<VendorCacheRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('category_id', categoryId), Query.limit(5000)],
    });

    for (const row of result.rows) {
      await this.tablesDb.deleteRow({
        databaseId: DB_ID,
        tableId: TABLE_ID,
        rowId: row.$id,
      });
    }
  }
}
