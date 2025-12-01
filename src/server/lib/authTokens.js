/**
 * Auth Tokens Module
 *
 * Handles JWT token issuance and verification for authentication.
 * - Access tokens: Short-lived tokens for API access
 * - Refresh tokens: Long-lived tokens for obtaining new access tokens
 * - Email verification tokens: For email verification flow
 * - Password reset tokens: For password reset flow
 */

import crypto from 'crypto';

import jwt from 'jsonwebtoken';


// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const EMAIL_VERIFICATION_TOKEN_EXPIRY = '24h';
const PASSWORD_RESET_TOKEN_EXPIRY = '1h';

/**
 * Gets the JWT secret from environment variables
 * @returns {string} JWT secret
 * @throws {Error} If JWT_SECRET is not configured
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return secret;
}

/**
 * Generates an access token for a user
 * @param {object} payload - Token payload containing user data
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string[]} [payload.roles] - User roles
 * @returns {string} Signed JWT access token
 */
export function generateAccessToken(payload) {
  const { userId, email, roles = [] } = payload;

  return jwt.sign(
    {
      sub: userId,
      email,
      roles,
      type: 'access',
    },
    getJwtSecret(),
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
}

/**
 * Generates a refresh token for a user
 * @param {object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @returns {string} Signed JWT refresh token
 */
export function generateRefreshToken(payload) {
  const { userId } = payload;

  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      jti: crypto.randomUUID(),
    },
    getJwtSecret(),
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
}

/**
 * Generates an email verification token
 * @param {object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - Email to verify
 * @returns {string} Signed JWT email verification token
 */
export function generateEmailVerificationToken(payload) {
  const { userId, email } = payload;

  return jwt.sign(
    {
      sub: userId,
      email,
      type: 'email_verification',
    },
    getJwtSecret(),
    {
      expiresIn: EMAIL_VERIFICATION_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
}

/**
 * Generates a password reset token
 * @param {object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @returns {string} Signed JWT password reset token
 */
export function generatePasswordResetToken(payload) {
  const { userId, email } = payload;

  return jwt.sign(
    {
      sub: userId,
      email,
      type: 'password_reset',
    },
    getJwtSecret(),
    {
      expiresIn: PASSWORD_RESET_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
}

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} [expectedType] - Expected token type (access, refresh, email_verification, password_reset)
 * @returns {{ valid: boolean, payload?: object, error?: string }} Verification result
 */
export function verifyToken(token, expectedType = null) {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });

    if (expectedType && payload.type !== expectedType) {
      return {
        valid: false,
        error: `Invalid token type. Expected ${expectedType}, got ${payload.type}`,
      };
    }

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        error: 'Token has expired',
      };
    }

    if (error.name === 'JsonWebTokenError') {
      return {
        valid: false,
        error: 'Invalid token',
      };
    }

    return {
      valid: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * Decodes a JWT token without verification (for reading expired tokens)
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded payload or null if invalid
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

/**
 * Returns token configuration
 * @returns {object} Token expiry configuration
 */
export function getTokenConfig() {
  return {
    accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
    emailVerificationTokenExpiry: EMAIL_VERIFICATION_TOKEN_EXPIRY,
    passwordResetTokenExpiry: PASSWORD_RESET_TOKEN_EXPIRY,
  };
}

export default {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  decodeToken,
  getTokenConfig,
};
