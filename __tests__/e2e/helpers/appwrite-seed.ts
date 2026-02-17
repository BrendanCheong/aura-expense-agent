/**
 * E2E test helpers — Appwrite SDK seeding for Playwright tests.
 *
 * Seeds and tears down data directly in Appwrite TablesDB so e2e tests
 * can run against the real running dev server.
 *
 * All seeded rows use an `e2e-` prefix to avoid conflicts with existing data.
 * The dev server must be running with PROJECT_ENV=dev for auth bypass.
 */

import { Client, TablesDB } from 'node-appwrite';

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

let tablesDb: TablesDB | null = null;

function getTablesDb(): TablesDB {
  if (tablesDb) {
    return tablesDb;
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      'Missing Appwrite env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY'
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  tablesDb = new TablesDB(client);
  return tablesDb;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'aura_expense_db';
const TABLES = {
  categories: 'categories',
  transactions: 'transactions',
  vendorCache: 'vendor_cache',
} as const;

/** User ID that the dev server returns for PROJECT_ENV=dev */
export const DEV_USER_ID = 'dev-user-001';

// ---------------------------------------------------------------------------
// Seed data with e2e-* IDs — isolated from other data
// ---------------------------------------------------------------------------

export const E2E_CATEGORY = {
  id: 'e2e-cat-food',
  user_id: DEV_USER_ID,
  name: 'E2E Food',
  description: 'E2E test category',
  icon: '🍔',
  color: '#ef4444',
  is_default: false,
  sort_order: 99,
};

export const E2E_CATEGORY_2 = {
  id: 'e2e-cat-transport',
  user_id: DEV_USER_ID,
  name: 'E2E Transport',
  description: 'E2E test transport category',
  icon: '🚗',
  color: '#f97316',
  is_default: false,
  sort_order: 100,
};

export const E2E_TRANSACTION = {
  id: 'e2e-tx-001',
  user_id: DEV_USER_ID,
  category_id: 'e2e-cat-food',
  amount: 25.5,
  vendor: 'E2E_VENDOR_ONE',
  description: 'E2E test transaction',
  transaction_date: '2026-02-10T14:00:00+08:00',
  resend_email_id: null,
  raw_email_subject: '',
  confidence: 'high',
  source: 'manual',
};

export const E2E_TRANSACTION_2 = {
  id: 'e2e-tx-002',
  user_id: DEV_USER_ID,
  category_id: 'e2e-cat-transport',
  amount: 12.0,
  vendor: 'E2E_VENDOR_TWO',
  description: 'E2E second transaction',
  transaction_date: '2026-02-11T09:00:00+08:00',
  resend_email_id: null,
  raw_email_subject: '',
  confidence: 'high',
  source: 'manual',
};

// Track dynamically created IDs for cleanup
const createdIds: { table: string; id: string }[] = [];

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

export async function seedE2EData(): Promise<void> {
  const db = getTablesDb();

  // Seed categories first (transactions reference them)
  for (const cat of [E2E_CATEGORY, E2E_CATEGORY_2]) {
    await db.createRow({
      databaseId: DB_ID,
      tableId: TABLES.categories,
      rowId: cat.id,
      data: cat,
    });
    createdIds.push({ table: TABLES.categories, id: cat.id });
  }

  // Seed transactions
  for (const tx of [E2E_TRANSACTION, E2E_TRANSACTION_2]) {
    await db.createRow({
      databaseId: DB_ID,
      tableId: TABLES.transactions,
      rowId: tx.id,
      data: tx,
    });
    createdIds.push({ table: TABLES.transactions, id: tx.id });
  }
}

/**
 * Track a dynamically created row (e.g. from POST /api/transactions)
 * for cleanup in teardown.
 */
export function trackForCleanup(table: string, id: string): void {
  createdIds.push({ table, id });
}

// ---------------------------------------------------------------------------
// Teardown — delete all e2e rows in reverse order
// ---------------------------------------------------------------------------

export async function teardownE2EData(): Promise<void> {
  const db = getTablesDb();

  // Delete in reverse order (transactions before categories)
  for (const { table, id } of [...createdIds].reverse()) {
    try {
      await db.deleteRow({
        databaseId: DB_ID,
        tableId: table,
        rowId: id,
      });
    } catch {
      // Row may already be deleted by the test — ignore
    }
  }

  createdIds.length = 0;
}
