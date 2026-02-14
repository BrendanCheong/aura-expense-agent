import type { ICategoryRepository } from '../interfaces';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
  { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
  { name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
  { name: 'Bills & Utilities', icon: '💡', color: '#FFEAA7' },
  { name: 'Health & Fitness', icon: '💪', color: '#DDA0DD' },
  { name: 'Travel', icon: '✈️', color: '#98D8C8' },
  { name: 'Education', icon: '📚', color: '#F7DC6F' },
  { name: 'Other', icon: '📦', color: '#BDC3C7' },
];

export class InMemoryCategoryRepository implements ICategoryRepository {
  private store: Map<string, Category> = new Map();

  async findById(id: string): Promise<Category | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return Array.from(this.store.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Category | null> {
    const lower = name.toLowerCase();
    for (const c of this.store.values()) {
      if (c.userId === userId && c.name.toLowerCase() === lower) return c;
    }
    return null;
  }

  async create(data: CategoryCreate): Promise<Category> {
    const now = new Date().toISOString();
    const category: Category = {
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
      description: data.description ?? '',
      icon: data.icon ?? '📦',
      color: data.color ?? '#BDC3C7',
      isDefault: data.isDefault ?? false,
      sortOrder: data.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(category.id, category);
    return category;
  }

  async update(id: string, data: CategoryUpdate): Promise<Category> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Category ${id} not found`);

    const updated: Category = {
      ...existing,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async seedDefaults(userId: string): Promise<Category[]> {
    const categories: Category[] = [];
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const def = DEFAULT_CATEGORIES[i];
      const category = await this.create({
        userId: userId,
        name: def.name,
        description: '',
        icon: def.icon,
        color: def.color,
        isDefault: true,
        sortOrder: i,
      });
      categories.push(category);
    }
    return categories;
  }

  /** Test helper: reset the store */
  reset(): void {
    this.store.clear();
  }
}
