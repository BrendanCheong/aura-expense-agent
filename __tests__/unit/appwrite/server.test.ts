import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Appwrite Server', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project-id';
    process.env.APPWRITE_API_KEY = 'test-api-key-secret';
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns a TablesDB instance', async () => {
    const { getAppwriteServer } = await import('@/lib/appwrite/server');
    const { tablesDb } = getAppwriteServer();
    expect(tablesDb).toBeDefined();
    expect(typeof tablesDb.listRows).toBe('function');
    expect(typeof tablesDb.createRow).toBe('function');
  });

  it('returns the same singleton on repeated calls', async () => {
    const { getAppwriteServer } = await import('@/lib/appwrite/server');
    const first = getAppwriteServer();
    const second = getAppwriteServer();
    expect(first).toBe(second);
  });

  it('throws when APPWRITE_API_KEY is missing', async () => {
    delete process.env.APPWRITE_API_KEY;
    const { getAppwriteServer } = await import('@/lib/appwrite/server');
    expect(() => getAppwriteServer()).toThrow('APPWRITE_API_KEY');
  });

  it('throws when NEXT_PUBLIC_APPWRITE_ENDPOINT is missing', async () => {
    delete process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const { getAppwriteServer } = await import('@/lib/appwrite/server');
    expect(() => getAppwriteServer()).toThrow('NEXT_PUBLIC_APPWRITE_ENDPOINT');
  });

  it('throws when NEXT_PUBLIC_APPWRITE_PROJECT_ID is missing', async () => {
    delete process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const { getAppwriteServer } = await import('@/lib/appwrite/server');
    expect(() => getAppwriteServer()).toThrow('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  });
});
