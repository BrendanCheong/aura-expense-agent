import { beforeEach, describe, it, expect } from 'vitest';

import fixtures from '../../fixtures/categories.json';

import type { CategoryCreate } from '@/types/category';

import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';

let repo: InMemoryCategoryRepository;

const seedData: CategoryCreate[] = fixtures.map((cat) => ({
  userId: cat.user_id,
  name: cat.name,
  description: cat.description,
  icon: cat.icon,
  color: cat.color,
  isDefault: cat.is_default,
  sortOrder: cat.sort_order,
}));

beforeEach(async () => {
  repo = new InMemoryCategoryRepository();
  repo.reset();
  for (const cat of seedData) {
    await repo.create(cat);
  }
});

describe('InMemoryCategoryRepository', () => {
  describe('findByUserId', () => {
    it('returns all categories for user', async () => {
      const categories = await repo.findByUserId('test-user-001');
      expect(categories).toHaveLength(8);
    });

    it('returns categories ordered by sort_order', async () => {
      const categories = await repo.findByUserId('test-user-001');
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].sortOrder).toBeGreaterThanOrEqual(categories[i - 1].sortOrder);
      }
    });

    it('returns empty for unknown user', async () => {
      const categories = await repo.findByUserId('unknown-user');
      expect(categories).toHaveLength(0);
    });
  });

  describe('findByUserIdAndName', () => {
    it('finds category by exact name (case-insensitive)', async () => {
      const result = await repo.findByUserIdAndName('test-user-001', 'food & beverage');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Food & Beverage');
    });

    it('returns null for non-existent category name', async () => {
      const result = await repo.findByUserIdAndName('test-user-001', 'Nonexistent Category');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a new category with generated ID', async () => {
      const created = await repo.create({
        userId: 'test-user-001',
        name: 'Subscriptions',
        description: 'Monthly subscriptions',
        icon: '📱',
        color: '#9b59b6',
        isDefault: false,
        sortOrder: 9,
      });
      expect(created.id).toBeTruthy();
      expect(created.name).toBe('Subscriptions');
      expect(created.isDefault).toBe(false);
    });
  });

  describe('update', () => {
    it('updates a category description', async () => {
      const categories = await repo.findByUserId('test-user-001');
      const first = categories[0];

      const updated = await repo.update(first.id, { description: 'Updated description' });
      expect(updated.description).toBe('Updated description');
    });

    it('throws for non-existent category', async () => {
      await expect(repo.update('nonexistent', { name: 'Test' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes a category', async () => {
      const categories = await repo.findByUserId('test-user-001');
      const last = categories[categories.length - 1];

      await repo.delete(last.id);
      const found = await repo.findById(last.id);
      expect(found).toBeNull();
    });
  });

  describe('seedDefaults', () => {
    it('creates default categories for a new user', async () => {
      const defaults = await repo.seedDefaults('new-user-id');
      expect(defaults.length).toBeGreaterThanOrEqual(7);
      expect(defaults.every((c) => c.userId === 'new-user-id')).toBe(true);
      expect(defaults.every((c) => c.isDefault === true)).toBe(true);
    });
  });
});
