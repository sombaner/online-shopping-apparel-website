/**
 * Error Envelope Helper
 *
 * Provides standardized error response formatting.
 */

/**
 * Creates a standardized error response object
 * @param {string} code - Error code
 * @param {string} message - Human-readable error message
 * @param {string} [correlationId] - Request correlation ID
 * @param {object} [details] - Additional error details
 * @returns {object} Error envelope
 */
export function createErrorEnvelope(
  code,
  message,
  correlationId = null,
  details = null
) {
  const envelope = {
    error: {
      code,
      message,
    },
  };

  if (correlationId) {
    envelope.error.correlationId = correlationId;
  }

  if (details) {
    envelope.error.details = details;
  }

  return envelope;
}

/**
 * Error codes enum
 */
export const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',

  // Registration errors
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',

  // Token errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

/**
 * Application error class for custom error handling
 */
export class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }

  toEnvelope(correlationId = null) {
    return createErrorEnvelope(
      this.code,
      this.message,
      correlationId,
      this.details
    );
  }
}

export default {
  createErrorEnvelope,
  ErrorCodes,
  AppError,
};
