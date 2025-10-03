/**
 * Simple in-memory rate limiting
 * For production, use Redis/Upstash for distributed rate limiting
 */

import { RateLimitError } from './errors';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits
  auth: { windowMs: 60000, maxRequests: 5 }, // 5 req/min

  // Profile creation - very strict
  profileCreate: { windowMs: 3600000, maxRequests: 3 }, // 3 req/hour

  // Profile updates - moderate
  profileUpdate: { windowMs: 60000, maxRequests: 10 }, // 10 req/min

  // Custom links CRUD - moderate
  linksCreate: { windowMs: 60000, maxRequests: 20 }, // 20 req/min
  linksUpdate: { windowMs: 60000, maxRequests: 30 }, // 30 req/min
  linksDelete: { windowMs: 60000, maxRequests: 20 }, // 20 req/min

  // Image uploads - strict
  imageUpload: { windowMs: 60000, maxRequests: 5 }, // 5 req/min

  // Public reads - lenient
  publicRead: { windowMs: 60000, maxRequests: 100 }, // 100 req/min

  // Default - moderate
  default: { windowMs: 60000, maxRequests: 60 } // 60 req/min
};

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Use user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Use IP address for unauthenticated requests
  const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limit middleware wrapper
 */
export async function rateLimit(
  request: Request,
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const result = checkRateLimit(identifier, config);

  if (!result.allowed) {
    const resetInSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${resetInSeconds} seconds`
    );
  }
}
