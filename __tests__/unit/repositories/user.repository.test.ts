import { describe, it, expect, beforeEach } from 'vitest';

import type { User } from '@/types/user';

import { OAuthProvider, BudgetMode } from '@/lib/enums';
import { InMemoryUserRepository } from '@/lib/repositories/in-memory/user.repository';

describe('InMemoryUserRepository', () => {
  let repo: InMemoryUserRepository;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
  });

  describe('create', () => {
    it('should create a user with provided id', async () => {
      const user = await repo.create('user-1', {
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.avatarUrl).toBe('https://example.com/avatar.png');
      expect(user.oauthProvider).toBe(OAuthProvider.GOOGLE);
      expect(user.monthlySalary).toBeNull();
      expect(user.budgetMode).toBe(BudgetMode.DIRECT);
      expect(user.inboundEmail).toContain('user-1');
      expect(user.createdAt).toBeTruthy();
      expect(user.updatedAt).toBeTruthy();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      await repo.create('user-1', {
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      const found = await repo.findById('user-1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe('user-1');
    });

    it('should return null for non-existent id', async () => {
      const found = await repo.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      await repo.create('user-1', {
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GITHUB,
      });

      const found = await repo.findByEmail('test@example.com');
      expect(found).not.toBeNull();
      expect(found!.email).toBe('test@example.com');
      expect(found!.oauthProvider).toBe(OAuthProvider.GITHUB);
    });

    it('should return null for non-existent email', async () => {
      const found = await repo.findByEmail('nobody@example.com');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      await repo.create('user-1', {
        email: 'test@example.com',
        name: 'Old Name',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      const updated = await repo.update('user-1', {
        name: 'New Name',
        monthlySalary: 6000,
        budgetMode: BudgetMode.PERCENTAGE,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.monthlySalary).toBe(6000);
      expect(updated.budgetMode).toBe(BudgetMode.PERCENTAGE);
      expect(updated.email).toBe('test@example.com');
    });

    it('should throw for non-existent user', async () => {
      await expect(repo.update('non-existent', { name: 'Test' })).rejects.toThrow();
    });

    it('should only update provided fields', async () => {
      await repo.create('user-1', {
        email: 'test@example.com',
        name: 'Original',
        avatarUrl: 'https://example.com/avatar.png',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      const updated = await repo.update('user-1', { name: 'Changed' });
      expect(updated.name).toBe('Changed');
      expect(updated.avatarUrl).toBe('https://example.com/avatar.png');
    });
  });

  describe('reset', () => {
    it('should clear all users', async () => {
      await repo.create('user-1', {
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: '',
        oauthProvider: OAuthProvider.GOOGLE,
      });

      repo.reset();
      const found = await repo.findById('user-1');
      expect(found).toBeNull();
    });
  });
});
