/**
 * OAuth providers supported by the application
 */
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

/**
 * Budget calculation mode
 */
export enum BudgetMode {
  DIRECT = 'direct',
  PERCENTAGE = 'percentage',
}

/**
 * AI categorization confidence levels
 */
export enum Confidence {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Transaction source
 */
export enum TransactionSource {
  EMAIL = 'email',
  MANUAL = 'manual',
}
