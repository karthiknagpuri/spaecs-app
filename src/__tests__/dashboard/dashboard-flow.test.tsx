import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
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

describe('Dashboard Flow Tests', () => {
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
      },
    };

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Authentication Guards', () => {
    it('should redirect unauthenticated user to home', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    it('should not render content for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText('Welcome back!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Content for Authenticated Users', () => {
    const mockUser = {
      id: 'user-123',
      email: 'creator@example.com',
      user_metadata: { name: 'Creator Name' },
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should display dashboard content for authenticated user', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      });
    });

    it('should display user email in header', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('creator')).toBeInTheDocument();
      });
    });

    it('should display all stats cards', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('Gifts')).toBeInTheDocument();
      });
    });

    it('should display stats values with correct formatting', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Check for 0 values (placeholder data)
        const statsValues = screen.getAllByText('0');
        expect(statsValues.length).toBeGreaterThan(0);
      });
    });

    it('should display revenue with currency symbol', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/₹/)).toBeInTheDocument();
      });
    });

    it('should display quick actions section', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('should display all quick action cards', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Event')).toBeInTheDocument();
        expect(screen.getByText('View Analytics')).toBeInTheDocument();
        expect(screen.getByText('Manage Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should have correct links for quick actions', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const createEventLink = screen.getByText('Create Event').closest('a');
        expect(createEventLink).toHaveAttribute('href', '/dashboard/events');

        const analyticsLink = screen.getByText('View Analytics').closest('a');
        expect(analyticsLink).toHaveAttribute('href', '/dashboard/analytics');

        const profileLink = screen.getByText('Manage Profile').closest('a');
        expect(profileLink).toHaveAttribute('href', '/dashboard/profile');
      });
    });

    it('should display recent activity section', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
      });
    });

    it('should display getting started tips', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
        expect(screen.getByText('1. Complete Your Profile')).toBeInTheDocument();
        expect(screen.getByText('2. Create Your First Event')).toBeInTheDocument();
        expect(screen.getByText('3. Share Your Profile')).toBeInTheDocument();
      });
    });

    it('should display last login indicator', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Last login/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner initially', async () => {
      mockSupabase.auth.getUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: '123', email: 'test@example.com' } },
          error: null,
        }), 100))
      );

      render(<DashboardPage />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'));

      render(<DashboardPage />);

      // Should not crash the app
      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).toBeInTheDocument();
      });
    });

    it('should handle missing user data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layouts', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      const { container } = render(<DashboardPage />);

      await waitFor(() => {
        const grids = container.querySelectorAll('.grid');
        expect(grids.length).toBeGreaterThan(0);
      });
    });

    it('should apply mobile-first responsive classes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      const { container } = render(<DashboardPage />);

      await waitFor(() => {
        const hasResponsiveClasses = container.innerHTML.includes('md:');
        expect(hasResponsiveClasses).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should have proper heading hierarchy', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Welcome back!');

        const h2Elements = screen.getAllByRole('heading', { level: 2 });
        expect(h2Elements.length).toBeGreaterThan(0);
      });
    });

    it('should have semantic links for navigation', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
      });
    });
  });
});
