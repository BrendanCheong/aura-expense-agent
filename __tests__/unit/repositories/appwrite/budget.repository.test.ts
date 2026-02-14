import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppwriteBudgetRepository } from '@/lib/repositories/appwrite/budget.repository';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';

function createMockTablesDb() {
  return {
    listRows: vi.fn(),
    createRow: vi.fn(),
    getRow: vi.fn(),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
  };
}

const DB_ID = APPWRITE_CONFIG.databaseId;
const TABLE_ID = APPWRITE_CONFIG.tables.budgets;

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    $id: 'bgt-1',
    $createdAt: '2026-02-01T00:00:00.000Z',
    $updatedAt: '2026-02-01T00:00:00.000Z',
    $permissions: [],
    $tableId: TABLE_ID,
    $databaseId: DB_ID,
    $sequence: 1,
    user_id: 'user-1',
    category_id: 'cat-food',
    amount: 400.00,
    year: 2026,
    month: 2,
    ...overrides,
  };
}

describe('AppwriteBudgetRepository', () => {
  let tablesDb: ReturnType<typeof createMockTablesDb>;
  let repo: AppwriteBudgetRepository;

  beforeEach(() => {
    tablesDb = createMockTablesDb();
    repo = new AppwriteBudgetRepository(tablesDb as never);
  });

  describe('findById', () => {
    it('returns a mapped Budget when row exists', async () => {
      tablesDb.getRow.mockResolvedValue(makeRow());

      const result = await repo.findById('bgt-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('bgt-1');
      expect(result!.amount).toBe(400.00);
      expect(result!.year).toBe(2026);
      expect(result!.month).toBe(2);
    });

    it('returns null when not found', async () => {
      tablesDb.getRow.mockRejectedValue({ code: 404 });
      const result = await repo.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByUserAndPeriod', () => {
    it('returns budgets for a given period', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 2,
        rows: [makeRow(), makeRow({ $id: 'bgt-2', category_id: 'cat-transport' })],
      });

      const result = await repo.findByUserAndPeriod('user-1', 2026, 2);

      expect(result).toHaveLength(2);
    });
  });

  describe('findByUserCategoryPeriod', () => {
    it('returns a single budget for category+period', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 1,
        rows: [makeRow()],
      });

      const result = await repo.findByUserCategoryPeriod('user-1', 'cat-food', 2026, 2);

      expect(result).not.toBeNull();
      expect(result!.categoryId).toBe('cat-food');
    });

    it('returns null when no budget exists', async () => {
      tablesDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      const result = await repo.findByUserCategoryPeriod('user-1', 'cat-food', 2026, 3);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns a mapped Budget', async () => {
      tablesDb.createRow.mockResolvedValue(makeRow({ $id: 'new-bgt' }));

      const result = await repo.create({
        userId: 'user-1',
        categoryId: 'cat-food',
        amount: 400.00,
        year: 2026,
        month: 2,
      });

      expect(result.id).toBe('new-bgt');
      expect(tablesDb.createRow).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('updates amount and returns mapped Budget', async () => {
      tablesDb.updateRow.mockResolvedValue(makeRow({ amount: 500.00 }));

      const result = await repo.update('bgt-1', { amount: 500.00 });

      expect(result.amount).toBe(500.00);
    });
  });

  describe('delete', () => {
    it('calls deleteRow', async () => {
      tablesDb.deleteRow.mockResolvedValue({});

      await repo.delete('bgt-1');

      expect(tablesDb.deleteRow).toHaveBeenCalledWith(DB_ID, TABLE_ID, 'bgt-1');
    });
  });

  describe('deleteByCategoryId', () => {
    it('deletes all budgets for a category', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 2,
        rows: [makeRow(), makeRow({ $id: 'bgt-2' })],
      });
      tablesDb.deleteRow.mockResolvedValue({});

      await repo.deleteByCategoryId('cat-food');

      expect(tablesDb.deleteRow).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no budgets exist for category', async () => {
      tablesDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      await repo.deleteByCategoryId('cat-nonexistent');

      expect(tablesDb.deleteRow).not.toHaveBeenCalled();
    });
  });
});
