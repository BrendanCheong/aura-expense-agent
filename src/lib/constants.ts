/**
 * HTTP Status Codes
 * Use these instead of magic numbers throughout API routes
 */
export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusValue = (typeof HttpStatus)[keyof typeof HttpStatus];

/**
 * Standardized error messages
 * Use these to ensure consistency across API responses
 */
export const ErrorMessage = {
  // Auth errors
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',

  // Request errors
  INVALID_JSON: 'Invalid JSON body',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  VALIDATION_FAILED: 'Validation failed',

  // Resource errors
  NOT_FOUND: 'Resource not found',
  USER_NOT_FOUND: 'User not found',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  CATEGORY_NOT_FOUND: 'Category not found',

  // Conflict errors
  ALREADY_EXISTS: 'Resource already exists',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  NOT_IMPLEMENTED: 'Not implemented',
} as const;

export type ErrorMessageKey = keyof typeof ErrorMessage;

export const SMITHERY_BRAVE_URL = 'https://server.smithery.ai/brave';
export const BRAVE_WEB_SEARCH_TOOL = 'brave_web_search';;
