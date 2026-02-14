import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types/transaction';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import type { Budget, BudgetCreate, BudgetUpdate } from '@/types/budget';
import type { VendorCacheEntry } from '@/types/vendor-cache';

// --- Shared Types ---

export interface TransactionQueryOptions {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  source?: 'email' | 'manual';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CategorySpendingSummary {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
}

// --- Transaction Repository ---

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, options: TransactionQueryOptions): Promise<PaginatedResult<Transaction>>;
  findByResendEmailId(resendEmailId: string): Promise<Transaction | null>;
  findByUserAndDateRange(userId: string, start: string, end: string): Promise<Transaction[]>;
  findByUserCategoryDateRange(userId: string, categoryId: string, start: string, end: string): Promise<Transaction[]>;
  create(data: TransactionCreate): Promise<Transaction>;
  update(id: string, data: TransactionUpdate): Promise<Transaction>;
  delete(id: string): Promise<void>;
  sumByUserCategoryDateRange(userId: string, start: string, end: string): Promise<CategorySpendingSummary[]>;
}

// --- Category Repository ---

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByUserId(userId: string): Promise<Category[]>;
  findByUserIdAndName(userId: string, name: string): Promise<Category | null>;
  create(data: CategoryCreate): Promise<Category>;
  update(id: string, data: CategoryUpdate): Promise<Category>;
  delete(id: string): Promise<void>;
  seedDefaults(userId: string): Promise<Category[]>;
}

// --- Budget Repository ---

export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findByUserAndPeriod(userId: string, year: number, month: number): Promise<Budget[]>;
  findByUserCategoryPeriod(userId: string, categoryId: string, year: number, month: number): Promise<Budget | null>;
  create(data: BudgetCreate): Promise<Budget>;
  update(id: string, data: BudgetUpdate): Promise<Budget>;
  delete(id: string): Promise<void>;
  deleteByCategoryId(categoryId: string): Promise<void>;
}

// --- Vendor Cache Repository ---

export interface IVendorCacheRepository {
  findByUserAndVendor(userId: string, vendorName: string): Promise<VendorCacheEntry | null>;
  findByUserId(userId: string): Promise<VendorCacheEntry[]>;
  create(userId: string, vendorName: string, categoryId: string): Promise<VendorCacheEntry>;
  updateCategoryId(id: string, categoryId: string): Promise<void>;
  incrementHitCount(id: string, currentCount: number): Promise<void>;
  deleteByCategoryId(categoryId: string): Promise<void>;
}
