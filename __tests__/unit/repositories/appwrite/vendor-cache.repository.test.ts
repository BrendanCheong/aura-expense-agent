import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppwriteVendorCacheRepository } from '@/lib/repositories/appwrite/vendor-cache.repository';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';

function createMockTablesDb() {
  return {
    listRows: vi.fn(),
    createRow: vi.fn(),
    getRow: vi.fn(),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
    incrementRowColumn: vi.fn(),
  };
}

const DB_ID = APPWRITE_CONFIG.databaseId;
const TABLE_ID = APPWRITE_CONFIG.tables.vendorCache;

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    $id: 'vc-1',
    $createdAt: '2026-02-01T00:00:00.000Z',
    $updatedAt: '2026-02-01T00:00:00.000Z',
    $permissions: [],
    $tableId: TABLE_ID,
    $databaseId: DB_ID,
    $sequence: 1,
    user_id: 'user-1',
    vendor_name: 'GRAB *GRABFOOD',
    category_id: 'cat-food',
    hit_count: 15,
    ...overrides,
  };
}

describe('AppwriteVendorCacheRepository', () => {
  let tablesDb: ReturnType<typeof createMockTablesDb>;
  let repo: AppwriteVendorCacheRepository;

  beforeEach(() => {
    tablesDb = createMockTablesDb();
    repo = new AppwriteVendorCacheRepository(tablesDb as never);
  });

  describe('findByUserAndVendor', () => {
    it('returns a VendorCacheEntry when found', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 1,
        rows: [makeRow()],
      });

      const result = await repo.findByUserAndVendor('user-1', 'grab *grabfood');

      expect(result).not.toBeNull();
      expect(result!.vendorName).toBe('GRAB *GRABFOOD');
      expect(result!.hitCount).toBe(15);
    });

    it('normalizes vendor name before querying', async () => {
      tablesDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      await repo.findByUserAndVendor('user-1', '  grab *grabfood  ');

      const call = tablesDb.listRows.mock.calls[0];
      const queries = call[2] as string[];
      // Should contain normalized name (uppercased, trimmed)
      expect(queries.some((q: string) => q.includes('GRAB *GRABFOOD'))).toBe(true);
    });

    it('returns null when not found', async () => {
      tablesDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      const result = await repo.findByUserAndVendor('user-1', 'UNKNOWN');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns all cache entries for a user', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 2,
        rows: [makeRow(), makeRow({ $id: 'vc-2', vendor_name: 'NETFLIX.COM' })],
      });

      const result = await repo.findByUserId('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('creates and returns a VendorCacheEntry with normalized name', async () => {
      tablesDb.createRow.mockResolvedValue(makeRow({ $id: 'new-vc', vendor_name: 'GRAB *GRABFOOD' }));

      const result = await repo.create('user-1', 'grab *grabfood', 'cat-food');

      expect(result.id).toBe('new-vc');
      expect(tablesDb.createRow).toHaveBeenCalledTimes(1);

      // Verify the data passed to createRow has normalized vendor name
      const callArgs = tablesDb.createRow.mock.calls[0];
      const data = callArgs[3] as Record<string, unknown>;
      expect(data.vendor_name).toBe('GRAB *GRABFOOD');
    });
  });

  describe('updateCategoryId', () => {
    it('updates category_id on the row', async () => {
      tablesDb.updateRow.mockResolvedValue(makeRow({ category_id: 'cat-transport' }));

      await repo.updateCategoryId('vc-1', 'cat-transport');

      expect(tablesDb.updateRow).toHaveBeenCalledWith(
        DB_ID, TABLE_ID, 'vc-1',
        { category_id: 'cat-transport' },
      );
    });
  });

  describe('incrementHitCount', () => {
    it('uses incrementRowColumn to increment hit_count', async () => {
      tablesDb.incrementRowColumn.mockResolvedValue(makeRow({ hit_count: 16 }));

      await repo.incrementHitCount('vc-1', 15);

      expect(tablesDb.incrementRowColumn).toHaveBeenCalledWith(
        DB_ID, TABLE_ID, 'vc-1', 'hit_count', 1,
      );
    });
  });

  describe('deleteByCategoryId', () => {
    it('deletes all entries for a category', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 2,
        rows: [makeRow(), makeRow({ $id: 'vc-2' })],
      });
      tablesDb.deleteRow.mockResolvedValue({});

      await repo.deleteByCategoryId('cat-food');

      expect(tablesDb.deleteRow).toHaveBeenCalledTimes(2);
    });
  });
});
