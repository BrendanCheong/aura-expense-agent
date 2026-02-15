import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/lib/services/auth.service';
import { InMemoryUserRepository } from '@/lib/repositories/in-memory/user.repository';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { OAuthProvider, BudgetMode } from '@/lib/enums';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: InMemoryUserRepository;
  let categoryRepo: InMemoryCategoryRepository;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    categoryRepo = new InMemoryCategoryRepository();
    authService = new AuthService(userRepo, categoryRepo);
  });

  describe('getOrCreateUser', () => {
    it('should create a new user on first login', async () => {
      const user = await authService.getOrCreateUser('user-1', {
        email: 'new@example.com',
        name: 'New User',
        avatarUrl: 'https://example.com/avatar.png',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('new@example.com');
      expect(user.name).toBe('New User');
    });

    it('should seed 8 default categories for new user', async () => {
      await authService.getOrCreateUser('user-1', {
        email: 'new@example.com',
        name: 'New User',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      const categories = await categoryRepo.findByUserId('user-1');
      expect(categories).toHaveLength(8);

      const names = categories.map((c) => c.name);
      expect(names).toContain('Food & Beverage');
      expect(names).toContain('Transportation');
      expect(names).toContain('Shopping');
      expect(names).toContain('Entertainment');
      expect(names).toContain('Bills & Utilities');
      expect(names).toContain('Travel');
      expect(names).toContain('Investment');
      expect(names).toContain('Other');
    });

    it('should return existing user without duplicating', async () => {
      // First login
      const first = await authService.getOrCreateUser('user-1', {
        email: 'existing@example.com',
        name: 'User',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GITHUB,
      });

      // Second login — same email
      const second = await authService.getOrCreateUser('user-1', {
        email: 'existing@example.com',
        name: 'User Updated',
        avatarUrl: 'https://new-avatar.png',
        oauthProvider: OAuthProvider.GITHUB,
      });

      expect(second.id).toBe(first.id);
      // Should NOT create duplicate categories
      const categories = await categoryRepo.findByUserId('user-1');
      expect(categories).toHaveLength(8);
    });

    it('should update name and avatar on returning login', async () => {
      await authService.getOrCreateUser('user-1', {
        email: 'user@example.com',
        name: 'Old Name',
        avatarUrl: 'https://old.png',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      const updated = await authService.getOrCreateUser('user-1', {
        email: 'user@example.com',
        name: 'New Name',
        avatarUrl: 'https://new.png',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.avatarUrl).toBe('https://new.png');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      await authService.getOrCreateUser('user-1', {
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      const user = await authService.getUserById('user-1');
      expect(user).not.toBeNull();
      expect(user!.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await authService.getUserById('non-existent');
      expect(user).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile fields', async () => {
      await authService.getOrCreateUser('user-1', {
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      const updated = await authService.updateUserProfile('user-1', {
        monthlySalary: 6000,
        budgetMode: BudgetMode.PERCENTAGE,
      });

      expect(updated.monthlySalary).toBe(6000);
      expect(updated.budgetMode).toBe(BudgetMode.PERCENTAGE);
    });

    it('should throw for non-existent user', async () => {
      await expect(
        authService.updateUserProfile('missing', { name: 'Test' }),
      ).rejects.toThrow();
    });
  });
});
