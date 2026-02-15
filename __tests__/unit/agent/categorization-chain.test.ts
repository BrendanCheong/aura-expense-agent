/**
 * Unit tests for the categorization strategy chain.
 * Tests the 5-tier strategy pattern: VendorCache → Mem0 → LLM → BraveSearch → Fallback
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

import categoriesFixtures from '../../fixtures/categories.json';
import vendorCacheFixtures from '../../fixtures/vendor-cache.json';

import type {
  CategorizationContext,
  CategorizationStrategy,
  CategoryMatch,
} from '@/lib/agent/strategies/interfaces';

import { CategorizationChain } from '@/lib/agent/strategies/categorization-chain';
import { FallbackOtherStrategy } from '@/lib/agent/strategies/fallback-other.strategy';
import { VendorCacheStrategy } from '@/lib/agent/strategies/vendor-cache.strategy';
import { Confidence } from '@/lib/enums';

const testCategories = categoriesFixtures.map((c) => ({
  id: c.id,
  name: c.name,
  description: c.description,
}));

function makeContext(vendor: string): CategorizationContext {
  return {
    userId: 'test-user-001',
    vendor,
    categories: testCategories,
  };
}

describe('VendorCacheStrategy', () => {
  const mockVendorCacheRepo = {
    findByUserAndVendor: vi.fn(),
    incrementHitCount: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('cache hit — returns category with high confidence', async () => {
    const cacheEntry = vendorCacheFixtures[0];
    mockVendorCacheRepo.findByUserAndVendor.mockResolvedValue({
      id: cacheEntry.id,
      categoryId: cacheEntry.category_id,
      hitCount: cacheEntry.hit_count,
    });

    const strategy = new VendorCacheStrategy(mockVendorCacheRepo);
    const result = await strategy.resolve(makeContext('GRAB *GRABFOOD'));

    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe('cat-food');
    expect(result!.confidence).toBe(Confidence.HIGH);
    expect(result!.strategyName).toBe('VendorCacheStrategy');
    expect(mockVendorCacheRepo.incrementHitCount).toHaveBeenCalledWith(
      cacheEntry.id,
      cacheEntry.hit_count
    );
  });

  test('cache miss — returns null', async () => {
    mockVendorCacheRepo.findByUserAndVendor.mockResolvedValue(null);

    const strategy = new VendorCacheStrategy(mockVendorCacheRepo);
    const result = await strategy.resolve(makeContext('NEW VENDOR'));

    expect(result).toBeNull();
    expect(mockVendorCacheRepo.incrementHitCount).not.toHaveBeenCalled();
  });
});

describe('FallbackOtherStrategy', () => {
  test('always resolves to "Other" category with low confidence', async () => {
    const strategy = new FallbackOtherStrategy();
    const result = await strategy.resolve(makeContext('TOTALLY UNKNOWN'));

    expect(result).not.toBeNull();
    expect(result!.categoryName).toBe('Other');
    expect(result!.confidence).toBe(Confidence.LOW);
    expect(result!.strategyName).toBe('FallbackOtherStrategy');
  });

  test('uses cat-other ID from provided categories', async () => {
    const strategy = new FallbackOtherStrategy();
    const result = await strategy.resolve(makeContext('ANYTHING'));

    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe('cat-other');
  });
});

describe('CategorizationChain', () => {
  test('resolves at tier 1 when vendor is cached', async () => {
    const mockCacheStrategy: CategorizationStrategy = {
      name: 'VendorCacheStrategy',
      resolve: vi.fn().mockResolvedValue({
        categoryId: 'cat-food',
        categoryName: 'Food & Beverage',
        confidence: Confidence.HIGH,
        strategyName: 'VendorCacheStrategy',
      } satisfies CategoryMatch),
    };

    const mockFallback: CategorizationStrategy = {
      name: 'FallbackOtherStrategy',
      resolve: vi.fn(),
    };

    const chain = new CategorizationChain([mockCacheStrategy, mockFallback]);
    const result = await chain.resolve(makeContext('GRAB *GRABFOOD'));

    expect(result.categoryId).toBe('cat-food');
    expect(result.strategyName).toBe('VendorCacheStrategy');
    expect(mockFallback.resolve).not.toHaveBeenCalled();
  });

  test('falls through to last strategy when all others return null', async () => {
    const mockCacheStrategy: CategorizationStrategy = {
      name: 'VendorCacheStrategy',
      resolve: vi.fn().mockResolvedValue(null),
    };

    const mockFallback: CategorizationStrategy = {
      name: 'FallbackOtherStrategy',
      resolve: vi.fn().mockResolvedValue({
        categoryId: 'cat-other',
        categoryName: 'Other',
        confidence: Confidence.LOW,
        strategyName: 'FallbackOtherStrategy',
      } satisfies CategoryMatch),
    };

    const chain = new CategorizationChain([mockCacheStrategy, mockFallback]);
    const result = await chain.resolve(makeContext('UNKNOWN VENDOR'));

    expect(result.categoryId).toBe('cat-other');
    expect(result.strategyName).toBe('FallbackOtherStrategy');
    expect(mockCacheStrategy.resolve).toHaveBeenCalled();
    expect(mockFallback.resolve).toHaveBeenCalled();
  });

  test('logs strategy name on resolution', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mockFallback: CategorizationStrategy = {
      name: 'FallbackOtherStrategy',
      resolve: vi.fn().mockResolvedValue({
        categoryId: 'cat-other',
        categoryName: 'Other',
        confidence: Confidence.LOW,
        strategyName: 'FallbackOtherStrategy',
      } satisfies CategoryMatch),
    };

    const chain = new CategorizationChain([mockFallback]);
    await chain.resolve(makeContext('TEST'));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('FallbackOtherStrategy')
    );

    consoleSpy.mockRestore();
  });
});
