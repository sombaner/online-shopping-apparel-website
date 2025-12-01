/**
 * Password Policy Validator
 *
 * Enforces password complexity requirements:
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

const RULES = {
  minLength: {
    test: (password) => password.length >= MIN_LENGTH,
    message: `Password must be at least ${MIN_LENGTH} characters long`,
  },
  maxLength: {
    test: (password) => password.length <= MAX_LENGTH,
    message: `Password must not exceed ${MAX_LENGTH} characters`,
  },
  uppercase: {
    test: (password) => /[A-Z]/.test(password),
    message: 'Password must contain at least one uppercase letter',
  },
  lowercase: {
    test: (password) => /[a-z]/.test(password),
    message: 'Password must contain at least one lowercase letter',
  },
  digit: {
    test: (password) => /\d/.test(password),
    message: 'Password must contain at least one digit',
  },
  specialChar: {
    test: (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
    message: 'Password must contain at least one special character',
  },
};

/**
 * Validates a password against the password policy
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Password must be a string'],
    };
  }

  const errors = [];

  for (const [, rule] of Object.entries(RULES)) {
    if (!rule.test(password)) {
      errors.push(rule.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Returns the password policy requirements
 * @returns {object} Password policy configuration
 */
export function getPasswordPolicy() {
  return {
    minLength: MIN_LENGTH,
    maxLength: MAX_LENGTH,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
    specialCharacters: '!@#$%^&*()_+-=[]{};\':"\\|,.<>/?`~',
  };
}

export default { validatePassword, getPasswordPolicy };
