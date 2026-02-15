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
      throw new Error(`Category "${data.name}" already exists`);
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
      throw new Error(`Category ${categoryId} not found`);
    }
    return this.categoryRepo.update(categoryId, data);
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category || category.userId !== userId) {
      throw new Error(`Category ${categoryId} not found`);
    }

    // Guard: "Other" system category cannot be deleted
    if (category.name === 'Other') {
      throw new Error('Cannot delete the "Other" system category');
    }

    // Find the "Other" category for this user to re-assign transactions
    const otherCategory = await this.categoryRepo.findByUserIdAndName(userId, 'Other');
    if (!otherCategory) {
      throw new Error('Cannot delete category: "Other" fallback category not found');
    }

    // Move all transactions from this category to "Other"
    const transactions = await this.transactionRepo.findByUserCategoryDateRange(
      userId,
      categoryId,
      '1970-01-01T00:00:00Z',
      '2099-12-31T23:59:59Z'
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
