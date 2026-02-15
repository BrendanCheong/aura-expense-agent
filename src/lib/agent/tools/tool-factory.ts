/**
 * Agent Tool Factory — creates LangChain tools with injected dependencies.
 *
 * Follows the Factory pattern and Dependency Injection pattern.
 * All tools receive their dependencies via constructor injection
 * rather than importing singletons.
 */

import { braveSearchTool } from './brave-search';
import { extractExpenseTool } from './extract-expense';
import { createLogExpenseTool } from './log-expense';
import { createLookupCategoriesTool } from './lookup-categories';
import { createRecallMemoriesTool } from './recall-memories';

import type { ServiceContainer } from '@/lib/container/container';
import type { ITransactionRepository, IVendorCacheRepository } from '@/lib/repositories/interfaces';
import type { StructuredToolInterface } from '@langchain/core/tools';

export interface ToolFactoryDeps {
  container: ServiceContainer;
  transactionRepo: ITransactionRepository;
  vendorCacheRepo: IVendorCacheRepository;
  mem0Client?: {
    search(query: string, opts: { user_id: string; top_k: number }): Promise<Array<{ memory?: string; score?: number }>>;
  };
}

/**
 * Create all agent tools with injected dependencies.
 * This is the single source of truth where tools are wired up with their deps.
 */
export function createAgentTools(deps: ToolFactoryDeps): StructuredToolInterface[] {
  const tools: StructuredToolInterface[] = [
    extractExpenseTool,
    braveSearchTool,
    createLookupCategoriesTool({
      categoryService: deps.container.categoryService,
    }),
    createLogExpenseTool({
      transactionRepo: deps.transactionRepo,
      vendorCacheRepo: deps.vendorCacheRepo,
    }),
  ];

  if (deps.mem0Client) {
    tools.push(createRecallMemoriesTool(deps.mem0Client));
  }

  return tools;
}
