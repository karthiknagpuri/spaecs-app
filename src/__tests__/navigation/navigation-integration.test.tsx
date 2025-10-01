import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '@/components/navigation';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock NavBar component
jest.mock('@/components/ui/tubelight-navbar', () => ({
  NavBar: ({ items, authButtons }: any) => (
    <div data-testid="navbar">
      {items.map((item: any) => (
        <a key={item.name} href={item.url}>{item.name}</a>
      ))}
      <div data-testid="auth-buttons">{authButtons}</div>
    </div>
  ),
}));

// Mock AuthModal component
jest.mock('@/components/auth/AuthModal', () => ({
  AuthModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="auth-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    ) : null,
}));

describe('Navigation Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
        signOut: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it('should show Sign In button for unauthenticated users', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

    it('should open auth modal when Sign In is clicked', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      const signInButton = screen.getByText('Sign In');
      await userEvent.click(signInButton);

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    it('should close auth modal when close button is clicked', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const signInButton = screen.getByText('Sign In');
        userEvent.click(signInButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-modal');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
      });
    });

    it('should not show user menu for unauthenticated users', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User', () => {
    const mockUser = {
      id: 'user-123',
      email: 'creator@example.com',
      user_metadata: { name: 'Creator' },
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should show user menu for authenticated users', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('creator')).toBeInTheDocument();
      });
    });

    it('should display email username in user button', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('creator');
        expect(userButton).toBeInTheDocument();
      });
    });

    it('should toggle user menu when user button is clicked', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('creator')).toBeInTheDocument();
      });

      const userButton = screen.getByText('creator');

      // Click to open menu
      await userEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      // Click again to close menu
      await userEvent.click(userButton);

      await waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    it('should have Dashboard link in user menu', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('creator');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      });
    });

    it('should have Profile link in user menu', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('creator');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        const profileLink = screen.getByText('Profile').closest('a');
        expect(profileLink).toHaveAttribute('href', '/profile');
      });
    });

    it('should call signOut when Sign Out is clicked', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('creator');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      const signOutButton = screen.getByText('Sign Out');
      await userEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });
    });

    it('should close user menu after sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('creator');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        const signOutButton = screen.getByText('Sign Out');
        userEvent.click(signOutButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    it('should not show Sign In button for authenticated users', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should update navigation when user signs in', async () => {
      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      // Simulate sign in
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
      };

      authCallback('SIGNED_IN', { user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('newuser')).toBeInTheDocument();
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      });
    });

    it('should update navigation when user signs out', async () => {
      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'user@example.com' },
        },
        error: null,
      });

      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('user')).toBeInTheDocument();
      });

      // Simulate sign out
      authCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.queryByText('user')).not.toBeInTheDocument();
      });
    });

    it('should unsubscribe from auth changes on unmount', async () => {
      const unsubscribeMock = jest.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { unmount } = render(<Navigation />);

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Click Outside Menu', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should close menu when clicking outside', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('user');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Click outside menu
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    it('should not close menu when clicking inside', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('user');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Click inside menu (on Dashboard link)
      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.mouseDown(dashboardLink);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      render(<Navigation />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });
    });

    it('should handle sign out errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabase.auth.signOut.mockRejectedValue(new Error('Sign out failed'));

      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('test');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        const signOutButton = screen.getByText('Sign Out');
        userEvent.click(signOutButton);
      });

      // Should not crash
      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have minimum touch target sizes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<Navigation />);

      await waitFor(() => {
        const signInButton = screen.getByText('Sign In');
        expect(signInButton).toHaveClass('min-h-[44px]');
      });
    });

    it('should have accessible user menu items', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('test');
        userEvent.click(userButton);
      });

      await waitFor(() => {
        const menuItems = [
          screen.getByText('Dashboard'),
          screen.getByText('Profile'),
          screen.getByText('Sign Out'),
        ];

        menuItems.forEach(item => {
          expect(item.closest('a, button')).toHaveClass('min-h-[44px]');
        });
      });
    });
  });
});
