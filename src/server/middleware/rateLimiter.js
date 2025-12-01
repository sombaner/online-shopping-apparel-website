/**
 * Rate Limiter Middleware
 *
 * Provides token-bucket based rate limiting for API endpoints.
 * Configuration is environment-based for flexibility.
 */

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

// Default configuration
const DEFAULT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // max requests per window
};

// Specific configurations for sensitive endpoints
const ENDPOINT_CONFIG = {
  // Auth endpoints - stricter limits
  '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  '/api/auth/register': { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  '/api/auth/forgot-password': { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  '/api/auth/reset-password': { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  '/api/auth/verify-email': { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  '/api/auth/resend-verification': { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  '/api/auth/refresh': { windowMs: 15 * 60 * 1000, maxRequests: 30 },
};

/**
 * Gets the client identifier for rate limiting
 * Uses IP address as identifier
 */
function getClientId(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Gets rate limit configuration for an endpoint
 */
function getConfig(path) {
  return ENDPOINT_CONFIG[path] || DEFAULT_CONFIG;
}

/**
 * Cleans up expired rate limit entries
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup periodically
setInterval(cleanupExpiredEntries, 60 * 1000);

/**
 * Rate limiting middleware factory
 * @param {object} [options] - Custom configuration
 * @returns {Function} Express middleware
 */
export function rateLimiter(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  return (req, res, next) => {
    const clientId = getClientId(req);
    const path = req.path;
    const endpointConfig = options.useEndpointConfig !== false ? getConfig(path) : config;
    const { windowMs, maxRequests } = endpointConfig;

    const key = `${clientId}:${path}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    entry.count += 1;
    rateLimitStore.set(key, entry);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
      });
    }

    next();
  };
}

/**
 * Creates a rate limiter for authentication routes
 */
export function authRateLimiter() {
  return rateLimiter({ useEndpointConfig: true });
}

/**
 * Clears rate limit store (for testing)
 */
export function clearRateLimitStore() {
  rateLimitStore.clear();
}

export default { rateLimiter, authRateLimiter, clearRateLimitStore };
