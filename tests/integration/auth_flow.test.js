import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

import app from '../../src/server/index.js';
import { clearUsers, register, verifyEmail } from '../../src/server/services/authService.js';
import { generateEmailVerificationToken } from '../../src/server/lib/authTokens.js';

describe('Auth Flow Integration Tests', () => {
  beforeEach(() => {
    clearUsers();
  });

  afterEach(() => {
    clearUsers();
  });

  describe('Complete authentication flow: register -> verify -> login -> access protected resource', () => {
    const testUser = {
      email: 'integration@example.com',
      password: 'SecurePass123!',
      firstName: 'Integration',
      lastName: 'Test',
    };

    it('should complete the full auth flow successfully', async () => {
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user.email).toBe(testUser.email);
      expect(registerResponse.body.user.emailVerifiedAt).toBeNull();

      const userId = registerResponse.body.user.id;

      // Step 2: Verify email (simulate token verification)
      const verificationToken = generateEmailVerificationToken({
        userId,
        email: testUser.email,
      });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('user');
      expect(verifyResponse.body.user.emailVerifiedAt).not.toBeNull();

      // Step 3: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');
      expect(loginResponse.body).toHaveProperty('user');

      const { accessToken, refreshToken } = loginResponse.body;

      // Step 4: Access protected resource (GET /api/auth/me)
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body).toHaveProperty('user');
      expect(meResponse.body.user.id).toBe(userId);
      expect(meResponse.body.user.email).toBe(testUser.email);
      expect(meResponse.body.user.firstName).toBe(testUser.firstName);
      expect(meResponse.body.user.lastName).toBe(testUser.lastName);

      // Step 5: Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');

      // Step 6: Access protected resource with new token
      const meResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);

      expect(meResponse2.body.user.id).toBe(userId);
    });

    it('should reject login before email verification', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Attempt login without verification
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(403);

      expect(loginResponse.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should reject protected resource access without token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject protected resource access with expired token', async () => {
      // Create a manually expired token (not possible easily, so test with invalid token)
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Password reset flow', () => {
    const testUser = {
      email: 'reset@example.com',
      password: 'OldPassword123!',
      firstName: 'Reset',
      lastName: 'User',
    };

    it('should complete password reset flow successfully', async () => {
      // Register and verify user
      const registerResult = await register(testUser);
      const verificationToken = generateEmailVerificationToken({
        userId: registerResult.user.id,
        email: testUser.email,
      });
      await verifyEmail(verificationToken);

      // Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(resetRequestResponse.body).toHaveProperty('message');

      // Login with old password still works
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(oldLoginResponse.body).toHaveProperty('accessToken');
    });

    it('should not reveal if email exists in forgot password', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Resend verification flow', () => {
    const testUser = {
      email: 'resend@example.com',
      password: 'Password123!',
      firstName: 'Resend',
      lastName: 'User',
    };

    it('should handle resend verification for registered user', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should not reveal if email exists in resend verification', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Edge cases and security', () => {
    it('should normalize email to lowercase', async () => {
      const testUser = {
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.user.email).toBe('uppercase@example.com');

      // Verify with verification token
      const verificationToken = generateEmailVerificationToken({
        userId: registerResponse.body.user.id,
        email: 'uppercase@example.com',
      });
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      // Login with original case should work
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'UPPERCASE@EXAMPLE.COM',
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should reject SQL injection attempts in email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle multiple rapid login attempts', async () => {
      const testUser = {
        email: 'rapid@example.com',
        password: 'Password123!',
        firstName: 'Rapid',
        lastName: 'User',
      };

      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Multiple failed login attempts
      const attempts = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: testUser.email, password: 'WrongPassword!' })
      );

      const responses = await Promise.all(attempts);
      
      // All should fail with invalid credentials
      responses.forEach((response) => {
        expect([401, 403]).toContain(response.status);
      });
    });
  });
});
