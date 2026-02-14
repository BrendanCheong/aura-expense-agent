import { beforeEach, describe, it, expect } from 'vitest';
import { InMemoryVendorCacheRepository } from '@/lib/repositories/in-memory/vendor-cache.repository';
import fixtures from '../../fixtures/vendor-cache.json';

let repo: InMemoryVendorCacheRepository;

beforeEach(async () => {
  repo = new InMemoryVendorCacheRepository();
  repo.reset();
  for (const vc of fixtures) {
    await repo.create(vc.user_id, vc.vendor_name, vc.category_id);
  }
});

describe('InMemoryVendorCacheRepository', () => {
  describe('findByUserAndVendor', () => {
    it('finds a cached vendor — cache hit', async () => {
      const result = await repo.findByUserAndVendor('test-user-001', 'GRAB *GRABFOOD');
      expect(result).not.toBeNull();
      expect(result!.categoryId).toBe('cat-food');
    });

    it('returns null for unknown vendor — cache miss', async () => {
      const result = await repo.findByUserAndVendor('test-user-001', 'UNKNOWN VENDOR');
      expect(result).toBeNull();
    });

    it('returns null for wrong user', async () => {
      const result = await repo.findByUserAndVendor('test-user-002', 'GRAB *GRABFOOD');
      expect(result).toBeNull();
    });

    it('is case-insensitive', async () => {
      const result = await repo.findByUserAndVendor('test-user-001', 'grab *grabfood');
      expect(result).not.toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns all entries for a user', async () => {
      const entries = await repo.findByUserId('test-user-001');
      expect(entries).toHaveLength(7);
    });

    it('returns empty for unknown user', async () => {
      const entries = await repo.findByUserId('test-user-002');
      expect(entries).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('creates a new cache entry with hit_count = 1', async () => {
      const entry = await repo.create('test-user-001', 'STARBUCKS VIVOCITY', 'cat-food');
      expect(entry.id).toBeTruthy();
      expect(entry.vendorName).toBe('STARBUCKS VIVOCITY');
      expect(entry.hitCount).toBe(1);
    });
  });

  describe('incrementHitCount', () => {
    it('increments the hit count', async () => {
      const entry = await repo.findByUserAndVendor('test-user-001', 'GRAB *GRABFOOD');
      expect(entry).not.toBeNull();
      // Seeded via create(), so hitCount starts at 1
      expect(entry!.hitCount).toBe(1);

      await repo.incrementHitCount(entry!.id, entry!.hitCount);
      const updated = await repo.findByUserAndVendor('test-user-001', 'GRAB *GRABFOOD');
      expect(updated!.hitCount).toBe(2);
    });

    it('throws for non-existent entry', async () => {
      await expect(repo.incrementHitCount('nonexistent', 5)).rejects.toThrow();
    });
  });

  describe('deleteByCategoryId', () => {
    it('removes all entries for a category', async () => {
      // cat-food has GRAB *GRABFOOD
      await repo.deleteByCategoryId('cat-food');
      const result = await repo.findByUserAndVendor('test-user-001', 'GRAB *GRABFOOD');
      expect(result).toBeNull();
    });

    it('does not affect entries of other categories', async () => {
      await repo.deleteByCategoryId('cat-food');
      const transport = await repo.findByUserAndVendor('test-user-001', 'GRAB *RIDE');
      expect(transport).not.toBeNull();
    });
  });
});
