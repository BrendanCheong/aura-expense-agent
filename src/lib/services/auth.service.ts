import type { IUserRepository } from '@/lib/repositories/interfaces';
import type { ICategoryRepository } from '@/lib/repositories/interfaces';
import type { User, UserCreate, UserUpdate } from '@/types/user';

/**
 * AuthService handles user authentication flow:
 * - getOrCreateUser: Creates user + seeds defaults on first login,
 *   updates profile info on subsequent logins.
 * - getUserById: Retrieves user by Appwrite account ID.
 * - updateUserProfile: Updates mutable profile fields.
 */
export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  /**
   * Get or create a user record after OAuth login.
   * On first login: creates user record + seeds 8 default categories.
   * On subsequent logins: updates name and avatar from OAuth provider.
   */
  async getOrCreateUser(accountId: string, data: UserCreate): Promise<User> {
    const existing = await this.userRepo.findById(accountId);

    if (existing) {
      // Update name and avatar in case they changed on the provider side
      if (existing.name !== data.name || existing.avatarUrl !== data.avatarUrl) {
        return this.userRepo.update(accountId, {
          name: data.name,
          avatarUrl: data.avatarUrl,
        });
      }
      return existing;
    }

    // New user — create record and seed defaults
    const user = await this.userRepo.create(accountId, data);
    await this.categoryRepo.seedDefaults(user.id);
    return user;
  }

  /**
   * Retrieve a user by their Appwrite account ID.
   */
  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  /**
   * Update a user's mutable profile fields.
   */
  async updateUserProfile(id: string, data: UserUpdate): Promise<User> {
    return this.userRepo.update(id, data);
  }
}
