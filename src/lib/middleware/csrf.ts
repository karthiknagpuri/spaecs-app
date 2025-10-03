/**
 * CSRF Protection for Next.js App Router
 * Validates requests using the Origin and Referer headers
 */

import { NextRequest } from 'next/server';

/**
 * Verify CSRF token using Origin/Referer header validation
 * For Next.js App Router, we use Origin/Referer checking instead of traditional tokens
 */
export function verifyCSRF(request: NextRequest): boolean {
  // Only check state-changing methods
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Get allowed origins from environment
  const allowedOrigins = getAllowedOrigins();

  // Check Origin header (preferred)
  if (origin) {
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some(allowed => {
      return originUrl.hostname === allowed || originUrl.hostname === host;
    });

    if (!isAllowed) {
      console.error('CSRF: Origin not allowed', { origin, allowed: allowedOrigins });
      return false;
    }

    return true;
  }

  // Fallback to Referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const isAllowed = allowedOrigins.some(allowed => {
        return refererUrl.hostname === allowed || refererUrl.hostname === host;
      });

      if (!isAllowed) {
        console.error('CSRF: Referer not allowed', { referer, allowed: allowedOrigins });
        return false;
      }

      return true;
    } catch (error) {
      console.error('CSRF: Invalid referer URL', referer);
      return false;
    }
  }

  // No Origin or Referer header - potentially suspicious
  console.warn('CSRF: No Origin or Referer header present');
  return false;
}

/**
 * Get allowed origins from environment
 */
function getAllowedOrigins(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  const productionUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://spaecs.app';

  const origins = [appUrl, productionUrl];

  // Parse URLs to get just hostnames
  return origins.map(url => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  });
}

/**
 * Middleware to apply CSRF protection
 */
export function withCSRFProtection() {
  return (request: NextRequest): { valid: boolean; error?: string } => {
    const isValid = verifyCSRF(request);

    if (!isValid) {
      return {
        valid: false,
        error: 'CSRF validation failed. Request origin not allowed.',
      };
    }

    return { valid: true };
  };
}
