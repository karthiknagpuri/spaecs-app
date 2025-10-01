import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '@/components/navigation';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}));

// Mock AuthModal component
jest.mock('@/components/auth/AuthModal', () => ({
  AuthModal: ({ isOpen, onClose, mode }: any) => (
    isOpen ? <div data-testid="auth-modal" data-mode={mode}>Auth Modal</div> : null
  )
}));

// Mock NavBar component
jest.mock('@/components/ui/tubelight-navbar', () => ({
  NavBar: ({ items, authButtons }: any) => (
    <nav data-testid="navbar">
      {items.map((item: any) => (
        <a key={item.name} href={item.url}>{item.name}</a>
      ))}
      <div data-testid="auth-buttons">{authButtons}</div>
    </nav>
  )
}));

describe('Navigation', () => {
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        signOut: jest.fn().mockResolvedValue({}),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: mockUnsubscribe } }
        })
      }
    });
  });

  describe('When User is Not Authenticated', () => {
    beforeEach(() => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });
    });

    it('should render navigation bar with all links', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Communities')).toBeInTheDocument();
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('Pricing')).toBeInTheDocument();
        expect(screen.getByText('Support')).toBeInTheDocument();
      });
    });

    it('should display sign in and get started buttons', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
      });
    });

    it('should open sign in modal when sign in button is clicked', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const signInButton = screen.getByRole('button', { name: 'Sign In' });
        expect(signInButton).toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      await userEvent.click(signInButton);

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      expect(screen.getByTestId('auth-modal')).toHaveAttribute('data-mode', 'signin');
    });

    it('should open sign up modal when get started button is clicked', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
        expect(getStartedButton).toBeInTheDocument();
      });

      const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
      await userEvent.click(getStartedButton);

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      expect(screen.getByTestId('auth-modal')).toHaveAttribute('data-mode', 'signup');
    });
  });

  describe('When User is Authenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2024-01-01'
    };

    beforeEach(() => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });
    });

    it('should display user menu button with username', async () => {
      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument(); // email prefix
      });
    });

    it('should show user menu when user button is clicked', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('test').parentElement;
        expect(userButton).toBeInTheDocument();
      });

      const userButton = screen.getByText('test').parentElement!;
      await userEvent.click(userButton);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should hide user menu when clicking outside', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('test').parentElement;
        expect(userButton).toBeInTheDocument();
      });

      const userButton = screen.getByText('test').parentElement!;
      await userEvent.click(userButton);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Click outside the menu
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    it('should handle sign out', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({});

      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('test').parentElement;
        expect(userButton).toBeInTheDocument();
      });

      const userButton = screen.getByText('test').parentElement!;
      await userEvent.click(userButton);

      const signOutButton = screen.getByText('Sign Out');
      await userEvent.click(signOutButton);

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should have correct links in user menu', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const userButton = screen.getByText('test').parentElement;
        expect(userButton).toBeInTheDocument();
      });

      const userButton = screen.getByText('test').parentElement!;
      await userEvent.click(userButton);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const profileLink = screen.getByText('Profile').closest('a');

      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('Auth State Changes', () => {
    it('should update navigation when user logs in', async () => {
      const mockSupabase = createClient();
      let authChangeCallback: any;

      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      const { rerender } = render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      });

      // Simulate user login
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      authChangeCallback('SIGNED_IN', { user: mockUser });

      // Force re-render after state change
      rerender(<Navigation />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
      });
    });

    it('should update navigation when user logs out', async () => {
      const mockSupabase = createClient();
      let authChangeCallback: any;

      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      const { rerender } = render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });

      // Simulate user logout
      authChangeCallback('SIGNED_OUT', null);

      // Force re-render after state change
      rerender(<Navigation />);

      await waitFor(() => {
        expect(screen.queryByText('test')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from auth changes on unmount', () => {
      const { unmount } = render(<Navigation />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Navigation Items', () => {
    beforeEach(() => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });
    });

    it('should have correct navigation items with icons', async () => {
      render(<Navigation />);

      await waitFor(() => {
        const navItems = [
          { name: 'Home', url: '/' },
          { name: 'Communities', url: '#communities' },
          { name: 'Features', url: '#features' },
          { name: 'Pricing', url: '#pricing' },
          { name: 'Support', url: '#support' }
        ];

        navItems.forEach(item => {
          const link = screen.getByText(item.name);
          expect(link).toBeInTheDocument();
          expect(link).toHaveAttribute('href', item.url);
        });
      });
    });
  });
});