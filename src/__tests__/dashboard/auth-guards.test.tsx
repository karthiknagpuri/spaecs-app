import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from '@/app/dashboard/layout';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock Sidebar component
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar">{children}</div>
  ),
  SidebarBody: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-body">{children}</div>
  ),
  SidebarLink: ({ label }: { label?: string }) => (
    <div data-testid={`sidebar-link-${label?.toLowerCase().replace(' ', '-') || 'unknown'}`}>{label}</div>
  ),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Dashboard Auth Guards', () => {
  let mockRouter: any;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
        signOut: jest.fn(),
      },
    };

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Layout Authentication Guard', () => {
    it('should redirect unauthenticated user to home', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    it('should allow authenticated user access', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      render(
        <DashboardLayout>
          <div data-testid="dashboard-content">Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });
    });

    it('should handle auth errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Should not crash
      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should redirect to home when user signs out', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });

      // Simulate sign out
      authCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    it('should update user state when session changes', async () => {
      const mockUser1 = {
        id: 'user-123',
        email: 'user1@example.com',
      };

      const mockUser2 = {
        id: 'user-456',
        email: 'user2@example.com',
      };

      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });

      // Simulate session change
      authCallback('SIGNED_IN', { user: mockUser2 });

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalledWith('/');
      });
    });

    it('should unsubscribe from auth changes on unmount', async () => {
      const unsubscribeMock = jest.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      const { unmount } = render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across component remounts', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { unmount, rerender } = render(
        <DashboardLayout>
          <div>Dashboard Content 1</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });

      unmount();

      rerender(
        <DashboardLayout>
          <div>Dashboard Content 2</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle expired session', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    it('should handle invalid token', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Concurrent Auth Checks', () => {
    it('should handle multiple concurrent auth checks', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      let resolveAuth: any;
      mockSupabase.auth.getUser.mockImplementation(
        () => new Promise(resolve => {
          resolveAuth = resolve;
        })
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Resolve auth check
      resolveAuth({ data: { user: mockUser }, error: null });

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    it('should not cause race conditions with rapid auth state changes', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Rapid auth state changes
      authCallback('SIGNED_IN', { user: mockUser });
      authCallback('SIGNED_OUT', null);
      authCallback('SIGNED_IN', { user: mockUser });

      await waitFor(() => {
        // Final state should be signed in
        expect(mockRouter.push).toHaveBeenCalledTimes(1);
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Performance', () => {
    it('should complete auth check quickly', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const start = Date.now();

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });

      const duration = Date.now() - start;

      // Should complete in under 1 second (generous for test environment)
      expect(duration).toBeLessThan(1000);
    });

    it('should not block rendering during auth check', async () => {
      mockSupabase.auth.getUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: '123', email: 'test@example.com' } },
          error: null,
        }), 100))
      );

      render(
        <DashboardLayout>
          <div data-testid="content">Dashboard Content</div>
        </DashboardLayout>
      );

      // Content should be rendered immediately
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
});
