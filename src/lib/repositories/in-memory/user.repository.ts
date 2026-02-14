import type { IUserRepository } from '../interfaces';
import type { User, UserCreate, UserUpdate } from '@/types/user';

export class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async create(id: string, data: UserCreate): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      inboundEmail: `user-${id}@inbound.aura.app`,
      oauthProvider: data.oauthProvider,
      monthlySalary: null,
      budgetMode: 'direct',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async update(id: string, data: UserUpdate): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error(`User not found: ${id}`);

    const updated: User = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  /** Test helper: clear all data. */
  reset(): void {
    this.users.clear();
  }
}
