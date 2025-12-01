import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

import app from '../../src/server/index.js';
import { clearUsers } from '../../src/server/services/authService.js';

describe('Auth API Contract Tests', () => {
  beforeEach(() => {
    clearUsers();
  });

  afterEach(() => {
    clearUsers();
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', validUser.email);
      expect(response.body.user).toHaveProperty('firstName', validUser.firstName);
      expect(response.body.user).toHaveProperty('lastName', validUser.lastName);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: 'weak' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_PASSWORD');
      expect(response.body.error).toHaveProperty('details');
    });

    it('should reject duplicate email registration', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body.error).toHaveProperty('code', 'EMAIL_ALREADY_EXISTS');
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should reject login for unverified email', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password })
        .expect(403);

      expect(response.body.error).toHaveProperty('code', 'EMAIL_NOT_VERIFIED');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' })
        .expect(401);

      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject login with wrong password', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword123!' })
        .expect(401);

      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should reject verification without token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({})
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should return success even for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'NewPassword123!' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should reject reset without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({})
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('GET /api/auth/password-policy', () => {
    it('should return password policy', async () => {
      const response = await request(app)
        .get('/api/auth/password-policy')
        .expect(200);

      expect(response.body).toHaveProperty('policy');
      expect(response.body.policy).toHaveProperty('minLength');
      expect(response.body.policy).toHaveProperty('maxLength');
      expect(response.body.policy).toHaveProperty('requireUppercase');
      expect(response.body.policy).toHaveProperty('requireLowercase');
      expect(response.body.policy).toHaveProperty('requireDigit');
      expect(response.body.policy).toHaveProperty('requireSpecialChar');
    });
  });
});
