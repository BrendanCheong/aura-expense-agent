import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppwriteCategoryRepository } from '@/lib/repositories/appwrite/category.repository';
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
const TABLE_ID = APPWRITE_CONFIG.tables.categories;

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    $id: 'cat-1',
    $createdAt: '2026-02-01T00:00:00.000Z',
    $updatedAt: '2026-02-01T00:00:00.000Z',
    $permissions: [],
    $tableId: TABLE_ID,
    $databaseId: DB_ID,
    $sequence: 1,
    user_id: 'user-1',
    name: 'Food & Beverage',
    description: 'Restaurants, cafes, etc.',
    icon: '🍔',
    color: '#ef4444',
    is_default: true,
    sort_order: 1,
    ...overrides,
  };
}

describe('AppwriteCategoryRepository', () => {
  let tablesDb: ReturnType<typeof createMockTablesDb>;
  let repo: AppwriteCategoryRepository;

  beforeEach(() => {
    tablesDb = createMockTablesDb();
    repo = new AppwriteCategoryRepository(tablesDb as never);
  });

  describe('findById', () => {
    it('returns a mapped Category when row exists', async () => {
      tablesDb.getRow.mockResolvedValue(makeRow());

      const result = await repo.findById('cat-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('cat-1');
      expect(result!.name).toBe('Food & Beverage');
      expect(result!.isDefault).toBe(true);
    });

    it('returns null when row does not exist', async () => {
      tablesDb.getRow.mockRejectedValue({ code: 404 });

      const result = await repo.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns categories sorted by sort_order', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 2,
        rows: [
          makeRow({ $id: 'cat-1', sort_order: 1 }),
          makeRow({ $id: 'cat-2', name: 'Transportation', sort_order: 2 }),
        ],
      });

      const result = await repo.findByUserId('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].sortOrder).toBe(1);
    });
  });

  describe('findByUserIdAndName', () => {
    it('returns a Category when name matches (case-insensitive)', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 1,
        rows: [makeRow()],
      });

      const result = await repo.findByUserIdAndName('user-1', 'Food & Beverage');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Food & Beverage');
    });

    it('returns null when no match', async () => {
      tablesDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      const result = await repo.findByUserIdAndName('user-1', 'Nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns a mapped Category', async () => {
      const created = makeRow({ $id: 'new-cat' });
      tablesDb.createRow.mockResolvedValue(created);

      const result = await repo.create({
        userId: 'user-1',
        name: 'Food & Beverage',
        description: 'Restaurants etc.',
        icon: '🍔',
        color: '#ef4444',
        isDefault: true,
        sortOrder: 1,
      });

      expect(tablesDb.createRow).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('new-cat');
    });
  });

  describe('update', () => {
    it('updates and returns a mapped Category', async () => {
      tablesDb.updateRow.mockResolvedValue(makeRow({ name: 'Updated Name' }));

      const result = await repo.update('cat-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('calls deleteRow with correct params', async () => {
      tablesDb.deleteRow.mockResolvedValue({});

      await repo.delete('cat-1');

      expect(tablesDb.deleteRow).toHaveBeenCalledWith({ databaseId: DB_ID, tableId: TABLE_ID, rowId: 'cat-1' });
    });
  });

  describe('seedDefaults', () => {
    it('creates 8 default categories per DATABASE_SCHEMA.md', async () => {
      let callCount = 0;
      tablesDb.createRow.mockImplementation((params: { data: Record<string, unknown>, [key: string]: unknown }) => {
        const data = params.data;
        callCount++;
        return Promise.resolve({
          $id: `cat-${callCount}`,
          $createdAt: '2026-02-01T00:00:00.000Z',
          $updatedAt: '2026-02-01T00:00:00.000Z',
          $permissions: [],
          $tableId: TABLE_ID,
          $databaseId: DB_ID,
          $sequence: callCount,
          ...data,
        });
      });

      const result = await repo.seedDefaults('user-1');

      expect(result).toHaveLength(8);
      expect(tablesDb.createRow).toHaveBeenCalledTimes(8);

      // Verify names match DATABASE_SCHEMA.md
      const names = result.map(c => c.name);
      expect(names).toContain('Food & Beverage');
      expect(names).toContain('Transportation');
      expect(names).toContain('Shopping');
      expect(names).toContain('Entertainment');
      expect(names).toContain('Bills & Utilities');
      expect(names).toContain('Travel');
      expect(names).toContain('Investment');
      expect(names).toContain('Other');
    });
  });
});
