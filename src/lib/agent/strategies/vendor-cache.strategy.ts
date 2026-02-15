/**
 * Tier 1 — Vendor Cache Strategy.
 *
 * Instant lookup against the per-user vendor -> category cache.
 * Don't call LLM for low latency. On a cache hit the
 * hit counter is incremented so popular mappings bubble up in
 * analytics.
 *
*/

import type {
  CategorizationChainDeps,
  CategorizationContext,
  CategorizationStrategy,
  CategoryMatch,
} from '@/lib/agent/strategies/interfaces';

import { Confidence } from '@/lib/enums';
import { normalizeVendorName } from '@/lib/utils/vendor';

type VendorCacheRepo = CategorizationChainDeps['vendorCacheRepo'];

export class VendorCacheStrategy implements CategorizationStrategy {
  readonly name = 'VendorCacheStrategy';

  private readonly vendorCacheRepo: VendorCacheRepo;

  constructor(vendorCacheRepo: VendorCacheRepo) {
    this.vendorCacheRepo = vendorCacheRepo;
  }

  /**
   * Look up the normalised vendor name in the user's cache.
   *
   * @returns A HIGH-confidence match on hit, or `null` on miss.
   */
  async resolve(context: CategorizationContext): Promise<CategoryMatch | null> {
    const normalised = normalizeVendorName(context.vendor);

    const hit = await this.vendorCacheRepo.findByUserAndVendor(
      context.userId,
      normalised,
    );

    if (!hit) {
      return null;
    }
    this.vendorCacheRepo.incrementHitCount(hit.id, hit.hitCount);

    const category = context.categories.find((c) => c.id === hit.categoryId);

    return {
      categoryId: hit.categoryId,
      categoryName: category?.name ?? 'Unknown',
      confidence: Confidence.HIGH,
      strategyName: this.name,
    };
  }
}
