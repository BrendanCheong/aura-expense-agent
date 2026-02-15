import type { IVendorCacheRepository } from '../interfaces';
import type { VendorCacheEntry } from '@/types/vendor-cache';

import { normalizeVendorName } from '@/lib/utils/vendor';

export class InMemoryVendorCacheRepository implements IVendorCacheRepository {
  private store: Map<string, VendorCacheEntry> = new Map();

  findByUserAndVendor(userId: string, vendorName: string): Promise<VendorCacheEntry | null> {
    const normalized = normalizeVendorName(vendorName);
    for (const entry of this.store.values()) {
      if (entry.userId === userId && entry.vendorName === normalized) {
        return Promise.resolve(entry);
      }
    }
    return Promise.resolve(null);
  }

  findByUserId(userId: string): Promise<VendorCacheEntry[]> {
    return Promise.resolve(
      Array.from(this.store.values()).filter((e) => e.userId === userId)
    );
  }

  create(userId: string, vendorName: string, categoryId: string): Promise<VendorCacheEntry> {
    const now = new Date().toISOString();
    const entry: VendorCacheEntry = {
      id: crypto.randomUUID(),
      userId,
      vendorName: normalizeVendorName(vendorName),
      categoryId,
      hitCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(entry.id, entry);
    return Promise.resolve(entry);
  }

  updateCategoryId(id: string, categoryId: string): Promise<void> {
    const entry = this.store.get(id);
    if (!entry) {return Promise.reject(new Error(`Vendor cache entry ${id} not found`));}
    entry.categoryId = categoryId;
    entry.updatedAt = new Date().toISOString();
    return Promise.resolve();
  }

  incrementHitCount(id: string, currentCount: number): Promise<void> {
    const entry = this.store.get(id);
    if (!entry) {return Promise.reject(new Error(`Vendor cache entry ${id} not found`));}
    entry.hitCount = currentCount + 1;
    entry.updatedAt = new Date().toISOString();
    return Promise.resolve();
  }

  deleteByCategoryId(categoryId: string): Promise<void> {
    const idsToDelete: string[] = [];
    for (const [id, entry] of this.store.entries()) {
      if (entry.categoryId === categoryId) {
        idsToDelete.push(id);
      }
    }
    for (const id of idsToDelete) {
      this.store.delete(id);
    }
    return Promise.resolve();
  }

  /** Test helper: reset the store */
  reset(): void {
    this.store.clear();
  }

  /** Test helper: seed an entry with a specific ID */
  seed(entry: VendorCacheEntry): void {
    this.store.set(entry.id, entry);
  }
}
