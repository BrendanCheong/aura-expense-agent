/**
 * Tool: Look up user categories for categorization context.
 *
 * Fetches the user's expense categories from the database, providing
 * the LLM with category names and descriptions for matching.
 *
 * Supports Dependency Injection via createLookupCategoriesTool() factory.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { createContainer } from '@/lib/container/container';

const LOOKUP_SCHEMA = z.object({
  userId: z.string().describe('The Appwrite user ID'),
});

export interface LookupCategoriesDeps {
  categoryService: {
    listCategories(userId: string): Promise<Array<{
      id: string;
      name: string;
      description: string;
    }>>;
  };
}

/**
 * Standalone function — testable without LangChain wrapper.
 */
export async function lookupCategories(
  userId: string,
  deps: LookupCategoriesDeps,
): Promise<Array<{ id: string; name: string; description: string }>> {
  const categories = await deps.categoryService.listCategories(userId);
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
  }));
}

/**
 * Dependency Injection factory.
 */
export function createLookupCategoriesTool(deps: LookupCategoriesDeps) {
  return tool(
    async ({ userId }) => JSON.stringify(await lookupCategories(userId, deps)),
    {
      name: 'lookup_categories',
      description: `Fetch the user's expense categories from the database. Each category has a name and a description that explains what kind of expenses belong in it. Use these descriptions to determine the best category match for a vendor/expense.`,
      schema: LOOKUP_SCHEMA,
    },
  );
}

/**
 * Default export — uses the dependency injector container.
 */
export const lookupCategoriesTool = tool(
  async ({ userId }) => {
    const container = await createContainer();
    return JSON.stringify(await lookupCategories(userId, { categoryService: container.categoryService }));
  },
  {
    name: 'lookup_categories',
    description: `Fetch the user's expense categories from the database. Each category has a name and a description that explains what kind of expenses belong in it.`,
    schema: LOOKUP_SCHEMA,
  },
);
