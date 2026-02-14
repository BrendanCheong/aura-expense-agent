/**
 * Mappers between Appwrite TablesDB row format (snake_case) and
 * domain types (camelCase). Keeps the domain layer clean of
 * Appwrite-specific concerns.
 */

import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import type { Budget, BudgetCreate, BudgetUpdate } from '@/types/budget';
import type { VendorCacheEntry } from '@/types/vendor-cache';
import type { User, UserCreate, UserUpdate } from '@/types/user';
import type { Models } from 'node-appwrite';
import type {
  UserRow,
  CategoryRow,
  TransactionRow,
  BudgetRow,
  VendorCacheRow,
} from '@/types/appwrite/rows';

// ---------------------------------------------------------------------------
// Row data types (for create/update — excludes Models.Row base fields)
// ---------------------------------------------------------------------------

export type TransactionRowData = Omit<TransactionRow, keyof Models.Row>;
export type CategoryRowData = Omit<CategoryRow, keyof Models.Row>;
export type BudgetRowData = Omit<BudgetRow, keyof Models.Row>;
export type VendorCacheRowData = Omit<VendorCacheRow, keyof Models.Row>;
export type UserRowData = Omit<UserRow, keyof Models.Row>;

// ---------------------------------------------------------------------------
// Row → Domain
// ---------------------------------------------------------------------------

export function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.$id,
    userId: row.user_id,
    categoryId: row.category_id,
    amount: row.amount,
    vendor: row.vendor,
    description: row.description ?? '',
    transactionDate: row.transaction_date,
    resendEmailId: row.resend_email_id ?? null,
    rawEmailSubject: row.raw_email_subject ?? '',
    confidence: row.confidence as Transaction['confidence'],
    source: row.source as Transaction['source'],
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

export function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.$id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? '',
    icon: row.icon ?? '📦',
    color: row.color ?? '#6366f1',
    isDefault: row.is_default ?? false,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

export function mapRowToBudget(row: BudgetRow): Budget {
  return {
    id: row.$id,
    userId: row.user_id,
    categoryId: row.category_id,
    amount: row.amount,
    year: row.year,
    month: row.month,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

export function mapRowToVendorCacheEntry(row: VendorCacheRow): VendorCacheEntry {
  return {
    id: row.$id,
    userId: row.user_id,
    vendorName: row.vendor_name,
    categoryId: row.category_id,
    hitCount: row.hit_count,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Domain → Row (for create/update operations)
// ---------------------------------------------------------------------------

export function mapTransactionToRow(data: TransactionCreate): TransactionRowData {
  return {
    user_id: data.userId,
    category_id: data.categoryId,
    amount: data.amount,
    vendor: data.vendor,
    description: data.description,
    transaction_date: data.transactionDate,
    resend_email_id: data.resendEmailId,
    raw_email_subject: data.rawEmailSubject,
    confidence: data.confidence,
    source: data.source,
  };
}

export function mapTransactionUpdateToRow(data: TransactionUpdate): Partial<TransactionRowData> {
  const row: Partial<TransactionRowData> = {};
  if (data.categoryId !== undefined) row.category_id = data.categoryId;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.vendor !== undefined) row.vendor = data.vendor;
  if (data.description !== undefined) row.description = data.description;
  if (data.transactionDate !== undefined) row.transaction_date = data.transactionDate;
  if (data.confidence !== undefined) row.confidence = data.confidence;
  return row;
}

export function mapCategoryToRow(data: CategoryCreate): CategoryRowData {
  return {
    user_id: data.userId,
    name: data.name,
    description: data.description,
    icon: data.icon ?? '📦',
    color: data.color ?? '#6366f1',
    is_default: data.isDefault,
    sort_order: data.sortOrder,
  };
}

export function mapCategoryUpdateToRow(data: CategoryUpdate): Partial<CategoryRowData> {
  const row: Partial<CategoryRowData> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.description !== undefined) row.description = data.description;
  if (data.icon !== undefined) row.icon = data.icon;
  if (data.color !== undefined) row.color = data.color;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  return row;
}

export function mapBudgetToRow(data: BudgetCreate): BudgetRowData {
  return {
    user_id: data.userId,
    category_id: data.categoryId,
    amount: data.amount,
    year: data.year,
    month: data.month,
  };
}

export function mapBudgetUpdateToRow(data: BudgetUpdate): Partial<BudgetRowData> {
  const row: Partial<BudgetRowData> = {};
  if (data.amount !== undefined) row.amount = data.amount;
  return row;
}

// ---------------------------------------------------------------------------
// User mappers
// ---------------------------------------------------------------------------

export function mapRowToUser(row: UserRow): User {
  return {
    id: row.$id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url ?? '',
    inboundEmail: row.inbound_email ?? '',
    oauthProvider: row.oauth_provider as User['oauthProvider'],
    monthlySalary: row.monthly_salary ?? null,
    budgetMode: (row.budget_mode ?? 'direct') as User['budgetMode'],
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

export function mapUserToRow(data: UserCreate): UserRowData {
  return {
    email: data.email,
    name: data.name,
    avatar_url: data.avatarUrl,
    inbound_email: '',
    oauth_provider: data.oauthProvider,
    monthly_salary: 0,
    budget_mode: 'direct',
  };
}

export function mapUserUpdateToRow(data: UserUpdate): Partial<UserRowData> {
  const row: Partial<UserRowData> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.avatarUrl !== undefined) row.avatar_url = data.avatarUrl;
  if (data.monthlySalary !== undefined) row.monthly_salary = data.monthlySalary ?? 0;
  if (data.budgetMode !== undefined) row.budget_mode = data.budgetMode;
  return row;
}
