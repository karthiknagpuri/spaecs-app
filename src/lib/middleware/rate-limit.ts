/**
 * Simple in-memory rate limiter for API endpoints
 * For production, consider using Redis-based rate limiting (Upstash, Vercel KV, etc.)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check if request is rate limited
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with success status and remaining requests
   */
  public check(
    identifier: string,
    limit: number,
    windowMs: number
  ): {
    success: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No entry or expired entry - create new
    if (!entry || entry.resetTime < now) {
      const resetTime = now + windowMs;
      this.store.set(identifier, {
        count: 1,
        resetTime,
      });
      return {
        success: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    // Entry exists and is valid
    if (entry.count < limit) {
      entry.count++;
      this.store.set(identifier, entry);
      return {
        success: true,
        remaining: limit - entry.count,
        resetTime: entry.resetTime,
      };
    }

    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  public reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Get current count for an identifier
   */
  public getCount(identifier: string): number {
    const entry = this.store.get(identifier);
    if (!entry || entry.resetTime < Date.now()) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Cleanup and stop intervals
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Payment endpoints - strict limits
  payment: {
    limit: 10, // 10 requests
    windowMs: 60 * 1000, // per minute
  },
  // Webhook endpoints - moderate limits
  webhook: {
    limit: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
  },
  // API endpoints - generous limits
  api: {
    limit: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
  },
  // Authentication endpoints - moderate limits
  auth: {
    limit: 5, // 5 requests
    windowMs: 60 * 1000, // per minute
  },
} as const;

/**
 * Get identifier from request (IP address or user ID)
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers (for reverse proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export function rateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
) {
  return rateLimiter.check(identifier, config.limit, config.windowMs);
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimiter.reset(identifier);
}

/**
 * Middleware helper to apply rate limiting to Next.js API routes
 */
export function withRateLimit(
  config: { limit: number; windowMs: number } = RATE_LIMITS.api
) {
  return {
    check: (identifier: string) => rateLimiter.check(identifier, config.limit, config.windowMs),
    reset: (identifier: string) => rateLimiter.reset(identifier),
  };
}

export default rateLimiter;
