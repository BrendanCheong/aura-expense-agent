import type { IVendorCacheRepository } from '../interfaces';
import type { VendorCacheEntry } from '@/types/vendor-cache';
import { normalizeVendorName } from '@/lib/utils/vendor';

export class InMemoryVendorCacheRepository implements IVendorCacheRepository {
  private store: Map<string, VendorCacheEntry> = new Map();

  async findByUserAndVendor(userId: string, vendorName: string): Promise<VendorCacheEntry | null> {
    const normalized = normalizeVendorName(vendorName);
    for (const entry of this.store.values()) {
      if (entry.userId === userId && entry.vendorName === normalized) {
        return entry;
      }
    }
    return null;
  }

  async findByUserId(userId: string): Promise<VendorCacheEntry[]> {
    return Array.from(this.store.values()).filter(e => e.userId === userId);
  }

  async create(userId: string, vendorName: string, categoryId: string): Promise<VendorCacheEntry> {
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
    return entry;
  }

  async updateCategoryId(id: string, categoryId: string): Promise<void> {
    const entry = this.store.get(id);
    if (!entry) throw new Error(`Vendor cache entry ${id} not found`);
    entry.categoryId = categoryId;
    entry.updatedAt = new Date().toISOString();
  }

  async incrementHitCount(id: string, currentCount: number): Promise<void> {
    const entry = this.store.get(id);
    if (!entry) throw new Error(`Vendor cache entry ${id} not found`);
    entry.hitCount = currentCount + 1;
    entry.updatedAt = new Date().toISOString();
  }

  async deleteByCategoryId(categoryId: string): Promise<void> {
    const idsToDelete: string[] = [];
    for (const [id, entry] of this.store.entries()) {
      if (entry.categoryId === categoryId) {
        idsToDelete.push(id);
      }
    }
    for (const id of idsToDelete) {
      this.store.delete(id);
    }
  }

  /** Test helper: reset the store */
  reset(): void {
    this.store.clear();
  }
}
