/**
 * Categorization Chain — ordered strategy executor.
 *
 * Iterates through an ordered list of {@link CategorizationStrategy}
 * instances and returns the first non-null result. The chain should
 * always end with {@link FallbackOtherStrategy} so it never exits
 * without a match.
 *  
*/

import type {
  CategorizationContext,
  CategorizationStrategy,
  CategoryMatch,
} from '@/lib/agent/strategies/interfaces';

export class CategorizationChain {
  private readonly strategies: CategorizationStrategy[];

  constructor(strategies: CategorizationStrategy[]) {
    this.strategies = strategies;
  }

  /**
   * Run each strategy in order until one resolves.
   * Attempt to resolve a vendor to a category.
   * Returns null if this strategy cannot determine the category —
   * signals the chain to try the next strategy.
   *
   * @throws {Error} If every strategy returns `null` (should never
   *   happen when FallbackOtherStrategy is the last strategy).
   */
  async resolve(context: CategorizationContext): Promise<CategoryMatch> {
    for (const strategy of this.strategies) {
      const result = await strategy.resolve(context);

      if (result !== null) {
        console.warn(
          `[CategorizationChain] Resolved by: ${strategy.name}`,
        );
        return result;
      }
    }

    throw new Error(
      '[CategorizationChain] All strategies returned null — this should not happen when FallbackOtherStrategy is included.',
    );
  }
}
