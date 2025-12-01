/**
 * Auth Service
 *
 * Handles user authentication operations including:
 * - User registration
 * - Login/authentication
 * - Email verification
 * - Password reset flow
 * - Token management
 */

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { validatePassword } from '../lib/passwordPolicy.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
} from '../lib/authTokens.js';
import { AppError, ErrorCodes } from '../lib/errors.js';

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from './emailService.js';

// Bcrypt salt rounds
const SALT_ROUNDS = 12;

// In-memory user store (to be replaced with repository layer)
const users = new Map();
const passwordResetTokens = new Map();

/**
 * Registers a new user
 * @param {object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} [userData.contactNumber] - Contact number (optional)
 * @returns {Promise<{ user: object, verificationToken: string }>} Registration result
 */
export async function register({
  email,
  password,
  firstName,
  lastName,
  contactNumber = null,
}) {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  if (users.has(normalizedEmail)) {
    throw new AppError(
      ErrorCodes.EMAIL_ALREADY_EXISTS,
      'An account with this email already exists',
      409
    );
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new AppError(
      ErrorCodes.INVALID_PASSWORD,
      'Password does not meet requirements',
      400,
      { errors: passwordValidation.errors }
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const userId = uuidv4();
  const now = new Date().toISOString();

  const user = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    contactNumber: contactNumber ? contactNumber.trim() : null,
    emailVerifiedAt: null,
    status: 'active',
    roles: ['buyer'],
    createdAt: now,
    updatedAt: now,
  };

  // Store user
  users.set(normalizedEmail, user);

  // Generate email verification token
  const verificationToken = generateEmailVerificationToken({
    userId,
    email: normalizedEmail,
  });

  // Send verification email
  await sendVerificationEmail({
    email: normalizedEmail,
    firstName: user.firstName,
    verificationToken,
  });

  // Return user (without sensitive data)
  return {
    user: sanitizeUser(user),
    verificationToken,
  };
}

/**
 * Authenticates a user with email and password
 * @param {object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>} Login result
 */
export async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const user = users.get(normalizedEmail);
  if (!user) {
    throw new AppError(
      ErrorCodes.INVALID_CREDENTIALS,
      'Invalid email or password',
      401
    );
  }

  // Check account status
  if (user.status === 'locked') {
    throw new AppError(
      ErrorCodes.ACCOUNT_LOCKED,
      'Account is locked. Please contact support.',
      403
    );
  }

  if (user.status === 'inactive') {
    throw new AppError(
      ErrorCodes.ACCOUNT_INACTIVE,
      'Account is inactive. Please contact support.',
      403
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(
      ErrorCodes.INVALID_CREDENTIALS,
      'Invalid email or password',
      401
    );
  }

  // Check email verification
  if (!user.emailVerifiedAt) {
    throw new AppError(
      ErrorCodes.EMAIL_NOT_VERIFIED,
      'Please verify your email address before logging in',
      403
    );
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    roles: user.roles,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Verifies a user's email address
 * @param {string} token - Email verification token
 * @returns {Promise<{ user: object }>} Verification result
 */
export async function verifyEmail(token) {
  const verification = verifyToken(token, 'email_verification');

  if (!verification.valid) {
    throw new AppError(
      ErrorCodes.INVALID_TOKEN,
      verification.error || 'Invalid verification token',
      400
    );
  }

  const { email } = verification.payload;

  // Find user
  const user = users.get(email);
  if (!user) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
  }

  // Check if already verified
  if (user.emailVerifiedAt) {
    return { user: sanitizeUser(user), alreadyVerified: true };
  }

  // Update user
  user.emailVerifiedAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();

  // Send welcome email
  await sendWelcomeEmail({
    email: user.email,
    firstName: user.firstName,
  });

  return { user: sanitizeUser(user), alreadyVerified: false };
}

/**
 * Resends the email verification email
 * @param {string} email - User email
 * @returns {Promise<{ success: boolean }>} Resend result
 */
export async function resendVerification(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = users.get(normalizedEmail);
  if (!user) {
    // Don't reveal if email exists - always return success
    return { success: true };
  }

  // Check if already verified
  if (user.emailVerifiedAt) {
    // Don't reveal verification status - always return success
    return { success: true };
  }

  // Generate new verification token
  const verificationToken = generateEmailVerificationToken({
    userId: user.id,
    email: normalizedEmail,
  });

  // Send verification email
  await sendVerificationEmail({
    email: normalizedEmail,
    firstName: user.firstName,
    verificationToken,
  });

  return { success: true };
}

/**
 * Initiates password reset flow
 * @param {string} email - User email
 * @returns {Promise<{ success: boolean }>} Request result
 */
export async function requestPasswordReset(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = users.get(normalizedEmail);
  if (!user) {
    // Don't reveal if email exists - always return success
    return { success: true };
  }

  // Generate password reset token
  const resetToken = generatePasswordResetToken({
    userId: user.id,
    email: normalizedEmail,
  });

  // Store token for later validation (in production, store hash in DB)
  passwordResetTokens.set(user.id, {
    token: resetToken,
    createdAt: new Date().toISOString(),
  });

  // Send password reset email
  await sendPasswordResetEmail({
    email: normalizedEmail,
    firstName: user.firstName,
    resetToken,
  });

  return { success: true };
}

/**
 * Resets user password using reset token
 * @param {object} params - Reset parameters
 * @param {string} params.token - Password reset token
 * @param {string} params.newPassword - New password
 * @returns {Promise<{ success: boolean }>} Reset result
 */
export async function resetPassword({ token, newPassword }) {
  const verification = verifyToken(token, 'password_reset');

  if (!verification.valid) {
    throw new AppError(
      ErrorCodes.INVALID_TOKEN,
      verification.error || 'Invalid or expired reset token',
      400
    );
  }

  const { sub: userId, email } = verification.payload;

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new AppError(
      ErrorCodes.INVALID_PASSWORD,
      'Password does not meet requirements',
      400,
      { errors: passwordValidation.errors }
    );
  }

  // Find user
  const user = users.get(email);
  if (!user || user.id !== userId) {
    throw new AppError(ErrorCodes.INVALID_TOKEN, 'Invalid reset token', 400);
  }

  // Verify token is still valid (not already used)
  const storedToken = passwordResetTokens.get(userId);
  if (!storedToken || storedToken.token !== token) {
    throw new AppError(
      ErrorCodes.INVALID_TOKEN,
      'Reset token has already been used',
      400
    );
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update user
  user.passwordHash = passwordHash;
  user.updatedAt = new Date().toISOString();

  // Invalidate reset token
  passwordResetTokens.delete(userId);

  return { success: true };
}

/**
 * Refreshes access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{ accessToken: string, refreshToken: string }>} New tokens
 */
export async function refreshAccessToken(refreshToken) {
  const verification = verifyToken(refreshToken, 'refresh');

  if (!verification.valid) {
    throw new AppError(
      ErrorCodes.INVALID_TOKEN,
      verification.error || 'Invalid refresh token',
      401
    );
  }

  const { sub: userId } = verification.payload;

  // Find user by ID
  let user = null;
  for (const u of users.values()) {
    if (u.id === userId) {
      user = u;
      break;
    }
  }

  if (!user) {
    throw new AppError(ErrorCodes.INVALID_TOKEN, 'Invalid refresh token', 401);
  }

  // Check account status
  if (user.status !== 'active') {
    throw new AppError(
      ErrorCodes.ACCOUNT_INACTIVE,
      'Account is not active',
      403
    );
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    roles: user.roles,
  });

  const newRefreshToken = generateRefreshToken({
    userId: user.id,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Gets user by ID
 * @param {string} userId - User ID
 * @returns {object|null} User object or null
 */
export function getUserById(userId) {
  for (const user of users.values()) {
    if (user.id === userId) {
      return sanitizeUser(user);
    }
  }
  return null;
}

/**
 * Removes sensitive data from user object
 * @param {object} user - User object
 * @returns {object} Sanitized user object
 */
function sanitizeUser(user) {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Clears all users (for testing)
 */
export function clearUsers() {
  users.clear();
  passwordResetTokens.clear();
}

export default {
  register,
  login,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  getUserById,
  clearUsers,
};
