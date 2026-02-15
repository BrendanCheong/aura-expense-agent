import { describe, it, expect } from 'vitest';

import {
  mapRowToTransaction,
  mapRowToCategory,
  mapRowToBudget,
  mapRowToVendorCacheEntry,
  mapTransactionToRow,
  mapCategoryToRow,
  mapBudgetToRow,
} from '@/lib/appwrite/mappers';
import { Confidence, TransactionSource } from '@/lib/enums';

describe('Appwrite Row Mappers', () => {
  describe('mapRowToTransaction', () => {
    it('maps an Appwrite row to a Transaction domain object', () => {
      const row = {
        $id: 'tx-123',
        $createdAt: '2026-02-01T00:00:00.000Z',
        $updatedAt: '2026-02-01T00:00:00.000Z',
        $permissions: [],
        $tableId: 'transactions',
        $databaseId: 'aura',
        $sequence: 1,
        user_id: 'user-1',
        category_id: 'cat-food',
        amount: 18.5,
        vendor: 'GRAB *GRABFOOD',
        description: 'Lunch delivery',
        transaction_date: '2026-02-01T12:30:00+08:00',
        resend_email_id: 'email-abc',
        raw_email_subject: 'Transaction alert: GRAB',
        confidence: 'high',
        source: 'email',
      };

      const result = mapRowToTransaction(row);

      expect(result).toEqual({
        id: 'tx-123',
        userId: 'user-1',
        categoryId: 'cat-food',
        amount: 18.5,
        vendor: 'GRAB *GRABFOOD',
        description: 'Lunch delivery',
        transactionDate: '2026-02-01T12:30:00+08:00',
        resendEmailId: 'email-abc',
        rawEmailSubject: 'Transaction alert: GRAB',
        confidence: Confidence.HIGH,
        source: TransactionSource.EMAIL,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      });
    });

    it('maps null resend_email_id correctly', () => {
      const row = {
        $id: 'tx-456',
        $createdAt: '2026-02-01T00:00:00.000Z',
        $updatedAt: '2026-02-01T00:00:00.000Z',
        $permissions: [],
        $tableId: 'transactions',
        $databaseId: 'aura',
        $sequence: 2,
        user_id: 'user-1',
        category_id: 'cat-food',
        amount: 10.0,
        vendor: 'Test',
        description: '',
        transaction_date: '2026-02-01T00:00:00.000Z',
        resend_email_id: null,
        raw_email_subject: '',
        confidence: 'high',
        source: 'manual',
      };

      const result = mapRowToTransaction(row);
      expect(result.resendEmailId).toBeNull();
      expect(result.source).toBe(TransactionSource.MANUAL);
    });
  });

  describe('mapRowToCategory', () => {
    it('maps an Appwrite row to a Category domain object', () => {
      const row = {
        $id: 'cat-food',
        $createdAt: '2026-02-01T00:00:00.000Z',
        $updatedAt: '2026-02-01T00:00:00.000Z',
        $permissions: [],
        $tableId: 'categories',
        $databaseId: 'aura',
        $sequence: 1,
        user_id: 'user-1',
        name: 'Food & Beverage',
        description: 'Restaurants, cafes, etc.',
        icon: '🍔',
        color: '#ef4444',
        is_default: true,
        sort_order: 1,
      };

      const result = mapRowToCategory(row);

      expect(result).toEqual({
        id: 'cat-food',
        userId: 'user-1',
        name: 'Food & Beverage',
        description: 'Restaurants, cafes, etc.',
        icon: '🍔',
        color: '#ef4444',
        isDefault: true,
        sortOrder: 1,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      });
    });
  });

  describe('mapRowToBudget', () => {
    it('maps an Appwrite row to a Budget domain object', () => {
      const row = {
        $id: 'bgt-1',
        $createdAt: '2026-02-01T00:00:00.000Z',
        $updatedAt: '2026-02-01T00:00:00.000Z',
        $permissions: [],
        $tableId: 'budgets',
        $databaseId: 'aura',
        $sequence: 1,
        user_id: 'user-1',
        category_id: 'cat-food',
        amount: 400.0,
        year: 2026,
        month: 2,
      };

      const result = mapRowToBudget(row);

      expect(result).toEqual({
        id: 'bgt-1',
        userId: 'user-1',
        categoryId: 'cat-food',
        amount: 400.0,
        year: 2026,
        month: 2,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      });
    });
  });

  describe('mapRowToVendorCacheEntry', () => {
    it('maps an Appwrite row to a VendorCacheEntry domain object', () => {
      const row = {
        $id: 'vc-1',
        $createdAt: '2026-02-01T00:00:00.000Z',
        $updatedAt: '2026-02-01T00:00:00.000Z',
        $permissions: [],
        $tableId: 'vendor_cache',
        $databaseId: 'aura',
        $sequence: 1,
        user_id: 'user-1',
        vendor_name: 'GRAB *GRABFOOD',
        category_id: 'cat-food',
        hit_count: 15,
      };

      const result = mapRowToVendorCacheEntry(row);

      expect(result).toEqual({
        id: 'vc-1',
        userId: 'user-1',
        vendorName: 'GRAB *GRABFOOD',
        categoryId: 'cat-food',
        hitCount: 15,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      });
    });
  });

  describe('mapTransactionToRow', () => {
    it('maps TransactionCreate to Appwrite row data', () => {
      const data = {
        userId: 'user-1',
        categoryId: 'cat-food',
        amount: 18.5,
        vendor: 'GRAB *GRABFOOD',
        description: 'Lunch',
        transactionDate: '2026-02-01T12:30:00+08:00',
        resendEmailId: 'email-abc',
        rawEmailSubject: 'Transaction alert',
        confidence: Confidence.HIGH,
        source: TransactionSource.EMAIL,
      };

      const result = mapTransactionToRow(data);

      expect(result).toEqual({
        user_id: 'user-1',
        category_id: 'cat-food',
        amount: 18.5,
        vendor: 'GRAB *GRABFOOD',
        description: 'Lunch',
        transaction_date: '2026-02-01T12:30:00+08:00',
        resend_email_id: 'email-abc',
        raw_email_subject: 'Transaction alert',
        confidence: 'high',
        source: 'email',
      });
    });
  });

  describe('mapCategoryToRow', () => {
    it('maps CategoryCreate to Appwrite row data', () => {
      const data = {
        userId: 'user-1',
        name: 'Food & Beverage',
        description: 'Restaurants etc.',
        icon: '🍔',
        color: '#ef4444',
        isDefault: true,
        sortOrder: 1,
      };

      const result = mapCategoryToRow(data);

      expect(result).toEqual({
        user_id: 'user-1',
        name: 'Food & Beverage',
        description: 'Restaurants etc.',
        icon: '🍔',
        color: '#ef4444',
        is_default: true,
        sort_order: 1,
      });
    });
  });

  describe('mapBudgetToRow', () => {
    it('maps BudgetCreate to Appwrite row data', () => {
      const data = {
        userId: 'user-1',
        categoryId: 'cat-food',
        amount: 400.0,
        year: 2026,
        month: 2,
      };

      const result = mapBudgetToRow(data);

      expect(result).toEqual({
        user_id: 'user-1',
        category_id: 'cat-food',
        amount: 400.0,
        year: 2026,
        month: 2,
      });
    });
  });
});
