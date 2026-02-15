import type { ICategoryRepository } from '../interfaces';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';

/**
 * Default categories per DATABASE_SCHEMA.md.
 * Seeded for each new user on first login.
 */
const DEFAULT_CATEGORIES = [
  {
    name: 'Food & Beverage',
    description:
      'Restaurants, cafes, coffee shops, bubble tea, hawker centres, food delivery (GrabFood, Foodpanda, Deliveroo)',
    icon: '🍔',
    color: '#ef4444',
  },
  {
    name: 'Transportation',
    description:
      'Public transit (MRT, bus), ride-hailing (Grab, Gojek), fuel, parking, ERP charges',
    icon: '🚗',
    color: '#f97316',
  },
  {
    name: 'Shopping',
    description:
      'Retail purchases, clothing, electronics, online shopping (Shopee, Lazada, Amazon)',
    icon: '🛍️',
    color: '#eab308',
  },
  {
    name: 'Entertainment',
    description: 'Movies, concerts, streaming subscriptions (Netflix, Spotify), games, nightlife',
    icon: '🎬',
    color: '#22c55e',
  },
  {
    name: 'Bills & Utilities',
    description:
      'Electricity, water, gas, internet, phone bill, insurance premiums, loan repayments',
    icon: '💡',
    color: '#3b82f6',
  },
  {
    name: 'Travel',
    description: 'Flights, hotels, travel insurance, overseas purchases, airport transfers',
    icon: '✈️',
    color: '#8b5cf6',
  },
  {
    name: 'Investment',
    description:
      'Stocks, crypto, ETFs, robo-advisors (StashAway, Syfe, Endowus), fixed deposits, bonds',
    icon: '📈',
    color: '#a78bfa',
  },
  {
    name: 'Other',
    description: "Anything that doesn't fit — miscellaneous or one-off expenses",
    icon: '📦',
    color: '#6b7280',
  },
];

export class InMemoryCategoryRepository implements ICategoryRepository {
  private store: Map<string, Category> = new Map();

  findById(id: string): Promise<Category | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByUserId(userId: string): Promise<Category[]> {
    return Promise.resolve(
      Array.from(this.store.values())
        .filter((c) => c.userId === userId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }

  findByUserIdAndName(userId: string, name: string): Promise<Category | null> {
    const lower = name.toLowerCase();
    for (const c of this.store.values()) {
      if (c.userId === userId && c.name.toLowerCase() === lower) {return Promise.resolve(c);}
    }
    return Promise.resolve(null);
  }

  create(data: CategoryCreate): Promise<Category> {
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
    return Promise.resolve(category);
  }

  update(id: string, data: CategoryUpdate): Promise<Category> {
    const existing = this.store.get(id);
    if (!existing) {return Promise.reject(new Error(`Category ${id} not found`));}

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
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }

  async seedDefaults(userId: string): Promise<Category[]> {
    const categories: Category[] = [];
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const def = DEFAULT_CATEGORIES[i];
      const category = await this.create({
        userId: userId,
        name: def.name,
        description: def.description,
        icon: def.icon,
        color: def.color,
        isDefault: true,
        sortOrder: i + 1,
      });
      categories.push(category);
    }
    return categories;
  }

  /** Test helper: reset the store */
  reset(): void {
    this.store.clear();
  }

  /** Test helper: seed a category with a specific ID */
  seed(category: Category): void {
    this.store.set(category.id, category);
  }
}
