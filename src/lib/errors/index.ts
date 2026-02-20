/**
 * Application error classes.
 *
 * All domain-specific and shared errors live here so services
 * stay focused on business logic only.
 */

// ---------------------------------------------------------------------------
// Shared errors
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ---------------------------------------------------------------------------
// Budget domain
// ---------------------------------------------------------------------------

export class BudgetNotFoundError extends Error {
  constructor(budgetId: string) {
    super(`Budget ${budgetId} not found`);
    this.name = 'BudgetNotFoundError';
  }
}

export class BudgetAlreadyExistsError extends Error {
  constructor(categoryId: string, year: number, month: number) {
    super(
      `Budget already exists for category ${categoryId} in ${year}-${String(month).padStart(2, '0')}`
    );
    this.name = 'BudgetAlreadyExistsError';
  }
}

// ---------------------------------------------------------------------------
// Category domain
// ---------------------------------------------------------------------------

export class CategoryNotFoundError extends Error {
  constructor(categoryId: string) {
    super(`Category ${categoryId} not found`);
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Category "${name}" already exists`);
    this.name = 'CategoryAlreadyExistsError';
  }
}

export class SystemCategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemCategoryError';
  }
}
