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

import { Client, TablesDB, IndexType } from 'node-appwrite';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'aura_expense_db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error(
    'Missing required env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY'
  );
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const tablesDb = new TablesDB(client);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDatabase(): Promise<void> {
  try {
    await tablesDb.get({ databaseId: DB_ID });
    console.log('  Database already exists, skipping creation');
  } catch {
    await tablesDb.create({ databaseId: DB_ID, name: 'Aura Expense DB' });
    console.log('  Database created');
  }
}

async function ensureTable(tableId: string, name: string): Promise<boolean> {
  try {
    await tablesDb.getTable({ databaseId: DB_ID, tableId });
    console.log(`  Table "${name}" already exists, skipping`);
    return false; // already existed
  } catch {
    await tablesDb.createTable({ databaseId: DB_ID, tableId, name });
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
  if (!isNew) {return;}

  await tablesDb.createEmailColumn({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'email',
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'name',
    size: 255,
    required: true,
  });
  await tablesDb.createEmailColumn({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'inbound_email',
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'oauth_provider',
    size: 20,
    required: true,
  });
  await tablesDb.createUrlColumn({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'avatar_url',
    required: false,
  });
  await tablesDb.createFloatColumn({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'monthly_salary',
    required: false,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'budget_mode',
    size: 20,
    required: false,
    xdefault: 'direct',
  });

  await delay(2000);

  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'idx_users_email',
    type: IndexType.Unique,
    columns: ['email'],
  });
  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'users',
    key: 'idx_users_inbound_email',
    type: IndexType.Unique,
    columns: ['inbound_email'],
  });

  console.log('  ✅ Users table ready');
}

async function setupCategoriesTable(): Promise<void> {
  console.log('\n📋 Setting up Categories table...');
  const isNew = await ensureTable('categories', 'Categories');
  if (!isNew) {return;}

  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'user_id',
    size: 36,
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'name',
    size: 100,
    required: true,
  });
  await tablesDb.createTextColumn({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'description',
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'icon',
    size: 10,
    required: false,
    xdefault: '📦',
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'color',
    size: 7,
    required: false,
    xdefault: '#6366f1',
  });
  await tablesDb.createBooleanColumn({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'is_default',
    required: true,
  });
  await tablesDb.createIntegerColumn({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'sort_order',
    required: true,
    min: 0,
    max: 100,
  });

  await delay(2000);

  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'idx_categories_user',
    type: IndexType.Key,
    columns: ['user_id'],
  });
  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'categories',
    key: 'idx_categories_user_name',
    type: IndexType.Unique,
    columns: ['user_id', 'name'],
  });

  console.log('  ✅ Categories table ready');
}

async function setupTransactionsTable(): Promise<void> {
  console.log('\n📋 Setting up Transactions table...');
  const isNew = await ensureTable('transactions', 'Transactions');
  if (!isNew) {return;}

  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'user_id',
    size: 36,
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'category_id',
    size: 36,
    required: true,
  });
  await tablesDb.createFloatColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'amount',
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'vendor',
    size: 255,
    required: true,
  });
  await tablesDb.createTextColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'description',
    required: false,
    xdefault: '',
  });
  await tablesDb.createDatetimeColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'transaction_date',
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'resend_email_id',
    size: 100,
    required: false,
  });
  await tablesDb.createTextColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'raw_email_subject',
    required: false,
    xdefault: '',
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'confidence',
    size: 10,
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'source',
    size: 10,
    required: true,
  });

  await delay(2000);

  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'idx_tx_user',
    type: IndexType.Key,
    columns: ['user_id'],
  });
  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'idx_tx_resend_id',
    type: IndexType.Unique,
    columns: ['resend_email_id'],
  });
  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'idx_tx_user_date',
    type: IndexType.Key,
    columns: ['user_id', 'transaction_date'],
  });
  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'idx_tx_user_category',
    type: IndexType.Key,
    columns: ['user_id', 'category_id'],
  });
  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'transactions',
    key: 'idx_tx_user_date_category',
    type: IndexType.Key,
    columns: ['user_id', 'transaction_date', 'category_id'],
  });

  console.log('  ✅ Transactions table ready');
}

async function setupBudgetsTable(): Promise<void> {
  console.log('\n📋 Setting up Budgets table...');
  const isNew = await ensureTable('budgets', 'Budgets');
  if (!isNew) {return;}

  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'budgets',
    key: 'user_id',
    size: 36,
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'budgets',
    key: 'category_id',
    size: 36,
    required: true,
  });
  await tablesDb.createFloatColumn({
    databaseId: DB_ID,
    tableId: 'budgets',
    key: 'amount',
    required: true,
  });
  await tablesDb.createIntegerColumn({
    databaseId: DB_ID,
    tableId: 'budgets',
    key: 'year',
    required: true,
    min: 2020,
    max: 2100,
  });
  await tablesDb.createIntegerColumn({
    databaseId: DB_ID,
    tableId: 'budgets',
    key: 'month',
    required: true,
    min: 1,
    max: 12,
  });

  await delay(2000);

  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'budgets',
    key: 'idx_budget_user_period',
    type: IndexType.Key,
    columns: ['user_id', 'year', 'month'],
  });
  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'budgets',
    key: 'idx_budget_unique',
    type: IndexType.Unique,
    columns: ['user_id', 'category_id', 'year', 'month'],
  });

  console.log('  ✅ Budgets table ready');
}

async function setupVendorCacheTable(): Promise<void> {
  console.log('\n📋 Setting up Vendor Cache table...');
  const isNew = await ensureTable('vendor_cache', 'Vendor Cache');
  if (!isNew) {return;}

  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'vendor_cache',
    key: 'user_id',
    size: 36,
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'vendor_cache',
    key: 'vendor_name',
    size: 255,
    required: true,
  });
  await tablesDb.createVarcharColumn({
    databaseId: DB_ID,
    tableId: 'vendor_cache',
    key: 'category_id',
    size: 36,
    required: true,
  });
  await tablesDb.createIntegerColumn({
    databaseId: DB_ID,
    tableId: 'vendor_cache',
    key: 'hit_count',
    required: true,
    min: 0,
    max: 1000000,
  });

  await delay(2000);

  await tablesDb.createIndex({
    databaseId: DB_ID,
    tableId: 'vendor_cache',
    key: 'idx_vc_user_vendor',
    type: IndexType.Unique,
    columns: ['user_id', 'vendor_name'],
  });

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
