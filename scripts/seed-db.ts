/**
 * Appwrite Database Seed Script
 *
 * Populates the database with test data: 1 test user, 8 categories,
 * 32 transactions, 8 budgets, and 7 vendor cache entries.
 *
 * Usage:
 *   npx tsx scripts/seed-db.ts
 *
 * Required env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 */

import { Client, TablesDB, ID } from 'node-appwrite';

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'aura_expense_db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing required env vars.');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const tablesDb = new TablesDB(client);

const TEST_USER_ID = 'test-user-001';

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-food',
    name: 'Food & Beverage',
    description:
      'Restaurants, cafes, coffee shops, bubble tea, hawker centres, food delivery (GrabFood, Foodpanda, Deliveroo)',
    icon: '🍔',
    color: '#ef4444',
    sort_order: 1,
  },
  {
    id: 'cat-transport',
    name: 'Transportation',
    description:
      'Public transit (MRT, bus), ride-hailing (Grab, Gojek), fuel, parking, ERP charges',
    icon: '🚗',
    color: '#f97316',
    sort_order: 2,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    description:
      'Retail purchases, clothing, electronics, online shopping (Shopee, Lazada, Amazon)',
    icon: '🛍️',
    color: '#eab308',
    sort_order: 3,
  },
  {
    id: 'cat-entertain',
    name: 'Entertainment',
    description: 'Movies, concerts, streaming subscriptions (Netflix, Spotify), games, nightlife',
    icon: '🎬',
    color: '#22c55e',
    sort_order: 4,
  },
  {
    id: 'cat-bills',
    name: 'Bills & Utilities',
    description:
      'Electricity, water, gas, internet, phone bill, insurance premiums, loan repayments',
    icon: '💡',
    color: '#3b82f6',
    sort_order: 5,
  },
  {
    id: 'cat-travel',
    name: 'Travel',
    description: 'Flights, hotels, travel insurance, overseas purchases, airport transfers',
    icon: '✈️',
    color: '#8b5cf6',
    sort_order: 6,
  },
  {
    id: 'cat-invest',
    name: 'Investment',
    description:
      'Stocks, crypto, ETFs, robo-advisors (StashAway, Syfe, Endowus), fixed deposits, bonds',
    icon: '📈',
    color: '#a78bfa',
    sort_order: 7,
  },
  {
    id: 'cat-other',
    name: 'Other',
    description: "Anything that doesn't fit — miscellaneous or one-off expenses",
    icon: '📦',
    color: '#6b7280',
    sort_order: 8,
  },
];

const MOCK_TRANSACTIONS = [
  {
    vendor: 'GRAB *GRABFOOD',
    amount: 18.5,
    category: 'cat-food',
    date: '2026-02-01T12:30:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'MRT TOP-UP',
    amount: 20.0,
    category: 'cat-transport',
    date: '2026-02-01T08:15:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'NETFLIX.COM',
    amount: 15.98,
    category: 'cat-entertain',
    date: '2026-02-01T00:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'YA KUN KAYA TOAST',
    amount: 5.8,
    category: 'cat-food',
    date: '2026-02-02T07:45:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'SHOPEE SG',
    amount: 45.9,
    category: 'cat-shopping',
    date: '2026-02-03T14:20:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'GRAB *RIDE',
    amount: 12.3,
    category: 'cat-transport',
    date: '2026-02-03T09:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'SP GROUP',
    amount: 85.6,
    category: 'cat-bills',
    date: '2026-02-04T00:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'DIGITALOCEAN.COM',
    amount: 16.23,
    category: 'cat-bills',
    date: '2026-02-08T09:31:00+08:00',
    confidence: 'medium',
  },
  {
    vendor: 'STARBUCKS VIVOCITY',
    amount: 8.9,
    category: 'cat-food',
    date: '2026-02-05T15:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'GOLDEN VILLAGE',
    amount: 13.5,
    category: 'cat-entertain',
    date: '2026-02-06T19:30:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'SINGTEL MOBILE',
    amount: 48.0,
    category: 'cat-bills',
    date: '2026-02-07T00:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'AMAZON.SG',
    amount: 89.99,
    category: 'cat-shopping',
    date: '2026-02-08T11:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'SCOOT AIRLINES',
    amount: 250.0,
    category: 'cat-travel',
    date: '2026-02-09T10:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'FAIRPRICE FINEST',
    amount: 62.3,
    category: 'cat-food',
    date: '2026-02-10T18:45:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'CIRCLES.LIFE',
    amount: 28.0,
    category: 'cat-bills',
    date: '2026-02-10T00:00:00+08:00',
    confidence: 'medium',
  },
  {
    vendor: 'LAZADA SG',
    amount: 35.5,
    category: 'cat-shopping',
    date: '2026-02-11T16:20:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'SPOTIFY',
    amount: 9.99,
    category: 'cat-entertain',
    date: '2026-02-11T00:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'COMFORT DELGRO TAXI',
    amount: 15.4,
    category: 'cat-transport',
    date: '2026-02-12T22:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'UNIQLO ION ORCHARD',
    amount: 79.9,
    category: 'cat-shopping',
    date: '2026-02-13T13:30:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'BOON TONG KEE',
    amount: 28.0,
    category: 'cat-food',
    date: '2026-02-14T19:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'KLOOK TRAVEL',
    amount: 120.0,
    category: 'cat-travel',
    date: '2026-02-15T09:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'STASHAWAY',
    amount: 500.0,
    category: 'cat-invest',
    date: '2026-02-15T10:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'SYFE TRADE',
    amount: 200.0,
    category: 'cat-invest',
    date: '2026-02-16T09:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'UNKNOWN MERCHANT XYZ',
    amount: 10.0,
    category: 'cat-other',
    date: '2026-02-16T14:00:00+08:00',
    confidence: 'low',
  },
  {
    vendor: "MCDONALD'S BEDOK",
    amount: 9.8,
    category: 'cat-food',
    date: '2026-02-17T12:15:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'GOJEK RIDE',
    amount: 8.5,
    category: 'cat-transport',
    date: '2026-02-18T08:30:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'CATHAY CINEPLEXES',
    amount: 14.0,
    category: 'cat-entertain',
    date: '2026-02-19T20:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'NTUC INCOME INSURANCE',
    amount: 180.0,
    category: 'cat-bills',
    date: '2026-02-20T00:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'DAISO SINGAPORE',
    amount: 6.8,
    category: 'cat-shopping',
    date: '2026-02-21T17:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'HAI DI LAO CLARKE QUAY',
    amount: 55.0,
    category: 'cat-food',
    date: '2026-02-22T19:30:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'GRAB *RIDE',
    amount: 22.1,
    category: 'cat-transport',
    date: '2026-02-23T23:00:00+08:00',
    confidence: 'high',
  },
  {
    vendor: 'AWS',
    amount: 12.5,
    category: 'cat-bills',
    date: '2026-02-24T00:00:00+08:00',
    confidence: 'medium',
  },
];

const MOCK_BUDGETS = [
  { category: 'cat-food', amount: 400.0 },
  { category: 'cat-transport', amount: 150.0 },
  { category: 'cat-shopping', amount: 300.0 },
  { category: 'cat-entertain', amount: 100.0 },
  { category: 'cat-bills', amount: 500.0 },
  { category: 'cat-travel', amount: 400.0 },
  { category: 'cat-invest', amount: 800.0 },
  { category: 'cat-other', amount: 50.0 },
];

const MOCK_VENDOR_CACHE = [
  { vendor_name: 'GRAB *GRABFOOD', category: 'cat-food', hit_count: 15 },
  { vendor_name: 'GRAB *RIDE', category: 'cat-transport', hit_count: 22 },
  { vendor_name: 'NETFLIX.COM', category: 'cat-entertain', hit_count: 6 },
  { vendor_name: 'SP GROUP', category: 'cat-bills', hit_count: 6 },
  { vendor_name: 'DIGITALOCEAN.COM', category: 'cat-bills', hit_count: 12 },
  { vendor_name: 'SINGTEL MOBILE', category: 'cat-bills', hit_count: 6 },
  { vendor_name: 'SPOTIFY', category: 'cat-entertain', hit_count: 6 },
];

async function seed(): Promise<void> {
  console.log('🌱 Seeding test database...\n');

  // Seed user
  await tablesDb.createRow({
    databaseId: DB_ID,
    tableId: 'users',
    rowId: TEST_USER_ID,
    data: {
      email: 'testuser@example.com',
      name: 'Test User',
      avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
      inbound_email: `user-${TEST_USER_ID}@inbound.yourdomain.com`,
      oauth_provider: 'google',
      monthly_salary: 6000.0,
      budget_mode: 'direct',
    },
  });
  console.log('✅ Test user created');

  // Seed categories
  for (const cat of DEFAULT_CATEGORIES) {
    await tablesDb.createRow({
      databaseId: DB_ID,
      tableId: 'categories',
      rowId: cat.id,
      data: {
        user_id: TEST_USER_ID,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        is_default: true,
        sort_order: cat.sort_order,
      },
    });
  }
  console.log(`✅ ${DEFAULT_CATEGORIES.length} categories seeded`);

  // Seed transactions
  for (const tx of MOCK_TRANSACTIONS) {
    await tablesDb.createRow({
      databaseId: DB_ID,
      tableId: 'transactions',
      rowId: ID.unique(),
      data: {
        user_id: TEST_USER_ID,
        category_id: tx.category,
        amount: tx.amount,
        vendor: tx.vendor,
        description: '',
        transaction_date: tx.date,
        resend_email_id: `mock-${ID.unique()}`,
        raw_email_subject: `Transaction alert: ${tx.vendor}`,
        confidence: tx.confidence,
        source: 'email',
      },
    });
  }
  console.log(`✅ ${MOCK_TRANSACTIONS.length} transactions seeded`);

  // Seed budgets
  for (const budget of MOCK_BUDGETS) {
    await tablesDb.createRow({
      databaseId: DB_ID,
      tableId: 'budgets',
      rowId: ID.unique(),
      data: {
        user_id: TEST_USER_ID,
        category_id: budget.category,
        amount: budget.amount,
        year: 2026,
        month: 2,
      },
    });
  }
  console.log(`✅ ${MOCK_BUDGETS.length} budgets seeded`);

  // Seed vendor cache
  for (const vc of MOCK_VENDOR_CACHE) {
    await tablesDb.createRow({
      databaseId: DB_ID,
      tableId: 'vendor_cache',
      rowId: ID.unique(),
      data: {
        user_id: TEST_USER_ID,
        vendor_name: vc.vendor_name,
        category_id: vc.category,
        hit_count: vc.hit_count,
      },
    });
  }
  console.log(`✅ ${MOCK_VENDOR_CACHE.length} vendor cache entries seeded`);

  // Summary
  const totalSpent = MOCK_TRANSACTIONS.reduce((sum, tx) => sum + tx.amount, 0);
  const totalBudget = MOCK_BUDGETS.reduce((sum, b) => sum + b.amount, 0);
  console.log(`\n📊 Summary:`);
  console.log(`   Transactions: ${MOCK_TRANSACTIONS.length}`);
  console.log(`   Total Spent:  SGD ${totalSpent.toFixed(2)}`);
  console.log(`   Total Budget: SGD ${totalBudget.toFixed(2)}`);
  console.log(`   Variance:     SGD ${(totalBudget - totalSpent).toFixed(2)}`);
  console.log('\n🎉 Test database seeded successfully!');
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
