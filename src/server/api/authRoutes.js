/**
 * Auth Routes
 *
 * Handles authentication-related API endpoints:
 * - POST /api/auth/register - User registration
 * - POST /api/auth/login - User login
 * - POST /api/auth/verify-email - Email verification
 * - POST /api/auth/resend-verification - Resend verification email
 * - POST /api/auth/forgot-password - Request password reset
 * - POST /api/auth/reset-password - Reset password with token
 * - POST /api/auth/refresh - Refresh access token
 * - GET /api/auth/me - Get current user (protected)
 */

import { Router } from 'express';
import { z } from 'zod';

import {
  register,
  login,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  getUserById,
} from '../services/authService.js';
import { getPasswordPolicy } from '../lib/passwordPolicy.js';
import { verifyToken } from '../lib/authTokens.js';
import { createErrorEnvelope, ErrorCodes, AppError } from '../lib/errors.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter());

// Request validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  contactNumber: z.string().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const emailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Authentication middleware
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(
      createErrorEnvelope(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    );
  }

  const token = authHeader.substring(7);
  const verification = verifyToken(token, 'access');

  if (!verification.valid) {
    return res.status(401).json(
      createErrorEnvelope(
        ErrorCodes.UNAUTHORIZED,
        verification.error || 'Invalid token'
      )
    );
  }

  req.user = {
    id: verification.payload.sub,
    email: verification.payload.email,
    roles: verification.payload.roles,
  };

  next();
}

/**
 * Error handler helper
 */
function handleError(error, res) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(error.toEnvelope());
  }

  if (error instanceof z.ZodError) {
    return res.status(400).json(
      createErrorEnvelope(ErrorCodes.VALIDATION_ERROR, 'Validation failed', null, {
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    );
  }

  console.error('Unhandled error:', error);
  return res.status(500).json(
    createErrorEnvelope(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
  );
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await register(data);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: result.user,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and issue tokens
 */
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data);

    res.json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */
router.post('/verify-email', async (req, res) => {
  try {
    const data = verifyEmailSchema.parse(req.body);
    const result = await verifyEmail(data.token);

    res.json({
      message: result.alreadyVerified
        ? 'Email already verified'
        : 'Email verified successfully',
      user: result.user,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const data = emailSchema.parse(req.body);
    await resendVerification(data.email);

    res.json({
      message: 'If an account exists with this email, a verification email has been sent.',
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const data = emailSchema.parse(req.body);
    await requestPasswordReset(data.email);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await resetPassword(data);

    res.json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const data = refreshSchema.parse(req.body);
    const result = await refreshAccessToken(data.refreshToken);

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, (req, res) => {
  const user = getUserById(req.user.id);

  if (!user) {
    return res.status(404).json(
      createErrorEnvelope(ErrorCodes.NOT_FOUND, 'User not found')
    );
  }

  res.json({ user });
});

/**
 * GET /api/auth/password-policy
 * Get password policy requirements
 */
router.get('/password-policy', (_req, res) => {
  res.json({ policy: getPasswordPolicy() });
});

export { authenticate };
export default router;
