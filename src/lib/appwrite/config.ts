/**
 * Appwrite configuration constants.
 * Maps to environment variables set in .env.
 */
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '',
  databaseId: process.env.APPWRITE_DATABASE_ID ?? '',
  tables: {
    users: process.env.APPWRITE_USERS_COLLECTION_ID ?? '',
    transactions: process.env.APPWRITE_TRANSACTIONS_COLLECTION_ID ?? '',
    categories: process.env.APPWRITE_CATEGORIES_COLLECTION_ID ?? '',
    budgets: process.env.APPWRITE_BUDGETS_COLLECTION_ID ?? '',
    vendorCache: process.env.APPWRITE_VENDOR_CACHE_COLLECTION_ID ?? '',
  },
} as const;
