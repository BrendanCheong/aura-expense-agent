/**
 * Tool: Use Brave Search API to identify unknown vendors.
 *
 * Uses Smithery V2 API with @modelcontextprotocol/sdk to connect
 * to the Brave Search MCP server hosted on Smithery.ai.
 */

import { tool } from '@langchain/core/tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import Smithery from '@smithery/api';
import { createConnection } from '@smithery/api/mcp';
import { z } from 'zod';

import { BRAVE_WEB_SEARCH_TOOL } from '@/lib/constants';

/**
 * Perform a Brave web search via the Smithery MCP server.
 * Separated from the LangChain tool wrapper for easier testing.
 */
export async function performBraveSearch(query: string): Promise<string> {
  try {
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
    const namespace = process.env.SMITHERY_NAMESPACE;

    if (!braveApiKey || !namespace) {
      return 'Search failed. Missing BRAVE_SEARCH_API_KEY or SMITHERY_NAMESPACE.';
    }

    const smithery = new Smithery();

    const conn = await smithery.connections.create(namespace, {
      mcpUrl: `https://server.smithery.ai/brave?braveApiKey=${braveApiKey}`,
    });

    const { transport } = await createConnection({
      client: smithery,
      namespace,
      connectionId: conn.connectionId,
    });

    const mcpClient = new Client(
      { name: 'Aura Expense Agent', version: '1.0.0' },
      { capabilities: {} },
    );

    await mcpClient.connect(transport);

    const result = await mcpClient.callTool({
      name: BRAVE_WEB_SEARCH_TOOL,
      arguments: { query, count: 3 },
    });

    await mcpClient.close();

    // Extract text content from MCP response
    const content = result.content as Array<{ type: string; text: string }>;
    if (!content || content.length === 0) {
      return 'No results found for this query.';
    }

    return content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n\n');
  } catch (error) {
    console.error('[BraveSearch] Search failed:', error);
    return 'Search failed. Proceed with best guess categorization.';
  }
}

/**
 * LangChain tool wrapper for Brave Search.
 */
export const braveSearchTool = tool(
  ({ query }) => {
    return performBraveSearch(query);
  },
  {
    name: 'brave_search',
    description: `Search the web for information about an unknown vendor or merchant to help categorize an expense. Use this ONLY when you cannot confidently determine the category from the vendor name and available categories alone.`,
    schema: z.object({
      query: z.string().describe('Search query about the vendor, e.g. "What is DigitalOcean?"'),
    }),
  }
);
