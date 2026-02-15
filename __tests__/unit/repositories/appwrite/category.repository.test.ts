import { describe, it, expect, vi, beforeEach } from 'vitest';

import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
import { Confidence, TransactionSource } from '@/lib/enums';
import { AppwriteTransactionRepository } from '@/lib/repositories/appwrite/transaction.repository';

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
const TABLE_ID = APPWRITE_CONFIG.tables.transactions;

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    $id: 'tx-1',
    $createdAt: '2026-02-01T00:00:00.000Z',
    $updatedAt: '2026-02-01T00:00:00.000Z',
    $permissions: [],
    $tableId: TABLE_ID,
    $databaseId: DB_ID,
    $sequence: 1,
    user_id: 'user-1',
    category_id: 'cat-food',
    amount: 18.5,
    vendor: 'GRAB *GRABFOOD',
    description: '',
    transaction_date: '2026-02-01T12:30:00+08:00',
    resend_email_id: 'email-abc',
    raw_email_subject: 'Transaction alert',
    confidence: 'high',
    source: 'email',
    ...overrides,
  };
}

describe('AppwriteTransactionRepository', () => {
  let tablesDb: ReturnType<typeof createMockTablesDb>;
  let repo: AppwriteTransactionRepository;

  beforeEach(() => {
    tablesDb = createMockTablesDb();
    repo = new AppwriteTransactionRepository(tablesDb as never);
  });

  describe('findById', () => {
    it('returns a mapped Transaction when row exists', async () => {
      tablesDb.getRow.mockResolvedValue(makeRow());

      const result = await repo.findById('tx-1');

      expect(tablesDb.getRow).toHaveBeenCalledWith({
        databaseId: DB_ID,
        tableId: TABLE_ID,
        rowId: 'tx-1',
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('tx-1');
      expect(result!.userId).toBe('user-1');
      expect(result!.amount).toBe(18.5);
    });

    it('returns null when row does not exist', async () => {
      tablesDb.getRow.mockRejectedValue({ code: 404 });

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByResendEmailId', () => {
    it('returns a Transaction when found', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 1,
        rows: [makeRow()],
      });

      const result = await repo.findByResendEmailId('email-abc');

      expect(result).not.toBeNull();
      expect(result!.resendEmailId).toBe('email-abc');
    });

    it('returns null when not found', async () => {
      tablesDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      const result = await repo.findByResendEmailId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a row and returns a mapped Transaction', async () => {
      const created = makeRow({ $id: 'new-tx' });
      tablesDb.createRow.mockResolvedValue(created);

      const result = await repo.create({
        userId: 'user-1',
        categoryId: 'cat-food',
        amount: 18.5,
        vendor: 'GRAB *GRABFOOD',
        description: '',
        transactionDate: '2026-02-01T12:30:00+08:00',
        resendEmailId: 'email-abc',
        rawEmailSubject: 'Transaction alert',
        confidence: Confidence.HIGH,
        source: TransactionSource.EMAIL,
      });

      expect(tablesDb.createRow).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('new-tx');
      expect(result.amount).toBe(18.5);
    });
  });

  describe('update', () => {
    it('updates a row and returns mapped Transaction', async () => {
      const updated = makeRow({ amount: 25.0 });
      tablesDb.updateRow.mockResolvedValue(updated);

      const result = await repo.update('tx-1', { amount: 25.0 });

      expect(tablesDb.updateRow).toHaveBeenCalledTimes(1);
      expect(result.amount).toBe(25.0);
    });
  });

  describe('delete', () => {
    it('calls deleteRow with correct IDs', async () => {
      tablesDb.deleteRow.mockResolvedValue({});

      await repo.delete('tx-1');

      expect(tablesDb.deleteRow).toHaveBeenCalledWith({
        databaseId: DB_ID,
        tableId: TABLE_ID,
        rowId: 'tx-1',
      });
    });
  });

  describe('findByUserId', () => {
    it('returns paginated results', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 1,
        rows: [makeRow()],
      });

      const result = await repo.findByUserId('user-1', {
        page: 1,
        limit: 25,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.hasMore).toBe(false);
    });

    it('builds queries with date filters', async () => {
      tablesDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      await repo.findByUserId('user-1', {
        page: 1,
        limit: 25,
        startDate: '2026-02-01',
        endDate: '2026-03-01',
      });

      const call = tablesDb.listRows.mock.calls[0];
      const args = call[0] as { queries: string[] };
      const queries = args.queries;
      expect(queries.some((q: string) => q.includes('transaction_date'))).toBe(true);
    });
  });

  describe('findByUserAndDateRange', () => {
    it('returns transactions within date range', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 2,
        rows: [makeRow(), makeRow({ $id: 'tx-2' })],
      });

      const result = await repo.findByUserAndDateRange('user-1', '2026-02-01', '2026-03-01');

      expect(result).toHaveLength(2);
    });
  });

  describe('sumByUserCategoryDateRange', () => {
    it('aggregates spending by category', async () => {
      tablesDb.listRows.mockResolvedValue({
        total: 3,
        rows: [
          makeRow({ category_id: 'cat-food', amount: 10 }),
          makeRow({ $id: 'tx-2', category_id: 'cat-food', amount: 20 }),
          makeRow({ $id: 'tx-3', category_id: 'cat-transport', amount: 15 }),
        ],
      });

      const result = await repo.sumByUserCategoryDateRange('user-1', '2026-02-01', '2026-03-01');

      expect(result).toHaveLength(2);
      const foodEntry = result.find((r) => r.categoryId === 'cat-food');
      expect(foodEntry).toBeDefined();
      expect(foodEntry!.totalSpent).toBe(30);
    });
  });
});
