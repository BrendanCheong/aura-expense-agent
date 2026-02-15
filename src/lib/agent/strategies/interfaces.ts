/**
 * Categorization strategy interfaces.
 *
 * The 5-tier strategy chain resolves vendor → category using progressively
 * more expensive strategies:
 *
 *   Tier 1: VendorCacheStrategy       (instant, zero tokens)
 *   Tier 2: Mem0MemoryStrategy        (user corrections, ~200ms)
 *   Tier 3: LLMCategoryMatchStrategy  (LLM reasons over category descriptions)
 *   Tier 4: BraveSearchStrategy       (web search for unknown vendors)
 *   Tier 5: FallbackOtherStrategy     (always resolves to "Other")
 *
*/

import type { Confidence } from '@/lib/enums';

export interface CategoryMatch {
  categoryId: string;
  categoryName: string;
  confidence: Confidence;
  strategyName: string;
}

export interface CategorizationContext {
  userId: string;
  vendor: string;
  categories: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  /** Optional email content for LLM context */
  emailContent?: string;
}

export interface CategorizationStrategy {
  /** Unique name for observability */
  readonly name: string;
  resolve(context: CategorizationContext): Promise<CategoryMatch | null>;
}

export interface CategorizationChainDeps {
  vendorCacheRepo: {
    findByUserAndVendor(userId: string, vendorName: string): Promise<{ categoryId: string; id: string; hitCount: number } | null>;
    incrementHitCount(id: string, currentCount: number): Promise<void>;
  };
  mem0Client?: {
    search(query: string, options: { user_id: string; top_k: number }): Promise<Array<{ memory: string; score?: number }>>;
  };
  braveSearchFn?: (query: string) => Promise<string>;
}
