/**
 * @jest-environment node
 */

// Mock Next.js server components before imports
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn((opts) => ({
      ...opts,
      headers: new Map(),
      status: 200,
      url: opts?.request?.url,
    })),
    redirect: jest.fn((url) => ({
      redirect: true,
      url,
      status: 307,
      headers: new Map([['location', url]]),
    })),
  },
}));

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

describe('Auth Middleware', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockEnv.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('Environment Variable Validation', () => {
    it('should handle missing SUPABASE_URL', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      expect(response).toBeDefined();
      // Should continue without authentication check
    });

    it('should handle missing SUPABASE_ANON_KEY', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      expect(response).toBeDefined();
      // Should continue without authentication check
    });
  });

  describe('Authenticated User Redirects', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });

    it('should redirect authenticated user from home to dashboard', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      expect(response?.status).toBe(307); // Temporary redirect
      expect(response?.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('should not redirect authenticated user on dashboard', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = await middleware(request);

      // Should allow access, no redirect
      expect(response?.headers.get('location')).toBeNull();
    });

    it('should allow authenticated user to access other pages', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/profile'));
      const response = await middleware(request);

      // Should allow access
      expect(response?.headers.get('location')).toBeNull();
    });
  });

  describe('Unauthenticated User Redirects', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it('should redirect unauthenticated user from dashboard to home', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should allow unauthenticated user on home page', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      // Should allow access
      expect(response?.headers.get('location')).toBeNull();
    });

    it('should allow unauthenticated user on public pages', async () => {
      const publicPages = ['/about', '/pricing', '/features'];

      for (const page of publicPages) {
        const request = new NextRequest(new URL(`http://localhost:3000${page}`));
        const response = await middleware(request);

        expect(response?.headers.get('location')).toBeNull();
      }
    });

    it('should redirect from nested dashboard routes', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard/settings'));
      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  describe('Error Handling', () => {
    it('should handle auth.getUser errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Network error' },
      });

      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      expect(response).toBeDefined();
      // Should continue without failing
    });

    it('should handle auth.getUser exceptions', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Connection failed'));

      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      expect(response).toBeDefined();
      // Should continue without failing
    });

    it('should treat errors as unauthenticated for protected routes', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'));

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = await middleware(request);

      // Should redirect to home when auth check fails on protected route
      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  describe('Session Management', () => {
    it('should work with valid session tokens', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            aud: 'authenticated',
          },
        },
        error: null,
      });

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = await middleware(request);

      // Should allow access to dashboard with valid session
      expect(response?.headers.get('location')).toBeNull();
    });

    it('should handle expired sessions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = await middleware(request);

      // Should redirect expired session to home
      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should handle invalid session tokens', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = await middleware(request);

      // Should redirect invalid session to home
      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  describe('Route Patterns', () => {
    it('should handle query parameters in URLs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard?tab=settings')
      );
      const response = await middleware(request);

      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should handle hash fragments in URLs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard#section')
      );
      const response = await middleware(request);

      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should handle trailing slashes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(new URL('http://localhost:3000/dashboard/'));
      const response = await middleware(request);

      expect(response?.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  describe('Performance', () => {
    it('should complete auth check quickly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      });

      const request = new NextRequest(new URL('http://localhost:3000/'));

      const start = Date.now();
      await middleware(request);
      const duration = Date.now() - start;

      // Should complete in under 1 second (generous for test environment)
      expect(duration).toBeLessThan(1000);
    });

    it('should not block on slow auth responses', async () => {
      // Simulate slow response
      mockSupabase.auth.getUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { user: null },
          error: null,
        }), 100))
      );

      const request = new NextRequest(new URL('http://localhost:3000/'));

      const start = Date.now();
      await middleware(request);
      const duration = Date.now() - start;

      // Should wait for the response
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Multiple Concurrent Requests', () => {
    it('should handle multiple requests independently', async () => {
      let callCount = 0;
      mockSupabase.auth.getUser.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: {
            user: callCount % 2 === 0 ? { id: 'user-123' } : null,
          },
          error: null,
        });
      });

      const requests = [
        new NextRequest(new URL('http://localhost:3000/')),
        new NextRequest(new URL('http://localhost:3000/dashboard')),
        new NextRequest(new URL('http://localhost:3000/')),
      ];

      const responses = await Promise.all(requests.map(req => middleware(req)));

      expect(responses).toHaveLength(3);
      expect(callCount).toBe(3);
    });
  });
});
