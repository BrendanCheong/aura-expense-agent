import { describe, it, expect, beforeEach, vi } from 'vitest';

import { OAuthProvider, BudgetMode } from '@/lib/enums';
import { AppwriteUserRepository } from '@/lib/repositories/appwrite/user.repository';

function createMockTablesDb(): {
  getRow: ReturnType<typeof vi.fn>;
  listRows: ReturnType<typeof vi.fn>;
  createRow: ReturnType<typeof vi.fn>;
  updateRow: ReturnType<typeof vi.fn>;
} {
  return {
    getRow: vi.fn(),
    listRows: vi.fn(),
    createRow: vi.fn(),
    updateRow: vi.fn(),
  };
}

const TEST_DB = 'aura_expense_db_test';

describe('AppwriteUserRepository', () => {
  let repo: AppwriteUserRepository;
  let mockDb: ReturnType<typeof createMockTablesDb>;

  beforeEach(() => {
    mockDb = createMockTablesDb();
    repo = new AppwriteUserRepository(mockDb as never);
  });

  describe('findById', () => {
    it('returns mapped user when found', async () => {
      mockDb.getRow.mockResolvedValue({
        $id: 'user-1',
        $createdAt: '2026-01-01T00:00:00.000Z',
        $updatedAt: '2026-01-01T00:00:00.000Z',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/a.png',
        inbound_email: 'user-user-1@inbound.aura.app',
        oauth_provider: 'google',
        monthly_salary: 6000,
        budget_mode: 'direct',
      });

      const user = await repo.findById('user-1');
      expect(user).not.toBeNull();
      expect(user!.id).toBe('user-1');
      expect(user!.email).toBe('test@example.com');
      expect(user!.avatarUrl).toBe('https://example.com/a.png');
    });

    it('returns null when not found', async () => {
      mockDb.getRow.mockRejectedValue({ code: 404 });

      const user = await repo.findById('missing');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      mockDb.listRows.mockResolvedValue({
        total: 1,
        rows: [
          {
            $id: 'user-1',
            $createdAt: '2026-01-01T00:00:00.000Z',
            $updatedAt: '2026-01-01T00:00:00.000Z',
            email: 'test@example.com',
            name: 'Test',
            avatar_url: '',
            inbound_email: '',
            oauth_provider: 'google',
            monthly_salary: 0,
            budget_mode: 'direct',
          },
        ],
      });

      const user = await repo.findByEmail('test@example.com');
      expect(user).not.toBeNull();
      expect(user!.email).toBe('test@example.com');
    });

    it('returns null when no match', async () => {
      mockDb.listRows.mockResolvedValue({ total: 0, rows: [] });

      const user = await repo.findByEmail('nobody@example.com');
      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('creates user with provided id', async () => {
      mockDb.createRow.mockResolvedValue({
        $id: 'user-1',
        $createdAt: '2026-01-01T00:00:00.000Z',
        $updatedAt: '2026-01-01T00:00:00.000Z',
        email: 'new@example.com',
        name: 'New User',
        avatar_url: 'https://example.com/a.png',
        inbound_email: 'user-user-1@inbound.aura.app',
        oauth_provider: 'google',
        monthly_salary: 0,
        budget_mode: 'direct',
      });

      const user = await repo.create('user-1', {
        email: 'new@example.com',
        name: 'New User',
        avatarUrl: 'https://example.com/a.png',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      expect(user.id).toBe('user-1');
      expect(mockDb.createRow).toHaveBeenCalledWith({
        databaseId: TEST_DB,
        tableId: expect.any(String),
        rowId: 'user-1',
        data: expect.objectContaining({
          email: 'new@example.com',
          name: 'New User',
        }),
      });
    });
  });

  describe('update', () => {
    it('updates user fields', async () => {
      mockDb.updateRow.mockResolvedValue({
        $id: 'user-1',
        $createdAt: '2026-01-01T00:00:00.000Z',
        $updatedAt: '2026-02-01T00:00:00.000Z',
        email: 'test@example.com',
        name: 'Updated Name',
        avatar_url: '',
        inbound_email: '',
        oauth_provider: 'google',
        monthly_salary: 6000,
        budget_mode: 'percentage',
      });

      const user = await repo.update('user-1', {
        name: 'Updated Name',
        monthlySalary: 6000,
        budgetMode: BudgetMode.PERCENTAGE,
      });

      expect(user.name).toBe('Updated Name');
      expect(user.monthlySalary).toBe(6000);
      expect(mockDb.updateRow).toHaveBeenCalled();
    });
  });
});
