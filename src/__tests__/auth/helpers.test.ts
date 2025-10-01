import {
  signInWithGoogle,
  signOut,
  getSession,
  getCurrentUser,
  isAuthenticated,
  refreshSession,
  getUserMetadata,
  shouldRefreshSession,
} from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock window.location
delete (global as any).window;
(global as any).window = { location: { origin: 'http://localhost:3000' } };

describe('Auth Helpers', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        refreshSession: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('signInWithGoogle', () => {
    it('should successfully initiate Google OAuth', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      const result = await signInWithGoogle();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    });

    it('should use custom redirect URL when provided', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      await signInWithGoogle('http://localhost:3000/custom/callback');

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            redirectTo: 'http://localhost:3000/custom/callback',
          }),
        })
      );
    });

    it('should handle OAuth errors', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: { message: 'OAuth failed', name: 'OAuthError' },
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('OAuth failed');
      expect(result.error?.code).toBe('OAuthError');
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(new Error('Network error'));

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network error');
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed', name: 'SignOutError' },
      });

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Sign out failed');
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.auth.signOut.mockRejectedValue(new Error('Network error'));

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getSession', () => {
    it('should return session when available', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: '123', email: 'test@example.com' },
      };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await getSession();

      expect(session).toEqual(mockSession);
    });

    it('should return null when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it('should return null on error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it('should handle exceptions', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'));

      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return null on error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User error' },
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      });

      const authenticated = await isAuthenticated();

      expect(authenticated).toBe(true);
    });

    it('should return false when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const authenticated = await isAuthenticated();

      expect(authenticated).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should successfully refresh session', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({ error: null });

      const result = await refreshSession();

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
    });

    it('should handle refresh errors', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        error: { message: 'Refresh failed', name: 'RefreshError' },
      });

      const result = await refreshSession();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Refresh failed');
    });
  });

  describe('getUserMetadata', () => {
    it('should return user metadata when available', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        app_metadata: {
          provider: 'google',
        },
      };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const metadata = await getUserMetadata();

      expect(metadata).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        provider: 'google',
      });
    });

    it('should use full_name when name not available', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Full Name',
        },
        app_metadata: {},
      };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const metadata = await getUserMetadata();

      expect(metadata?.name).toBe('Full Name');
    });

    it('should use picture when avatar_url not available', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          picture: 'https://example.com/picture.jpg',
        },
        app_metadata: {},
      };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const metadata = await getUserMetadata();

      expect(metadata?.avatar).toBe('https://example.com/picture.jpg');
    });

    it('should return null when user not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const metadata = await getUserMetadata();

      expect(metadata).toBeNull();
    });
  });

  describe('shouldRefreshSession', () => {
    it('should return true when session expires soon', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresInSeconds = nowSeconds + 120; // 2 minutes

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: expiresInSeconds,
          },
        },
        error: null,
      });

      const shouldRefresh = await shouldRefreshSession(5);

      expect(shouldRefresh).toBe(true);
    });

    it('should return false when session not expiring soon', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresInSeconds = nowSeconds + 600; // 10 minutes

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: expiresInSeconds,
          },
        },
        error: null,
      });

      const shouldRefresh = await shouldRefreshSession(5);

      expect(shouldRefresh).toBe(false);
    });

    it('should return false when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const shouldRefresh = await shouldRefreshSession();

      expect(shouldRefresh).toBe(false);
    });

    it('should return true on error', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'));

      const shouldRefresh = await shouldRefreshSession();

      expect(shouldRefresh).toBe(true);
    });

    it('should use custom threshold', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresInSeconds = nowSeconds + 480; // 8 minutes

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: expiresInSeconds,
          },
        },
        error: null,
      });

      const shouldRefresh10 = await shouldRefreshSession(10);
      const shouldRefresh5 = await shouldRefreshSession(5);

      expect(shouldRefresh10).toBe(true);
      expect(shouldRefresh5).toBe(false);
    });
  });
});
