/**
 * Category service — business logic for expense categories.
 *
 * Handles CRUD operations, cascade delete (transactions → Other,
 * vendor cache + budgets deleted), and "Other" system category protection.
 */

import type {
  ICategoryRepository,
  IVendorCacheRepository,
  IBudgetRepository,
  ITransactionRepository,
} from '@/lib/repositories/interfaces';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';

import { DEFAULT_CATEGORY_NAME, DATE_MIN, DATE_MAX } from '@/lib/constants';
import {
  CategoryNotFoundError,
  CategoryAlreadyExistsError,
  SystemCategoryError,
} from '@/lib/errors';

export class CategoryService {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  listCategories(userId: string): Promise<Category[]> {
    return this.categoryRepo.findByUserId(userId);
  }

  async createCategory(userId: string, data: Omit<CategoryCreate, 'userId'>): Promise<Category> {
    const existing = await this.categoryRepo.findByUserIdAndName(userId, data.name);
    if (existing) {
      throw new CategoryAlreadyExistsError(data.name);
    }
    return this.categoryRepo.create({ ...data, userId: userId });
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    data: CategoryUpdate
  ): Promise<Category> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category || category.userId !== userId) {
      throw new CategoryNotFoundError(categoryId);
    }
    return this.categoryRepo.update(categoryId, data);
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category || category.userId !== userId) {
      throw new CategoryNotFoundError(categoryId);
    }

    // Guard: "Other" system category cannot be deleted
    if (category.name === DEFAULT_CATEGORY_NAME) {
      throw new SystemCategoryError(`Cannot delete the "${DEFAULT_CATEGORY_NAME}" system category`);
    }

    // Find the "Other" category for this user to re-assign transactions
    const otherCategory = await this.categoryRepo.findByUserIdAndName(userId, DEFAULT_CATEGORY_NAME);
    if (!otherCategory) {
      throw new SystemCategoryError(`Cannot delete category: "${DEFAULT_CATEGORY_NAME}" fallback category not found`);
    }

    // Move all transactions from this category to "Other"
    const transactions = await this.transactionRepo.findByUserCategoryDateRange(
      userId,
      categoryId,
      DATE_MIN,
      DATE_MAX
    );
    for (const tx of transactions) {
      await this.transactionRepo.update(tx.id, { categoryId: otherCategory.id });
    }

    // Cascade: delete vendor cache entries and budgets
    await this.vendorCacheRepo.deleteByCategoryId(categoryId);
    await this.budgetRepo.deleteByCategoryId(categoryId);
    await this.categoryRepo.delete(categoryId);
  }

  seedDefaults(userId: string): Promise<Category[]> {
    return this.categoryRepo.seedDefaults(userId);
  }
}
