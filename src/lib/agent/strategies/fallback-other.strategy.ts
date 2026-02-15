/**
 * Tier 5 — Fallback "Other" Strategy.
 *
 * Terminal strategy that always resolves. It guarantees the chain
 * never exits without a category by mapping the transaction to
 * the user's "Other" category (or the last category in the list
 * as a last resort).
 *
*/

import type {
  CategorizationContext,
  CategorizationStrategy,
  CategoryMatch,
} from '@/lib/agent/strategies/interfaces';

import { Confidence } from '@/lib/enums';

export class FallbackOtherStrategy implements CategorizationStrategy {
  readonly name = 'FallbackOtherStrategy';

  /**
   * Always returns a LOW-confidence match.
   *
   * Preference order:
   *  1. A category whose name matches "Other" (case-insensitive).
   *  2. The last category in the provided list.
   */
  resolve(context: CategorizationContext): Promise<CategoryMatch> {
    const other = context.categories.find(
      (c) => c.name.toLowerCase() === 'other',
    );

    const fallback = other ?? context.categories[context.categories.length - 1];

    return Promise.resolve({
      categoryId: fallback.id,
      categoryName: fallback.name,
      confidence: Confidence.LOW,
      strategyName: this.name,
    });
  }
}
