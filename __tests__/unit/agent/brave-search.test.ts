/**
 * Unit tests for the Brave Search MCP tool.
 *
 * Tests Smithery V2 + MCP SDK integration for vendor lookup.
 * All network calls are mocked.
 *
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockCallTool = vi.fn();
const mockListTools = vi.fn();
const mockConnect = vi.fn();
const mockClose = vi.fn();

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  interface MockMCPClient {
    connect: typeof mockConnect;
    callTool: typeof mockCallTool;
    listTools: typeof mockListTools;
    close: typeof mockClose;
  }
  const Client = vi.fn(function (this: MockMCPClient) {
    this.connect = mockConnect;
    this.callTool = mockCallTool;
    this.listTools = mockListTools;
    this.close = mockClose;
  });
  return { Client };
});

vi.mock('@smithery/api', () => {
  interface MockSmithery {
    connections: { create: ReturnType<typeof vi.fn> };
  }
  const Smithery = vi.fn(function (this: MockSmithery) {
    this.connections = {
      create: vi.fn().mockResolvedValue({ connectionId: 'test-conn-id' }),
    };
  });
  return { default: Smithery };
});

vi.mock('@smithery/api/mcp', () => ({
  createConnection: vi.fn().mockResolvedValue({
    transport: { type: 'mock-transport' },
  }),
}));

import { performBraveSearch } from '@/lib/agent/tools/brave-search';

describe('Brave Search Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('successful search — returns formatted results', async () => {
    mockCallTool.mockResolvedValue({
      content: [
        { type: 'text', text: 'DigitalOcean is a cloud infrastructure provider offering cloud computing services.' },
      ],
    });

    const result = await performBraveSearch('What is DigitalOcean?');

    expect(result).toContain('DigitalOcean');
    expect(result).toContain('cloud');
    expect(mockCallTool).toHaveBeenCalledWith({
      name: 'brave_web_search',
      arguments: { query: 'What is DigitalOcean?', count: 3 },
    });
  });

  test('API failure — returns fallback message', async () => {
    mockCallTool.mockRejectedValue(new Error('MCP connection failed'));

    const result = await performBraveSearch('test query');

    expect(result).toContain('Search failed');
  });

  test('empty results — returns no results message', async () => {
    mockCallTool.mockResolvedValue({
      content: [],
    });

    const result = await performBraveSearch('obscure query');

    expect(result).toContain('No results found');
  });

  test('rate limited — returns fallback message', async () => {
    mockCallTool.mockRejectedValue(new Error('429 Too Many Requests'));

    const result = await performBraveSearch('test rate limit');

    expect(result).toContain('Search failed');
  });
});
