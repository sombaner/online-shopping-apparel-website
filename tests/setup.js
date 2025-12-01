/**
 * Vitest Test Setup
 *
 * This file is run before each test file and configures the test environment.
 */

// Set environment variables for testing
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-do-not-use-in-production';
process.env.NODE_ENV = 'test';
