/**
 * Appwrite Database Setup Script
 *
 * Creates the Aura Expense database with all 5 tables, columns, and indexes.
 * Idempotent: checks if resources exist before creating them.
 *
 * Usage:
 *   npx tsx scripts/setup-appwrite.ts
 *
 * Required env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 */

import { Client, TablesDB, ID, IndexType } from 'node-appwrite';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'aura_expense_db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing required env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const tablesDb = new TablesDB(client);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDatabase(): Promise<void> {
  try {
    await tablesDb.get(DB_ID);
    console.log('  Database already exists, skipping creation');
  } catch {
    await tablesDb.create(DB_ID, 'Aura Expense DB');
    console.log('  Database created');
  }
}

async function ensureTable(tableId: string, name: string): Promise<boolean> {
  try {
    await tablesDb.getTable(DB_ID, tableId);
    console.log(`  Table "${name}" already exists, skipping`);
    return false; // already existed
  } catch {
    await tablesDb.createTable(DB_ID, tableId, name);
    console.log(`  Table "${name}" created`);
    return true; // newly created
  }
}

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------

async function setupUsersTable(): Promise<void> {
  console.log('\n📋 Setting up Users table...');
  const isNew = await ensureTable('users', 'Users');
  if (!isNew) return;

  await tablesDb.createStringColumn(DB_ID, 'users', 'email', { size: 320, required: true });
  await tablesDb.createStringColumn(DB_ID, 'users', 'name', { size: 255, required: true });
  await tablesDb.createStringColumn(DB_ID, 'users', 'inbound_email', { size: 320, required: true });
  await tablesDb.createStringColumn(DB_ID, 'users', 'oauth_provider', { size: 20, required: true });
  await tablesDb.createStringColumn(DB_ID, 'users', 'avatar_url', { size: 500, required: false, xdefault: '' });
  await tablesDb.createFloatColumn(DB_ID, 'users', 'monthly_salary', { required: false });
  await tablesDb.createStringColumn(DB_ID, 'users', 'budget_mode', { size: 20, required: false, xdefault: 'direct' });

  await delay(2000);

  await tablesDb.createIndex(DB_ID, 'users', 'idx_users_email', IndexType.Unique, ['email']);
  await tablesDb.createIndex(DB_ID, 'users', 'idx_users_inbound_email', IndexType.Unique, ['inbound_email']);

  console.log('  ✅ Users table ready');
}

async function setupCategoriesTable(): Promise<void> {
  console.log('\n📋 Setting up Categories table...');
  const isNew = await ensureTable('categories', 'Categories');
  if (!isNew) return;

  await tablesDb.createStringColumn(DB_ID, 'categories', 'user_id', { size: 36, required: true });
  await tablesDb.createStringColumn(DB_ID, 'categories', 'name', { size: 100, required: true });
  await tablesDb.createStringColumn(DB_ID, 'categories', 'description', { size: 500, required: true });
  await tablesDb.createStringColumn(DB_ID, 'categories', 'icon', { size: 10, required: false, xdefault: '📦' });
  await tablesDb.createStringColumn(DB_ID, 'categories', 'color', { size: 7, required: false, xdefault: '#6366f1' });
  await tablesDb.createBooleanColumn(DB_ID, 'categories', 'is_default', { required: true, xdefault: true });
  await tablesDb.createIntegerColumn(DB_ID, 'categories', 'sort_order', { required: true, min: 0, max: 100, xdefault: 0 });

  await delay(2000);

  await tablesDb.createIndex(DB_ID, 'categories', 'idx_categories_user', IndexType.Key, ['user_id']);
  await tablesDb.createIndex(DB_ID, 'categories', 'idx_categories_user_name', IndexType.Unique, ['user_id', 'name']);

  console.log('  ✅ Categories table ready');
}

async function setupTransactionsTable(): Promise<void> {
  console.log('\n📋 Setting up Transactions table...');
  const isNew = await ensureTable('transactions', 'Transactions');
  if (!isNew) return;

  await tablesDb.createStringColumn(DB_ID, 'transactions', 'user_id', { size: 36, required: true });
  await tablesDb.createStringColumn(DB_ID, 'transactions', 'category_id', { size: 36, required: true });
  await tablesDb.createFloatColumn(DB_ID, 'transactions', 'amount', { required: true });
  await tablesDb.createStringColumn(DB_ID, 'transactions', 'vendor', { size: 255, required: true });
  await tablesDb.createStringColumn(DB_ID, 'transactions', 'description', { size: 500, required: false, xdefault: '' });
  await tablesDb.createDatetimeColumn(DB_ID, 'transactions', 'transaction_date', { required: true });
  await tablesDb.createStringColumn(DB_ID, 'transactions', 'resend_email_id', { size: 100, required: false });
  await tablesDb.createStringColumn(DB_ID, 'transactions', 'raw_email_subject', { size: 500, required: false, xdefault: '' });
  await tablesDb.createStringColumn(DB_ID, 'transactions', 'confidence', { size: 10, required: true, xdefault: 'high' });
  await tablesDb.createStringColumn(DB_ID, 'transactions', 'source', { size: 10, required: true, xdefault: 'email' });

  await delay(2000);

  await tablesDb.createIndex(DB_ID, 'transactions', 'idx_tx_user', IndexType.Key, ['user_id']);
  await tablesDb.createIndex(DB_ID, 'transactions', 'idx_tx_resend_id', IndexType.Unique, ['resend_email_id']);
  await tablesDb.createIndex(DB_ID, 'transactions', 'idx_tx_user_date', IndexType.Key, ['user_id', 'transaction_date']);
  await tablesDb.createIndex(DB_ID, 'transactions', 'idx_tx_user_category', IndexType.Key, ['user_id', 'category_id']);
  await tablesDb.createIndex(DB_ID, 'transactions', 'idx_tx_user_date_category', IndexType.Key, ['user_id', 'transaction_date', 'category_id']);

  console.log('  ✅ Transactions table ready');
}

async function setupBudgetsTable(): Promise<void> {
  console.log('\n📋 Setting up Budgets table...');
  const isNew = await ensureTable('budgets', 'Budgets');
  if (!isNew) return;

  await tablesDb.createStringColumn(DB_ID, 'budgets', 'user_id', { size: 36, required: true });
  await tablesDb.createStringColumn(DB_ID, 'budgets', 'category_id', { size: 36, required: true });
  await tablesDb.createFloatColumn(DB_ID, 'budgets', 'amount', { required: true });
  await tablesDb.createIntegerColumn(DB_ID, 'budgets', 'year', { required: true, min: 2020, max: 2100 });
  await tablesDb.createIntegerColumn(DB_ID, 'budgets', 'month', { required: true, min: 1, max: 12 });

  await delay(2000);

  await tablesDb.createIndex(DB_ID, 'budgets', 'idx_budget_user_period', IndexType.Key, ['user_id', 'year', 'month']);
  await tablesDb.createIndex(DB_ID, 'budgets', 'idx_budget_unique', IndexType.Unique, ['user_id', 'category_id', 'year', 'month']);

  console.log('  ✅ Budgets table ready');
}

async function setupVendorCacheTable(): Promise<void> {
  console.log('\n📋 Setting up Vendor Cache table...');
  const isNew = await ensureTable('vendor_cache', 'Vendor Cache');
  if (!isNew) return;

  await tablesDb.createStringColumn(DB_ID, 'vendor_cache', 'user_id', { size: 36, required: true });
  await tablesDb.createStringColumn(DB_ID, 'vendor_cache', 'vendor_name', { size: 255, required: true });
  await tablesDb.createStringColumn(DB_ID, 'vendor_cache', 'category_id', { size: 36, required: true });
  await tablesDb.createIntegerColumn(DB_ID, 'vendor_cache', 'hit_count', { required: true, min: 0, max: 1000000, xdefault: 1 });

  await delay(2000);

  await tablesDb.createIndex(DB_ID, 'vendor_cache', 'idx_vc_user_vendor', IndexType.Unique, ['user_id', 'vendor_name']);

  console.log('  ✅ Vendor Cache table ready');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function setup(): Promise<void> {
  console.log('🚀 Aura Expense — Database Setup\n');
  console.log(`  Endpoint:   ${ENDPOINT}`);
  console.log(`  Project ID: ${PROJECT_ID}`);
  console.log(`  Database:   ${DB_ID}`);

  await ensureDatabase();
  await setupUsersTable();
  await setupCategoriesTable();
  await setupTransactionsTable();
  await setupBudgetsTable();
  await setupVendorCacheTable();

  console.log('\n🎉 All tables created successfully!');
}

setup().catch((err) => {
  console.error('\n❌ Setup failed:', err);
  process.exit(1);
});
