/**
 * Integration tests — User Profile API routes.
 *
 * Tests GET/PATCH /api/user/profile through the route handlers
 * with InMemory repositories and mocked auth.
 *
 * Pattern: Prepare → Act → Assert
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createGetRequest,
  createPatchRequest,
  MOCK_USER,
} from '../helpers/request';
import { seedUsers, seedCategories } from '../helpers/seed';

import type { AuthenticatedUser } from '@/lib/auth/middleware';

import { HttpStatus } from '@/lib/constants';
import { InMemoryCategoryRepository } from '@/lib/repositories/in-memory/category.repository';
import { InMemoryUserRepository } from '@/lib/repositories/in-memory/user.repository';
import { AuthService } from '@/lib/services/auth.service';

// ---------------------------------------------------------------------------
// Mock setup — must be before route imports
// ---------------------------------------------------------------------------

let _mockUser: AuthenticatedUser | null = MOCK_USER;

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(() => Promise.resolve(_mockUser)),
}));

const _containerRef: {
  authService: AuthService | null;
} = { authService: null };

vi.mock('@/lib/container/container', () => ({
  createContainer: vi.fn(() => Promise.resolve(_containerRef)),
}));

import { GET, PATCH } from '@/app/api/user/profile/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROFILE_PATH = '/api/user/profile';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Integration: User Profile API Routes', () => {
  let userRepo: InMemoryUserRepository;
  let categoryRepo: InMemoryCategoryRepository;

  beforeAll(() => {
    process.env.PROJECT_ENV = 'dev';
  });

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    categoryRepo = new InMemoryCategoryRepository();

    const authService = new AuthService(userRepo, categoryRepo);

    seedUsers(userRepo);
    seedCategories(categoryRepo);

    _containerRef.authService = authService;
    _mockUser = MOCK_USER;
  });

  // =========================================================================
  // GET /api/user/profile
  // =========================================================================
  describe('GET /api/user/profile', () => {
    it('should return user profile for authenticated user', async () => {
      // ---- Act ----
      const response = await GET(createGetRequest(PROFILE_PATH));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.user).toBeDefined();
      expect(body.user.id).toBe(MOCK_USER.accountId);
      expect(body.user.email).toBe('testuser@example.com');
      expect(body.user.monthlySalary).toBe(6000);
      expect(body.user.budgetMode).toBe('direct');
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await GET(createGetRequest(PROFILE_PATH));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  // =========================================================================
  // PATCH /api/user/profile
  // =========================================================================
  describe('PATCH /api/user/profile', () => {
    it('should update monthly salary', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest(PROFILE_PATH, { monthlySalary: 7500 })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.user.monthlySalary).toBe(7500);
    });

    it('should update budget mode to percentage', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest(PROFILE_PATH, { budgetMode: 'percentage' })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.user.budgetMode).toBe('percentage');
    });

    it('should update both salary and budget mode', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest(PROFILE_PATH, {
          monthlySalary: 8000,
          budgetMode: 'percentage',
        })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.OK);
      const body = await response.json();
      expect(body.user.monthlySalary).toBe(8000);
      expect(body.user.budgetMode).toBe('percentage');
    });

    it('should return 400 for invalid budget mode', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest(PROFILE_PATH, { budgetMode: 'invalid' })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for empty body', async () => {
      // ---- Act ----
      const response = await PATCH(createPatchRequest(PROFILE_PATH, {}));

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for negative salary', async () => {
      // ---- Act ----
      const response = await PATCH(
        createPatchRequest(PROFILE_PATH, { monthlySalary: -100 })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 when unauthenticated', async () => {
      // ---- Prepare ----
      _mockUser = null;

      // ---- Act ----
      const response = await PATCH(
        createPatchRequest(PROFILE_PATH, { monthlySalary: 5000 })
      );

      // ---- Assert ----
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
