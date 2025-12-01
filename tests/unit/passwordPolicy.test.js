import { describe, it, expect } from 'vitest';

import {
  validatePassword,
  getPasswordPolicy,
} from '../../src/server/lib/passwordPolicy.js';

describe('Password Policy Validator', () => {
  describe('validatePassword', () => {
    describe('valid passwords', () => {
      it('should accept a password meeting all requirements', () => {
        const result = validatePassword('Password123!');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept a password with various special characters', () => {
        const validPasswords = [
          'Password1!',
          'Password1@',
          'Password1#',
          'Password1$',
          'Password1%',
          'Password1^',
          'Password1&',
          'Password1*',
        ];

        for (const password of validPasswords) {
          const result = validatePassword(password);
          expect(result.valid).toBe(true);
        }
      });

      it('should accept a password at minimum length', () => {
        const result = validatePassword('Pass12!a');
        expect(result.valid).toBe(true);
      });

      it('should accept a password at maximum length', () => {
        const password =
          'A'.repeat(60) + 'a'.repeat(60) + '1234567!' + 'x'.repeat(1);
        expect(password.length).toBe(129);
        const result = validatePassword(password.slice(0, 128));
        expect(result.valid).toBe(true);
      });
    });

    describe('invalid passwords', () => {
      it('should reject a password shorter than minimum length', () => {
        const result = validatePassword('Pa1!aaa');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must be at least 8 characters long'
        );
      });

      it('should reject an empty password', () => {
        const result = validatePassword('');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must be at least 8 characters long'
        );
      });

      it('should reject a password exceeding maximum length', () => {
        const password = 'Password1!' + 'a'.repeat(120);
        expect(password.length).toBeGreaterThan(128);
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must not exceed 128 characters'
        );
      });

      it('should reject a password without uppercase letters', () => {
        const result = validatePassword('password123!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must contain at least one uppercase letter'
        );
      });

      it('should reject a password without lowercase letters', () => {
        const result = validatePassword('PASSWORD123!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must contain at least one lowercase letter'
        );
      });

      it('should reject a password without digits', () => {
        const result = validatePassword('Password!!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must contain at least one digit'
        );
      });

      it('should reject a password without special characters', () => {
        const result = validatePassword('Password123');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must contain at least one special character'
        );
      });

      it('should return multiple errors for passwords failing multiple rules', () => {
        const result = validatePassword('password');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors).toContain(
          'Password must contain at least one uppercase letter'
        );
        expect(result.errors).toContain(
          'Password must contain at least one digit'
        );
        expect(result.errors).toContain(
          'Password must contain at least one special character'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle non-string input', () => {
        const result = validatePassword(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be a string');
      });

      it('should handle undefined input', () => {
        const result = validatePassword(undefined);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be a string');
      });

      it('should handle number input', () => {
        const result = validatePassword(12345678);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be a string');
      });

      it('should handle object input', () => {
        const result = validatePassword({});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be a string');
      });

      it('should handle passwords with unicode characters', () => {
        const result = validatePassword('Pässword1!');
        expect(result.valid).toBe(true);
      });

      it('should handle passwords with spaces', () => {
        const result = validatePassword('Pass word1!');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('getPasswordPolicy', () => {
    it('should return the password policy configuration', () => {
      const policy = getPasswordPolicy();
      expect(policy).toEqual({
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSpecialChar: true,
        specialCharacters: expect.any(String),
      });
    });

    it('should include special characters list', () => {
      const policy = getPasswordPolicy();
      expect(policy.specialCharacters).toContain('!');
      expect(policy.specialCharacters).toContain('@');
      expect(policy.specialCharacters).toContain('#');
    });
  });
});
