/**
 * Appwrite configuration constants.
 *
 * Table IDs are hardcoded — they match the `$id` values in appwrite.config.json
 * and are stable across environments. Only the database ID comes from env vars
 * because it differs between dev/staging/production databases.
 */
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '',
  databaseId: process.env.APPWRITE_DATABASE_ID ?? '',
  tables: {
    users: 'users',
    transactions: 'transactions',
    categories: 'categories',
    budgets: 'budgets',
    vendorCache: 'vendor_cache',
  },
} as const;
