import { GET } from '@/app/auth/callback/route';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url) => ({ redirect: true, url })),
  },
}));

// Mock Request globally
global.Request = class Request {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
} as any;

describe('Auth Callback Route', () => {
  let mockSupabase: any;
  const mockOrigin = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        exchangeCodeForSession: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(),
          })),
        })),
      })),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('OAuth Error Handling', () => {
    it('should handle OAuth error from provider', async () => {
      const request = new Request(
        `${mockOrigin}/auth/callback?error=access_denied&error_description=User%20denied%20access`
      );

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error=access_denied')
      );
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error_description=User%20denied%20access')
      );
    });

    it('should handle missing authorization code', async () => {
      const request = new Request(`${mockOrigin}/auth/callback`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error=missing_code')
      );
    });
  });

  describe('Session Exchange', () => {
    it('should successfully exchange code for session', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123' };

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth-code-123');
      expect(NextResponse.redirect).toHaveBeenCalledWith(`${mockOrigin}/onboarding`);
    });

    it('should handle session exchange error', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid authorization code' },
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=invalid-code`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error=session_exchange_failed')
      );
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('Invalid%20authorization%20code')
      );
    });

    it('should handle missing user in exchange response', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: { access_token: 'token' } },
        error: null,
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error=invalid_session')
      );
    });

    it('should handle missing session in exchange response', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: null },
        error: null,
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error=invalid_session')
      );
    });
  });

  describe('Profile Lookup and Routing', () => {
    beforeEach(() => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123' };

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
    });

    it('should redirect existing user to their profile page', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { slug: 'test-user' },
              error: null,
            }),
          }),
        }),
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(`${mockOrigin}/@test-user`);
    });

    it('should redirect new user to onboarding', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(`${mockOrigin}/onboarding`);
    });

    it('should handle profile lookup error gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      // Should still succeed auth and redirect to onboarding despite profile error
      expect(NextResponse.redirect).toHaveBeenCalledWith(`${mockOrigin}/onboarding`);
    });

    it('should handle profile lookup exception gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      });

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      // Should still succeed auth and redirect to onboarding
      expect(NextResponse.redirect).toHaveBeenCalledWith(`${mockOrigin}/onboarding`);
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors during auth process', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockRejectedValue(
        new Error('Network timeout')
      );

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error=unexpected_error')
      );
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('Network%20timeout')
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockRejectedValue('Unknown error');

      const request = new Request(`${mockOrigin}/auth/callback?code=auth-code-123`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth_error=unexpected_error')
      );
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('An%20unexpected%20error%20occurred')
      );
    });
  });

  describe('URL Construction', () => {
    it('should preserve origin in redirects', async () => {
      const customOrigin = 'https://spaecs.com';
      const request = new Request(`${customOrigin}/auth/callback?error=access_denied`);

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining(customOrigin)
      );
    });

    it('should properly encode error descriptions', async () => {
      const errorDesc = 'User cancelled the authentication process';
      const request = new Request(
        `${mockOrigin}/auth/callback?error=cancelled&error_description=${encodeURIComponent(errorDesc)}`
      );

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(errorDesc))
      );
    });
  });
});
