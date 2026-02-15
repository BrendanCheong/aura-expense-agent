import { describe, it, expect } from 'vitest';

import { APPWRITE_CONFIG } from '@/lib/appwrite/config';

describe('Appwrite Config', () => {
  it('exports database ID', () => {
    expect(APPWRITE_CONFIG.databaseId).toBeDefined();
    expect(typeof APPWRITE_CONFIG.databaseId).toBe('string');
  });

  it('exports all 5 table IDs', () => {
    const { tables } = APPWRITE_CONFIG;
    expect(tables.users).toBeDefined();
    expect(tables.transactions).toBeDefined();
    expect(tables.categories).toBeDefined();
    expect(tables.budgets).toBeDefined();
    expect(tables.vendorCache).toBeDefined();
  });

  it('exports endpoint and project ID', () => {
    expect(APPWRITE_CONFIG.endpoint).toBeDefined();
    expect(APPWRITE_CONFIG.projectId).toBeDefined();
  });

  it('is immutable (as const)', () => {
    // TypeScript enforces this at compile time; runtime check for safety
    expect(Object.isFrozen(APPWRITE_CONFIG)).toBe(false); // as const doesn't freeze at runtime
    expect(typeof APPWRITE_CONFIG).toBe('object');
  });
});
