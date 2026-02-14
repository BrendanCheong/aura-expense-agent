/**
 * Category service — business logic for expense categories.
 *
 * Will be fully implemented during feature development.
 */

import type {
  ICategoryRepository,
  IVendorCacheRepository,
  IBudgetRepository,
} from '@/lib/repositories/interfaces';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';

export class CategoryService {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly vendorCacheRepo: IVendorCacheRepository,
    private readonly budgetRepo: IBudgetRepository,
  ) {}

  async listCategories(userId: string): Promise<Category[]> {
    return this.categoryRepo.findByUserId(userId);
  }

  async createCategory(userId: string, data: Omit<CategoryCreate, 'userId'>): Promise<Category> {
    const existing = await this.categoryRepo.findByUserIdAndName(userId, data.name);
    if (existing) {
      throw new Error(`Category "${data.name}" already exists`);
    }
    return this.categoryRepo.create({ ...data, userId: userId });
  }

  async updateCategory(userId: string, categoryId: string, data: CategoryUpdate): Promise<Category> {
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
    await this.vendorCacheRepo.deleteByCategoryId(categoryId);
    await this.budgetRepo.deleteByCategoryId(categoryId);
    await this.categoryRepo.delete(categoryId);
  }

  async seedDefaults(userId: string): Promise<Category[]> {
    return this.categoryRepo.seedDefaults(userId);
  }
}
